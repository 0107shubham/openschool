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
  Trash2,
  Layers,
  Edit2
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { PDFDocument } from 'pdf-lib';
import { SmartNotesList } from "@/components/smart-notes/SmartNotesList";
import { SUPPORTED_MODELS, AIProvider } from "@/lib/ai/client";

interface Material {
  id: string;
  title: string;
  subcategory?: string;
  createdAt: string;
  mcqCount: number;
  sscMcqCount: number;
  upscMcqCount: number;
  notesCount: number;
  sscNotesCount: number;
  upscNotesCount: number;
  status: string;
}

interface Subclassroom {
  id: string;
  name: string;
  description: string;
  classroomId: string;
}

export default function SubclassroomPage() {
  const params = useParams();
  const router = useRouter();
  const subclassroomId = params.id as string;
  
  const [subclassroom, setSubclassroom] = useState<Subclassroom | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Material State
  const [newMaterial, setNewMaterial] = useState({ title: "", content: "", subcategory: "" });
  const [uploading, setUploading] = useState(false);
  
  // Edit Material State
  const [editMaterialModalOpen, setEditMaterialModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [updatingMaterial, setUpdatingMaterial] = useState(false);

  const [mode, setMode] = useState<'text' | 'pdf'>("text");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedPdfUrl, setExtractedPdfUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pageSelection, setPageSelection] = useState("1-5");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.0-flash-001");
  const [selectedProviderType, setSelectedProviderType] = useState<AIProvider>("OpenRouter");
  const [selectedAccount, setSelectedAccount] = useState(1);
  const [generationType, setGenerationType] = useState<"BOTH" | "NOTES" | "MCQS">("BOTH");
  const [examType, setExamType] = useState<"SSC" | "UPSC">("SSC");
  
  // Notes Modal State
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // MCQ Generation Modal State
  const [mcqModalOpen, setMcqModalOpen] = useState(false);
  const [materialForMcq, setMaterialForMcq] = useState<Material | null>(null);
  
  // Generation & Deletion State
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>("");

  useEffect(() => {
    fetchSubclassroomData();
  }, [subclassroomId]);

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialToEdit) return;
    setUpdatingMaterial(true);

    try {
      const res = await fetch(`/api/materials/${materialToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: materialToEdit.title, subcategory: materialToEdit.subcategory }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update material");
      }

      setEditMaterialModalOpen(false);
      setMaterialToEdit(null);
      fetchSubclassroomData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdatingMaterial(false);
    }
  };

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (extractedPdfUrl) URL.revokeObjectURL(extractedPdfUrl);
    };
  }, [previewUrl, extractedPdfUrl]);

  const fetchSubclassroomData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subclassrooms/${subclassroomId}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setSubclassroom(data.subclassroom);
      setMaterials(data.materials);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material? This will also delete all associated smart notes and MCQs.")) return;
    
    setDeleting(materialId);
    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchSubclassroomData();
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete material.");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteMcqs = async (materialId: string, exam?: "SSC" | "UPSC") => {
    const msg = exam ? `Are you sure you want to delete ONLY the ${exam} MCQs?` : "Are you sure you want to delete ALL MCQs for this material?";
    if (!confirm(msg)) return;
    
    setDeleting(`${materialId}-${exam || 'all'}`);
    try {
      const url = `/api/materials/${materialId}?type=mcqs${exam ? `&exam=${exam}` : ''}`;
      const res = await fetch(url, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchSubclassroomData();
      } else {
        const error = await res.json();
        alert(`Failed to delete MCQs: ${error.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete MCQs.");
    } finally {
      setDeleting(null);
    }
  };

  const parsePageSelection = (selection: string) => {
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
      const validStart = Math.max(1, Math.min(start, totalPages));
      const validEnd = Math.max(validStart, Math.min(end, totalPages));
      
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
      alert("Failed to extract pages.");
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
          if (!newMaterial.content.trim()) throw new Error("Please enter content");

          res = await fetch(`/api/subclassrooms/${subclassroomId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newMaterial),
          });
      } else {
          if (!file) throw new Error("Please select a PDF");
          if (!newMaterial.title) throw new Error("Please enter title");

          const { start, end } = parsePageSelection(pageSelection);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("subclassroomId", subclassroomId);
          formData.append("title", newMaterial.title);
          if (newMaterial.subcategory) formData.append("subcategory", newMaterial.subcategory);
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
        setGeneratingFor(data.id);
        setGenerationStatus("Processing with AI...");
        
        try {
          const mcqRes = await fetch("/api/generate-mcq", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              materialId: data.id, 
              modelId: selectedModel,
              accountIndex: selectedAccount,
              generationType: generationType,
              examType: examType
            }),
          });
          
          const mcqData = await mcqRes.json();
          
          if (mcqRes.ok && mcqData.success) {
            setGenerationStatus(`✅ Created ${mcqData.smartNotes?.count || 0} notes and ${mcqData.mcqs?.count || 0} MCQs!`);
            
            setTimeout(() => {
              setGeneratingFor(null);
              setIsModalOpen(false);
              setNewMaterial({ title: "", content: "", subcategory: "" });
              setFile(null);
              setPreviewUrl(null);
              setExtractedPdfUrl(null);
              setPageSelection("1-5");
              
              fetchSubclassroomData().then(() => {
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
       alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenMcqModal = (material: Material) => {
    setMaterialForMcq(material);
    setMcqModalOpen(true);
  };

  const handleGenerateMCQsOnly = async (type: "SSC" | "UPSC" = examType, refresh: boolean = false) => {
    if (!materialForMcq) return;
    const materialId = materialForMcq.id;
    setMcqModalOpen(false);
    
    try {
      setGeneratingFor(materialId);
      setGenerationStatus(`Generating ${type} MCQs${refresh ? " & Refreshing Notes" : ""}...`);
      
      const res = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          materialId, 
          modelId: selectedModel, 
          accountIndex: selectedAccount, 
          generationType: refresh ? "BOTH" : "MCQS", 
          examType: type,
          refreshNotes: refresh
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setGenerationStatus(`✅ Created ${data.mcqs?.count || 0} ${type} MCQs!`);
        setTimeout(() => {
          setGeneratingFor(null);
          fetchSubclassroomData();
        }, 2000);
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (error: any) {
      setGenerationStatus("❌ Failed");
      setTimeout(() => setGeneratingFor(null), 3000);
      alert(error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setExtractedPdfUrl(null);
      if (selectedFile.type === "application/pdf") {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      }
    }
  };

  if (loading) {
     return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>;
  }

  if (!subclassroom) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Module not found</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Navigation */}
      <nav className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link 
          href={`/classroom/${subclassroom.classroomId}`} 
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Classroom
        </Link>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{subclassroom.name}</h1>
                <p className="text-white/40 flex items-center gap-2"><Layers className="h-3.5 w-3.5" /> Module Content • {materials.length} Items</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold hover:bg-indigo-500 transition-all active:scale-95"
              >
                <Plus className="h-5 w-5" />
                ADD CONTENT
              </button>
            </div>

            <div className="grid gap-4">
               {materials.length === 0 ? (
                  <div className="p-10 text-center border border-white/5 rounded-xl bg-white/[0.02]">
                    <p className="text-white/30">No materials yet in this module.</p>
                  </div>
                ) : (() => {
                  const grouped = materials.reduce((acc: Record<string, Material[]>, material) => {
                    const key = material.subcategory || "Other";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(material);
                    return acc;
                  }, {});

                  const sortedKeys = Object.keys(grouped).sort((a, b) => {
                    if (a === "Other") return 1;
                    if (b === "Other") return -1;
                    return a.localeCompare(b);
                  });

                  return sortedKeys.map((subcategory) => (
                    <div key={subcategory} className="space-y-3">
                      <div className="flex items-center gap-3 mt-6 first:mt-0">
                        <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400/80 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          {subcategory}
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/30 via-transparent to-transparent" />
                      </div>
                      
                      {grouped[subcategory].map((material, idx) => (
                        <MaterialRow 
                          key={material.id} 
                          material={material} 
                          index={idx} 
                          onViewNotes={() => { setSelectedMaterial(material); setNotesModalOpen(true); }}
                          onGenerateMCQs={(type: any) => { setExamType(type); handleOpenMcqModal(material); }}
                          onEdit={() => {
                            setMaterialToEdit(material);
                            setEditMaterialModalOpen(true);
                          }}
                          onDelete={() => handleDeleteMaterial(material.id)}
                          onDeleteMcqs={(exam?: any) => handleDeleteMcqs(material.id, exam)}
                          isGenerating={generatingFor === material.id}
                          isDeleting={deleting?.startsWith(material.id)}
                          deleteType={deleting}
                        />
                      ))}
                    </div>
                  ));
                })()}
             </div>
          </div>

          <aside className="w-full lg:w-96 space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8">
              <div className="flex items-center justify-between mb-6">
                <Brain className="h-10 w-10 text-white/80" />
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Module Quiz</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-tighter">Ready to test?</h2>
              <p className="text-white/70 text-sm mb-6">Start a session based on all materials in this specific module.</p>
              <Link href={`/quiz/${subclassroomId}`}>
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <Play className="h-5 w-5 fill-indigo-600" />
                  START MODULE QUIZ
                </button>
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Content" className={mode === 'pdf' ? "max-w-4xl" : "max-w-md"}>
        <div className="flex gap-4 border-b border-white/10 pb-4 mb-4">
            <button onClick={() => setMode("text")} className={`flex-1 pb-2 text-sm font-bold transition-all ${mode === 'text' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/40 hover:text-white'}`}>PASTE TEXT</button>
            <button onClick={() => setMode("pdf")} className={`flex-1 pb-2 text-sm font-bold transition-all ${mode === 'pdf' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/40 hover:text-white'}`}>UPLOAD PDF</button>
        </div>

        <form onSubmit={handleAddMaterial} className="space-y-4">
            <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase">Title</label>
                    <input type="text" required placeholder="e.g. Intro to Derivatives" value={newMaterial.title} onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-indigo-500 focus:outline-none" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase">Generation Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['BOTH', 'NOTES', 'MCQS'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setGenerationType(type)}
                                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    generationType === type 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase">Target Exam</label>
                    <div className="grid grid-cols-2 gap-2">
                        {(['SSC', 'UPSC'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setExamType(type)}
                                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    examType === type 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase flex items-center gap-2"><Sparkles className="h-3 w-3" /> AI Provider</label>
                    <select value={selectedProviderType === "OpenRouter" ? selectedAccount : "NVIDIA"} onChange={(e) => {
                        const val = e.target.value;
                        if (val === "NVIDIA") { setSelectedProviderType("NVIDIA"); const m = SUPPORTED_MODELS.find(m => m.provider === "NVIDIA"); if (m) setSelectedModel(m.id); } 
                        else { setSelectedProviderType("OpenRouter"); setSelectedAccount(Number(val)); const m = SUPPORTED_MODELS.find(m => m.provider === "OpenRouter"); if (m) setSelectedModel(m.id); }
                    }} className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] p-3 text-white font-bold focus:border-indigo-500 focus:outline-none appearance-none">
                      <option value={1} className="bg-[#0A0A0A] text-white">Account 1</option>
                      <option value={2} className="bg-[#0A0A0A] text-white">Account 2</option>
                      <option value="NVIDIA" className="bg-[#0A0A0A] text-white">NVIDIA</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase flex items-center gap-2"><Brain className="h-3 w-3" /> AI Intelligence</label>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] p-3 text-white font-bold focus:border-indigo-500 focus:outline-none appearance-none">
                      {SUPPORTED_MODELS.filter(m => m.provider === selectedProviderType).map(model => (
                        <option key={model.id} value={model.id} className="bg-[#0A0A0A] text-white">
                          {model.name}
                        </option>
                      ))}
                    </select>
                </div>

                {mode === 'text' ? (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/60 uppercase">Content</label>
                        <textarea required rows={8} placeholder="Paste text here..." value={newMaterial.content} onChange={(e) => setNewMaterial({...newMaterial, content: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white text-sm resize-none" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-white/60 uppercase">PDF File</label>
                            <div className="relative rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 text-center">
                                <input type="file" accept=".pdf" required onChange={handleFileChange} className="absolute inset-0 cursor-pointer opacity-0" />
                                {file ? <p className="text-indigo-400 font-bold">{file.name}</p> : <p className="text-white/40">Drop PDF here</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/60 uppercase">Pages (e.g. 1-5)</label>
                                <input type="text" value={pageSelection} onChange={(e) => setPageSelection(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" />
                                <button type="button" onClick={handleExtractPreview} disabled={isExtracting || !file} className="w-full rounded-lg bg-white/5 border border-white/10 py-2 text-xs font-bold text-indigo-400">PREVIEW PAGES</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {generatingFor && <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300">{generationStatus}</div>}

            <button disabled={uploading || !!generatingFor} className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500 flex justify-center items-center gap-2">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : generatingFor ? <Loader2 className="h-5 w-5 animate-spin" /> : "GENERATE NOTES"}
            </button>
        </form>
      </Modal>

      <Modal isOpen={notesModalOpen} onClose={() => { setNotesModalOpen(false); setSelectedMaterial(null); }} title={`Notes: ${selectedMaterial?.title || ''}`} className="max-w-5xl max-h-[85vh] overflow-y-auto">
        {selectedMaterial && <SmartNotesList materialId={selectedMaterial.id} materialTitle={selectedMaterial.title} />}
      </Modal>

      <Modal isOpen={mcqModalOpen} onClose={() => setMcqModalOpen(false)} title="Generate MCQs" className="max-w-md">
        <div className="space-y-6">
          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4 font-bold text-indigo-400 text-sm">
            Generate questions specifically from the analysis of this material.
          </div>
          
          <div className="space-y-4">
              <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase">Exam Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["SSC", "UPSC"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setExamType(type as any)}
                        className={`px-4 py-3 rounded-xl text-xs font-black transition-all border ${
                          examType === type 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                        }`}
                      >
                        {type} PREP
                      </button>
                    ))}
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase flex items-center gap-2"><Sparkles className="h-3 w-3" /> AI Provider</label>
                  <select value={selectedProviderType === "OpenRouter" ? selectedAccount : "NVIDIA"} onChange={(e) => {
                      const val = e.target.value;
                      if (val === "NVIDIA") { setSelectedProviderType("NVIDIA"); const m = SUPPORTED_MODELS.find(m => m.provider === "NVIDIA"); if (m) setSelectedModel(m.id); } 
                      else { setSelectedProviderType("OpenRouter"); setSelectedAccount(Number(val)); const m = SUPPORTED_MODELS.find(m => m.provider === "OpenRouter"); if (m) setSelectedModel(m.id); }
                  }} className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] p-3 text-white font-bold focus:border-indigo-500 focus:outline-none appearance-none">
                    <option value={1} className="bg-[#0A0A0A] text-white">Account 1 (OpenRouter)</option>
                    <option value={2} className="bg-[#0A0A0A] text-white">Account 2 (OpenRouter)</option>
                    <option value="NVIDIA" className="bg-[#0A0A0A] text-white">NVIDIA API</option>
                  </select>
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase flex items-center gap-2"><Brain className="h-3 w-3" /> AI Intelligence</label>
                  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] p-3 text-white font-bold focus:border-indigo-500 focus:outline-none appearance-none">
                    {SUPPORTED_MODELS.filter(m => m.provider === selectedProviderType).map(model => (
                      <option key={model.id} value={model.id} className="bg-[#0A0A0A] text-white">
                        {model.name}
                      </option>
                    ))}
                  </select>
              </div>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleGenerateMCQsOnly(examType, false)} 
              className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
            >
              GENERATE {examType} MCQS
            </button>
            <button 
              onClick={() => handleGenerateMCQsOnly(examType, true)} 
              className="w-full rounded-xl bg-white/5 border border-white/10 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              Refresh Notes & Generate
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={editMaterialModalOpen} 
        onClose={() => setEditMaterialModalOpen(false)} 
        title="Edit Content Details"
        className="max-w-md"
      >
        {materialToEdit && (
          <form onSubmit={handleUpdateMaterial} className="space-y-6">
              <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase">Title</label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={materialToEdit.title}
                    onChange={(e) => setMaterialToEdit({...materialToEdit, title: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white focus:border-indigo-500 focus:outline-none transition-all"
                  />
              </div>



              <button 
                  disabled={updatingMaterial}
                  className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-500 disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                  {updatingMaterial ? <Loader2 className="h-5 w-5 animate-spin" /> : "SAVE CHANGES"}
              </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function MaterialRow({ material, index, onViewNotes, onGenerateMCQs, onEdit, onDelete, onDeleteMcqs, isGenerating, isDeleting, deleteType }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/5">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400"><FileText className="h-6 w-6" /></div>
        <div>
          <h3 className="font-bold text-white">{material.title}</h3>
          <p className="text-xs text-white/40">{material.notesCount} notes • {material.mcqCount} MCQs</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
         {parseInt(material.notesCount) > 0 && <button onClick={onViewNotes} className="px-4 py-2 rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all">VIEW NOTES</button>}
         
         <div className="flex items-center gap-1">
           {/* SSC MCQ Logic */}
           {parseInt(material.notesCount) > 0 && parseInt(material.sscMcqCount) === 0 ? (
             <button 
               onClick={() => onGenerateMCQs("SSC")} 
               className="px-3 py-2 rounded-lg bg-green-500/10 text-[10px] font-black text-green-400 hover:bg-green-500/20 transition-all"
               disabled={isGenerating || isDeleting}
             >
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : "SSC MCQ"}
             </button>
            ) : parseInt(material.sscMcqCount) > 0 && (
              <div className="flex items-center gap-1 bg-green-600 rounded-lg overflow-hidden group/ssc">
                <Link href={`/quiz/${material.id}?exam=SSC`} className="px-3 py-2 text-[10px] font-black text-white hover:bg-green-500 transition-all">
                  SSC QUIZ
                </Link>
                <button onClick={() => onDeleteMcqs("SSC")} className="px-2 py-2 text-white/50 hover:text-white hover:bg-black/20 transition-all border-l border-white/10" title="Delete SSC MCQs" disabled={isDeleting}>
                  {deleteType === `${material.id}-SSC` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </button>
              </div>
           )}

           {/* UPSC MCQ Logic */}
           {parseInt(material.notesCount) > 0 && parseInt(material.upscMcqCount) === 0 ? (
             <button 
               onClick={() => onGenerateMCQs("UPSC")} 
               className="px-3 py-2 rounded-lg bg-purple-500/10 text-[10px] font-black text-purple-400 hover:bg-purple-500/20 transition-all"
               disabled={isGenerating || isDeleting}
             >
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : "UPSC MCQ"}
             </button>
           ) : parseInt(material.upscMcqCount) > 0 && (
              <div className="flex items-center gap-1 bg-purple-600 rounded-lg overflow-hidden group/upsc">
                <Link href={`/quiz/${material.id}?exam=UPSC`} className="px-3 py-2 text-[10px] font-black text-white hover:bg-purple-500 transition-all">
                  UPSC QUIZ
                </Link>
                <button onClick={() => onDeleteMcqs("UPSC")} className="px-2 py-2 text-white/50 hover:text-white hover:bg-black/20 transition-all border-l border-white/10" title="Delete UPSC MCQs" disabled={isDeleting}>
                  {deleteType === `${material.id}-UPSC` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </button>
              </div>
           )}
         </div>

         {parseInt(material.mcqCount) > 0 && (
           <div className="flex items-center gap-1 bg-white/5 rounded-lg overflow-hidden border border-white/10">
             <button onClick={() => onGenerateMCQs(material.examRelevance || 'SSC')} className="px-2 py-2 text-white/30 hover:text-white hover:bg-indigo-500/20 transition-all" title="Regenerate/Add More" disabled={isGenerating || isDeleting}>
                <Sparkles className="h-3.5 w-3.5" />
             </button>
             <button onClick={() => onDeleteMcqs()} className="px-2 py-2 text-white/20 hover:text-red-300 hover:bg-red-500/20 transition-all border-l border-white/10" title="Delete Only MCQs" disabled={isDeleting}>
               {deleteType === `${material.id}-all` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
             </button>
           </div>
         )}
         <button onClick={onEdit} className="p-2 text-white/10 hover:text-indigo-400 transition-all" title="Edit Details"><Edit2 className="h-4 w-4" /></button>
         <button onClick={onDelete} className="p-2 text-white/10 hover:text-red-400 transition-all" title="Delete Content" disabled={isDeleting}>
           {deleteType === material.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
         </button>
      </div>
    </motion.div>
  );
}
