"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Upload, 
  Brain, 
  ChevronLeft, 
  Play, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Maximize2,
  BookOpen,
  Sparkles,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { PDFDocument } from 'pdf-lib';
import { SmartNotesList } from "@/components/smart-notes/SmartNotesList";
import { SUPPORTED_MODELS, AIProvider } from "@/lib/ai/client";

interface Material {
  id: string;
  title: string;
  createdAt: string;
  mcqCount: number;
  notesCount: number;
  sscNotesCount: number;
  upscNotesCount: number;
  status: string;
}

interface Classroom {
  id: string;
  name: string;
  subject: string;
}

export default function ClassroomPage() {
  const params = useParams();
  const classroomId = params.id as string;
  
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Material State
  const [newMaterial, setNewMaterial] = useState({ title: "", content: "" });
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'text' | 'pdf'>("text");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedPdfUrl, setExtractedPdfUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pageSelection, setPageSelection] = useState("1-5");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.0-flash-001");
  const [selectedProviderType, setSelectedProviderType] = useState<AIProvider>("OpenRouter");
  const [selectedAccount, setSelectedAccount] = useState(1);
  
  // Notes Modal State
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Generation State
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>("");

  useEffect(() => {
    fetchClassroomData();
  }, [classroomId]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (extractedPdfUrl) URL.revokeObjectURL(extractedPdfUrl);
    };
  }, [previewUrl, extractedPdfUrl]);

  const fetchClassroomData = async () => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}`);
      const data = await res.json();
      setClassroom(data.classroom);
      setMaterials(data.materials);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material? This will also delete all associated smart notes and MCQs.")) return;
    
    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        // Refresh local state or refetch
        fetchClassroomData();
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete material due to a network error.");
    }
  };

  const parsePageSelection = (selection: string) => {
    // Matches "33" or "33-36"
    const parts = selection.split('-').map(p => p.trim());
    const start = parseInt(parts[0]) || 1;
    const end = parseInt(parts[1]) || start;
    return { start, end };
  };

  const handleExtractPreview = async () => {
    if (!file || !pageSelection) return;
    setIsExtracting(true);
    try {
      const { start, end } = parsePageSelection(pageSelection);
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();
      
      const totalPages = srcDoc.getPageCount();
      // Adjust 1-based index to 0-based
      // Validate range
      const validStart = Math.max(1, Math.min(start, totalPages));
      const validEnd = Math.max(validStart, Math.min(end, totalPages));
      
      // Create array of indices to copy
      const indices = [];
      for (let i = validStart - 1; i < validEnd; i++) {
        indices.push(i);
      }

      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const newUrl = URL.createObjectURL(blob);
      setExtractedPdfUrl(newUrl);
    } catch (error) {
      console.error("Extraction failed", error);
      alert("Failed to extract pages. Please check the page numbers.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let res;
      let data;

      if (mode === 'text') {
          // Check if content is empty
          if (!newMaterial.content.trim()) {
            throw new Error("Please enter some text content");
          }

          res = await fetch(`/api/classrooms/${classroomId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newMaterial),
          });
      } else {
          // PDF Upload Mode
          if (!file) throw new Error("Please select a PDF file");
          if (!newMaterial.title) throw new Error("Please enter a chapter title");

          const { start, end } = parsePageSelection(pageSelection);

          // If user extracted specific pages, we ideally upload the extracted blob
          // But for now, let's stick to the server-side slicing logic OR 
          // we could send the extracted blob instead of the original file.
          // To keep it simple and consistent with previous backend logic:
          // We still send the original file + start/end page params.
          
          const formData = new FormData();
          formData.append("file", file);
          formData.append("classroomId", classroomId);
          formData.append("title", newMaterial.title);
          formData.append("startPage", start.toString());
          formData.append("endPage", end.toString());

          res = await fetch("/api/upload-pdf", {
             method: "POST",
             body: formData
          });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      data = await res.json();

      if (data) {
        // Show generating status
        setGeneratingFor(data.id);
        setGenerationStatus("Generating smart notes with memory techniques...");
        
        try {
          // Wait for MCQ and Smart Notes generation to complete
          const mcqRes = await fetch("/api/generate-mcq", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              materialId: data.id, 
              modelId: selectedModel,
              accountIndex: selectedAccount 
            }),
          });
          
          const mcqData = await mcqRes.json();
          
          if (mcqRes.ok && mcqData.success) {
            setGenerationStatus(`✅ Created ${mcqData.smartNotes?.count || 0} notes and ${mcqData.mcqs?.count || 0} MCQs!`);
            
            // Wait a moment to show success, then open notes modal
            setTimeout(() => {
              setGeneratingFor(null);
              setIsModalOpen(false);
              setNewMaterial({ title: "", content: "" });
              setFile(null);
              setPreviewUrl(null);
              setExtractedPdfUrl(null);
              setPageSelection("1-5");
              
              // Fetch updated data and show notes
              fetchClassroomData().then(() => {
                setSelectedMaterial({ ...data, title: newMaterial.title, notesCount: mcqData.smartNotes?.count || 0 });
                setNotesModalOpen(true);
              });
            }, 1500);
          } else {
            throw new Error(mcqData.error || "Generation failed");
          }
        } catch (genError: any) {
          setGenerationStatus(`❌ Error: ${genError.message}`);
          setGeneratingFor(null);
        }
      }

    } catch (error: any) {
       console.error("Upload failed", error);
       alert(error.message); // Simple alert for now
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setExtractedPdfUrl(null); // Reset extracted view
      if (selectedFile.type === "application/pdf") {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      }
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        </div>
     );
  }

  if (!classroom) return <div>Classroom not found</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Navigation */}
      <nav className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Sessions
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-2 w-32 rounded-full bg-white/10">
            <div className="h-full w-[78%] rounded-full bg-indigo-500" />
          </div>
          <span className="text-xs font-bold text-indigo-400">78% COMPLETE</span>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          
          {/* Left Column: Materials */}
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">{classroom.name}</h1>
                <p className="text-white/40">{classroom.subject} • {materials.length} Materials Uploaded</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-6 py-3 font-semibold hover:border-indigo-500/50 hover:bg-white/10 transition-all"
              >
                <Plus className="h-5 w-5" />
                ADD CHAPTER
              </button>
            </div>

            <div className="grid gap-4">
               {materials.length === 0 ? (
                 <div className="p-10 text-center border border-white/5 rounded-xl bg-white/[0.02]">
                    <p className="text-white/30">No materials yet. Add text to generate MCQs.</p>
                 </div>
               ) : (
                  materials.map((material, idx) => (
                    <MaterialRow 
                      key={material.id} 
                      material={material} 
                      index={idx} 
                      classroomId={classroomId}
                      onViewNotes={() => {
                        setSelectedMaterial(material);
                        setNotesModalOpen(true);
                      }}
                      onDelete={() => handleDeleteMaterial(material.id)}
                    />
                  ))
               )}
            </div>
          </div>

          {/* Right Column: AI Stats & Smart Notes */}
          <aside className="w-full lg:w-96 space-y-6">
            {/* Quick Quiz Card */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 shadow-2xl shadow-indigo-500/20">
              <div className="flex items-center justify-between mb-6">
                <Brain className="h-10 w-10 text-white/80" />
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">LEVEL: INTERMEDIATE</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Test?</h2>
              <p className="text-white/70 text-sm mb-6">Start a rapid-fire session based on all materials in this classroom.</p>
              <Link href={`/quiz/${classroomId}`}>
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <Play className="h-5 w-5 fill-indigo-600" />
                  START FULL QUIZ
                </button>
              </Link>
            </div>

            {/* AI Insights Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Focus Areas</h3>
              <div className="space-y-4">
                <FocusItem label="Article 14-18 (Equality)" level="Weak" color="text-red-400" />
                <FocusItem label="Writ Jurisdiction" level="Strong" color="text-green-400" />
                <FocusItem label="Preamble Keywords" level="Average" color="text-yellow-400" />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add Material Content"
        className={mode === 'pdf' ? "max-w-4xl" : "max-w-md"}
      >
        <div className="flex gap-4 border-b border-white/10 pb-4 mb-4">
            <button 
                onClick={() => setMode("text")}
                className={`flex-1 pb-2 text-sm font-bold transition-all ${mode === 'text' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/40 hover:text-white'}`}
            >
                PASTE TEXT
            </button>
            <button 
                onClick={() => setMode("pdf")}
                className={`flex-1 pb-2 text-sm font-bold transition-all ${mode === 'pdf' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/40 hover:text-white'}`}
            >
                UPLOAD PDF
            </button>
        </div>

        <form onSubmit={handleAddMaterial} className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase">Chapter Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Fundamental Rights"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-indigo-500 focus:outline-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  AI Provider (Account)
                </label>
                <select 
                  value={selectedProviderType === "OpenRouter" ? selectedAccount : "NVIDIA"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "NVIDIA") {
                      setSelectedProviderType("NVIDIA");
                      // Switch to first NVIDIA model
                      const firstNvidia = SUPPORTED_MODELS.find(m => m.provider === "NVIDIA");
                      if (firstNvidia) setSelectedModel(firstNvidia.id);
                    } else {
                      setSelectedProviderType("OpenRouter");
                      setSelectedAccount(Number(val));
                      // Switch to first OpenRouter model if current is not OR
                      const currentModel = SUPPORTED_MODELS.find(m => m.id === selectedModel);
                      if (currentModel?.provider !== "OpenRouter") {
                        const firstOR = SUPPORTED_MODELS.find(m => m.provider === "OpenRouter");
                        if (firstOR) setSelectedModel(firstOR.id);
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-black font-bold focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value={1}>OpenRouter Account 1</option>
                  <option value={2}>OpenRouter Account 2</option>
                  <option value="NVIDIA">NVIDIA (Moonshot)</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase flex items-center gap-2">
                  <Brain className="h-3 w-3" />
                  Select AI Brain (Intelligence)
                </label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-black font-bold focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
                >
                  {SUPPORTED_MODELS
                    .filter(m => m.provider === selectedProviderType)
                    .map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.id.includes(':free') ? '(FREE)' : ''}
                      </option>
                    ))
                  }
                </select>
            </div>

            {mode === 'text' ? (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase">
                        Raw Content (Paste Text)
                    </label>
                    <textarea 
                      required
                      rows={8}
                      placeholder="Paste the text from your PDF here for AI analysis..."
                      value={newMaterial.content}
                      onChange={(e) => setNewMaterial({...newMaterial, content: e.target.value})}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white text-sm focus:border-indigo-500 focus:outline-none resize-none"
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-6 ">
                  <div className="flex gap-6 flex-col md:flex-row">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-white/60 uppercase">
                              Select PDF File
                          </label>
                          <div className="relative rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all">
                              <input 
                                  type="file"
                                  accept=".pdf"
                                  required
                                  onChange={handleFileChange}
                                  className="absolute inset-0 cursor-pointer opacity-0"
                              />
                              <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-white/50">
                                  {file ? (
                                      <>
                                          <FileText className="h-8 w-8 text-indigo-400" />
                                          <span className="text-white font-medium">{file.name}</span>
                                          <span className="text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                      </>
                                  ) : (
                                      <>
                                          <Upload className="h-8 w-8" />
                                          <span>Click to browse or drag PDF here</span>
                                      </>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-white/60 uppercase">
                              Select Pages (e.g. "5" or "5-10")
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. 5 or 5-10"
                            value={pageSelection}
                            onChange={(e) => {
                                setPageSelection(e.target.value);
                            }}
                            pattern="^\d+(-\d+)?$"
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-indigo-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleExtractPreview}
                            disabled={isExtracting || !file}
                            className="w-full rounded-lg bg-white/5 border border-white/10 py-2 text-xs font-bold text-indigo-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            {isExtracting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Maximize2 className="h-3 w-3" />}
                            PREVIEW & EXTRACT PAGES
                          </button>
                          <p className="text-[10px] text-white/30">
                              Format: Enter a single page number (e.g. "33") or a range (e.g. "33-36").
                          </p>
                      </div>

                      <p className="text-xs text-indigo-400/80 bg-indigo-500/10 p-3 rounded-lg flex gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          Recommendation: Keep selection under 5 pages for best AI results.
                      </p>
                    </div>

                    {/* Preview Section */}
                    {(previewUrl || extractedPdfUrl) && (
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-white/60 uppercase flex items-center gap-2">
                                {extractedPdfUrl ? (
                                    <span className="text-green-400 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Extracted View
                                    </span>
                                ) : (
                                    `Preview (Full PDF - Page ${parsePageSelection(pageSelection).start})`
                                )}
                            </label>
                            
                            {extractedPdfUrl ? (
                                <button 
                                  type="button"
                                  onClick={() => setExtractedPdfUrl(null)}
                                  className="text-[10px] font-bold text-white/40 hover:text-white underline"
                                >
                                    Reset to Full PDF
                                </button>
                            ) : (
                                <button 
                                  type="button"
                                  onClick={() => window.open(previewUrl!, '_blank')}
                                  className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    <Maximize2 className="h-3 w-3" />
                                    <span className="uppercase">Expand</span>
                                </button>
                            )}
                        </div>
                        <iframe 
                          src={`${extractedPdfUrl || previewUrl}#page=${extractedPdfUrl ? 1 : parsePageSelection(pageSelection).start}&toolbar=0&view=FitH`}
                          className={`w-full h-80 rounded-xl border ${extractedPdfUrl ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-white/10'} bg-white/5`}
                          title="PDF Preview"
                        />
                      </div>
                    )}
                  </div>
                </div>
            )}

            {/* Generation Status */}
            {generatingFor && (
              <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                  <p className="text-sm text-indigo-300">{generationStatus}</p>
                </div>
              </div>
            )}

            <button 
                disabled={uploading || !!generatingFor}
                className="w-full mt-4 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500 disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {uploading ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {mode === 'pdf' ? "Processing PDF..." : "Uploading..."}
                    </>
                ) : generatingFor ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating Smart Notes & MCQs...
                    </>
                ) : (
                    <>
                        <Sparkles className="h-5 w-5" />
                        {mode === 'pdf' ? "Extract & Generate Smart Notes" : "Generate Smart Notes & MCQs"}
                    </>
                )}
            </button>
        </form>
      </Modal>

      {/* Smart Notes Modal */}
      <Modal 
        isOpen={notesModalOpen} 
        onClose={() => {
          setNotesModalOpen(false);
          setSelectedMaterial(null);
        }} 
        title={`Smart Notes: ${selectedMaterial?.title || ''}`}
        className="max-w-5xl max-h-[85vh] overflow-y-auto"
      >
        {selectedMaterial && (
          <SmartNotesList 
            materialId={selectedMaterial.id} 
            materialTitle={selectedMaterial.title}
          />
        )}
      </Modal>
    </div>
  );
}

// Subcomponents
function MaterialRow({ 
  material, 
  index, 
  classroomId,
  onViewNotes,
  onDelete
}: { 
  material: Material; 
  index: number; 
  classroomId: string;
  onViewNotes: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/5 hover:border-white/10"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{material.title}</h3>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="flex items-center gap-1">
               <Clock className="h-3 w-3" />
               {new Date(material.createdAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span className={material.status === 'Analyzed' ? 'text-green-400' : 'text-yellow-400'}>
                {material.status}
            </span>
            {parseInt(String(material.notesCount)) > 0 && (
              <>
                <span>•</span>
                <span className="text-indigo-400">
                  {material.notesCount} notes
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
         {parseInt(String(material.notesCount)) > 0 && (
           <button 
             onClick={(e) => { e.preventDefault(); onViewNotes(); }}
             className="flex items-center gap-2 rounded-lg bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-all"
           >
              <BookOpen className="h-3 w-3" />
              VIEW NOTES
           </button>
         )}
         {material.status === 'Analyzed' && (
             <Link href={`/quiz/${material.id}`}>
                 <button className="flex items-center gap-2 rounded-lg bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all">
                    <Play className="h-3 w-3 fill-indigo-400" />
                    QUIZ
                 </button>
             </Link>
         )}
         <button 
           onClick={(e) => { e.preventDefault(); onDelete(); }}
           className="flex items-center justify-center h-8 w-8 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
           title="Delete Material"
         >
            <Trash2 className="h-4 w-4" />
         </button>
      </div>
    </motion.div>
  );
}

function FocusItem({ label, level, color }: { label: string, level: string, color: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-4">
       <span className="text-sm font-medium text-white/80">{label}</span>
       <span className={`text-xs font-bold ${color}`}>{level}</span>
    </div>
  );
}
