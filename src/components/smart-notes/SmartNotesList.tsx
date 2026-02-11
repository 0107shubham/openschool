"use client";

import { useState, useEffect } from "react";
import { SmartNoteCard } from "./SmartNoteCard";
import { Loader2, BookOpen, GraduationCap, FileText, Filter, Target, Sparkles, Plus, Zap, Brain, Edit2, Trash2, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner"; 
import mermaid from "mermaid"; 
import { DrawingCanvas } from "./DrawingOverlay";

// OpenRouter Supported Models
const SUPPORTED_MODELS = [
  // OpenRouter Models
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", description: "Ultra-fast, massive context", provider: "OpenRouter" },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", description: "Excellent instruction following", provider: "OpenRouter" },
  { id: "liquid/lfm-2.5-1.2b-thinking:free", name: "Liquid LFM 2.5 (Free)", description: "Reasoning model", provider: "OpenRouter" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (Free)", description: "Google's latest open model", provider: "OpenRouter" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1 (Free)", description: "Balanced performance", provider: "OpenRouter" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air (Free)", description: "High-speed reasoning", provider: "OpenRouter" },
  { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B (Free)", description: "Large scale open model", provider: "OpenRouter" },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "NVIDIA Nemotron 3 Nano (Free)", description: "Small but powerful agentic MoE", provider: "OpenRouter" },
  
  // NVIDIA Integrations
  { id: "moonshotai/kimi-k2.5", name: "Kimi k2.5 (Thinking)", description: "Moonshot's reasoning model", provider: "NVIDIA" },
  { id: "qwen/qwen3-next-80b-a3b-thinking", name: "Qwen 3 Next 80B (Thinking)", description: "Qwen's latest reasoning model", provider: "NVIDIA" },
  { id: "nvidia/nemotron-3-nano-30b-a3b", name: "Nemotron 3 Nano (Thinking)", description: "NVIDIA's fast reasoning model", provider: "NVIDIA" },
  { id: "deepseek-ai/deepseek-v3.1", name: "DeepSeek v3.1 (Thinking)", description: "DeepSeek's high-performance reasoning", provider: "NVIDIA" },
];

interface SmartNotesListProps {
  materialId: string;
  materialTitle?: string;
}

export function SmartNotesList({ materialId, materialTitle }: SmartNotesListProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [byTopic, setByTopic] = useState<Record<string, any[]>>({});
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "SSC" | "UPSC">("ALL");
  const [viewMode, setViewMode] = useState<"CARDS" | "BOOK">("BOOK");
  const [isBookDrawingActive, setIsBookDrawingActive] = useState(false);
  
  // Per-Note MCQ Generation State
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isPerNoteMCQOpen, setIsPerNoteMCQOpen] = useState(false);
  const [perNoteFocus, setPerNoteFocus] = useState("");
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(1);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.0-flash-001");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Specific MCQ Generation State
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusTopic, setFocusTopic] = useState("");

  // Enhance Notes State
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [enhanceStyle, setEnhanceStyle] = useState<"SSC" | "UPSC" | "BOTH">("SSC");
  const [enhanceModel, setEnhanceModel] = useState("google/gemini-2.0-flash-001");
  const [enhanceAccountIndex, setEnhanceAccountIndex] = useState(1);

  // Mind Map State
  const [isMindMapModalOpen, setIsMindMapModalOpen] = useState(false);
  const [mindMapContent, setMindMapContent] = useState("");
  const [mindMapId, setMindMapId] = useState<string | null>(null);
  const [mindMapFocus, setMindMapFocus] = useState("");
  const [mindMapModel, setMindMapModel] = useState("google/gemini-2.0-flash-001");
  const [mindMapAccountIndex, setMindMapAccountIndex] = useState(1);
  const [mindMapFormat, setMindMapFormat] = useState<"MERMAID" | "TEXT">("MERMAID");
  const [isDeletingMap, setIsDeletingMap] = useState(false);

  // Edit Note State
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<any>(null);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);

  // Manual Add State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    topic: "",
    subtopic: "",
    content: "",
    examRelevance: "BOTH" as "SSC" | "UPSC" | "BOTH",
    importance: 3
  });

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  }, []);

  useEffect(() => {
    if (isMindMapModalOpen && mindMapContent) {
      setTimeout(() => {
        mermaid.contentLoaded();
      }, 100);
    }
  }, [isMindMapModalOpen, mindMapContent]);

  useEffect(() => {
    fetchNotes();
  }, [materialId, filter]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const url = `/api/smart-notes/${materialId}${filter !== "ALL" ? `?exam=${filter}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setNotes(data.notes || []);
      setByTopic(data.byTopic || {});
      setSummary(data.summary || null);

      if (data.mindMaps && data.mindMaps.length > 0) {
        setMindMapContent(data.mindMaps[0].content);
        setMindMapId(data.mindMaps[0].id);
      } else {
        setMindMapContent("");
        setMindMapId(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteToEdit) return;

    try {
      setIsUpdatingNote(true);
      const res = await fetch(`/api/smart-notes/note/${noteToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: noteToEdit.topic,
          subtopic: noteToEdit.subtopic,
          content: noteToEdit.content,
        }),
      });

      if (!res.ok) throw new Error("Failed to update note");

      setIsEditNoteModalOpen(false);
      setNoteToEdit(null);
      toast.success("Note updated");
      fetchNotes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdatingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const res = await fetch(`/api/smart-notes/note/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Note deleted");
      fetchNotes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.topic || !newNote.content) {
      toast.error("Topic and Content are required");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch(`/api/smart-notes/${materialId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });

      if (!res.ok) throw new Error("Failed to add note");

      toast.success("Note added manually!");
      setNewNote({
        topic: "",
        subtopic: "",
        content: "",
        examRelevance: "BOTH",
        importance: 3
      });
      setIsAddingNote(false);
      fetchNotes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFocusedMCQ = async () => {
    if (!focusTopic.trim()) {
      toast.error("Please enter a focus topic");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          generationType: "MCQS",
          focus: focusTopic,
          modelId: selectedModel,
          accountIndex: selectedAccountIndex,
          examType: filter === "ALL" ? "SSC" : filter
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate MCQs");

      setIsFocusModalOpen(false);
      setFocusTopic("");
      toast.success(`Successfully generated ${data.mcqs?.count || 0} focused MCQs!`);
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhanceNotes = async () => {
    if (!focusTopic.trim()) {
      toast.error("Please enter a focus topic for enhancement");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          generationType: "ENHANCE",
          focus: focusTopic,
          style: enhanceStyle,
          modelId: enhanceModel,
          accountIndex: enhanceAccountIndex,
          examType: enhanceStyle === "BOTH" ? "UPSC" : (enhanceStyle as "SSC" | "UPSC")
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to enhance notes");

      setIsEnhanceModalOpen(false);
      setFocusTopic("");
      toast.success(`Added ${data.smartNotes?.count || 0} new notes & generated MCQs!`);
      
      // Refresh notes list
      fetchNotes();
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMindMap = async () => {
    if (!mindMapFocus.trim() && !materialTitle) {
      // Optional focus, but good to have title if no focus
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          generationType: "MINDMAP",
          focus: mindMapFocus || "Overview", // Default to overview
          modelId: mindMapModel,
          accountIndex: mindMapAccountIndex,
          mapFormat: mindMapFormat
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate mind map");

      setMindMapContent(data.mindMap?.content || "");
      setMindMapId(data.mindMap?.id || null);
      if (data.mindMap?.content) {
         toast.success("Mind Map Generated!");
      }
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteMindMap = async () => {
    if (!mindMapId) return;
    
    if (!confirm("Are you sure you want to delete this mind map?")) return;

    try {
      setIsDeletingMap(true);
      const res = await fetch(`/api/mindmap/${mindMapId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete mind map");

      setMindMapContent("");
      setMindMapId(null);
      toast.success("Mind Map deleted");
      
      // Refresh to ensure sync
      fetchNotes();

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeletingMap(false);
    }
  };

  const handlePerNoteMCQ = (note: any) => {
    setSelectedNote(note);
    setPerNoteFocus(note.topic);
    setIsPerNoteMCQOpen(true);
  };

  const generatePerNoteMCQ = async () => {
    if (!perNoteFocus.trim()) {
      toast.error("Please enter what to focus on");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          generationType: "MCQS",
          focus: perNoteFocus,
          modelId: selectedModel,
          accountIndex: selectedAccountIndex,
          examType: selectedNote?.examRelevance === "UPSC" ? "UPSC" : "SSC"
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate MCQs");

      setIsPerNoteMCQOpen(false);
      setPerNoteFocus("");
      setSelectedNote(null);
      toast.success(`Generated ${data.mcqs?.count || 0} MCQs focused on "${perNoteFocus}"!`);
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/40">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p>Loading smart notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
        <BookOpen className="h-12 w-12 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white/60 mb-2">No Smart Notes Yet</h3>
        <p className="text-white/30">Generate MCQs to create smart notes from this material.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      {materialTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{materialTitle}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEnhanceModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-purple-500/20"
            >
              <Zap className="h-3 w-3" />
              <span>Add/Enhance</span>
            </button>
            <button
              onClick={() => setIsFocusModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-indigo-500/20"
            >
              <Target className="h-3 w-3" />
              <span>Focused MCQ</span>
            </button>
            <button
              onClick={() => setIsMindMapModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-pink-500/20"
            >
              <Brain className="h-3 w-3" />
              <span>Mind Map</span>
            </button>
            <button
              onClick={() => setIsAddingNote(!isAddingNote)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${
                isAddingNote 
                ? "bg-rose-500 text-white shadow-rose-500/20" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
              }`}
            >
              {isAddingNote ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              <span>{isAddingNote ? "Cancel" : "Manual Note"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-2xl font-black text-white">{summary.total}</p>
            <p className="text-xs text-white/40 uppercase">Total Notes</p>
          </div>
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
            <p className="text-2xl font-black text-blue-400">{summary.sscCount}</p>
            <p className="text-xs text-blue-400/60 uppercase">SSC Relevant</p>
          </div>
          <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-center">
            <p className="text-2xl font-black text-purple-400">{summary.upscCount}</p>
            <p className="text-xs text-purple-400/60 uppercase">UPSC Relevant</p>
          </div>
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-center">
            <p className="text-2xl font-black text-yellow-400">{summary.highPriority}</p>
            <p className="text-xs text-yellow-400/60 uppercase">High Priority</p>
          </div>
        </div>
      )}

      {/* Manual Add Form */}
      <AnimatePresence>
        {isAddingNote && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#1A1A1A] border border-emerald-500/20 rounded-3xl p-8 shadow-2xl shadow-emerald-500/5">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Plus className="h-5 w-5 text-emerald-400" />
                 </div>
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">Manual Smart Note</h3>
              </div>
              
              <form onSubmit={handleManualAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Topic</label>
                    <input 
                      type="text" 
                      value={newNote.topic}
                      onChange={(e) => setNewNote({...newNote, topic: e.target.value})}
                      placeholder="e.g. Jain Architecture"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Subtopic</label>
                    <input 
                      type="text" 
                      value={newNote.subtopic}
                      onChange={(e) => setNewNote({...newNote, subtopic: e.target.value})}
                      placeholder="e.g. Important Jain Places"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Content (Use → for pointers)</label>
                  <textarea 
                    rows={6}
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    placeholder="→ Pointer 1&#10;→ Pointer 2"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium resize-none leading-relaxed placeholder:text-white/10"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-6">
                     <div>
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Exam Relevance</label>
                        <div className="flex gap-2">
                           {(["SSC", "UPSC", "BOTH"] as const).map(rel => (
                              <button
                                key={rel}
                                type="button"
                                onClick={() => setNewNote({...newNote, examRelevance: rel})}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                                   newNote.examRelevance === rel 
                                   ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                                   : "bg-white/5 border-white/10 text-white/40"
                                }`}
                              >
                                 {rel}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Importance</label>
                        <div className="flex items-center gap-1">
                           {[1,2,3,4,5].map(imp => (
                              <button
                                key={imp}
                                type="button"
                                onClick={() => setNewNote({...newNote, importance: imp})}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                   newNote.importance >= imp 
                                   ? "text-amber-400" 
                                   : "text-white/10"
                                }`}
                              >
                                 <Star className={`h-4 w-4 ${newNote.importance >= imp ? "fill-amber-400" : ""}`} />
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-6 py-3 text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="flex items-center gap-3 px-10 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Save Note</>}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {(["ALL", "SSC", "UPSC"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === tab
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab === "ALL" ? (
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                All Notes
              </span>
            ) : tab === "SSC" ? (
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                SSC (Basic)
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                UPSC (Conceptual)
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {(["CARDS", "BOOK"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === mode
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-white/30 hover:text-white"
              }`}
            >
              {mode} VIEW
            </button>
          ))}
        </div>
      </div>

      {/* Notes by Topic */}
      <div className="space-y-8">
        {viewMode === "BOOK" ? (
              <DrawingCanvas 
                isActive={isBookDrawingActive} 
                onToggle={() => setIsBookDrawingActive(!isBookDrawingActive)}
                className="min-h-[500px]"
              >
                <div className="bg-[#FCFCFA] rounded-[3rem] p-10 md:p-16 border border-black/5 shadow-xl relative overflow-hidden h-full">
                  {/* Book spine decoration */}
                  <div className="absolute top-0 left-0 w-2.5 bg-gradient-to-b from-amber-200/40 via-orange-200/40 to-amber-200/40 h-full" />
                  <div className="absolute top-0 left-2.5 w-[1px] bg-black/5 h-full" />
                  
                  {/* Texture */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

                {Object.entries(byTopic).map(([topic, topicNotes]) => (
                    <div key={topic} className="mb-24 last:mb-0 relative z-10">
                        <div className="flex items-center gap-6 mb-12 border-b border-black/5 pb-8">
                            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-700">
                                <BookOpen className="h-7 w-7" />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">{topic}</h2>
                        </div>

                        <div className="space-y-16">
                            {topicNotes.map((note, idx) => (
                                <motion.div 
                                    key={note.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="relative pl-12 group"
                                >
                                    {/* Section bullet */}
                                    <div className="absolute left-0 top-3 w-4 h-4 rounded-full border-[3px] border-amber-500/30 bg-white group-hover:border-amber-500 transition-all duration-500" />
                                    <div className="absolute left-[7px] top-[28px] w-[2px] bottom-0 bg-black/5 group-last:hidden" />

                                    <div className="flex items-center justify-between mb-5">
                                        {note.subtopic && (
                                            <h3 className="text-2xl font-black text-gray-800 tracking-tight group-hover:text-amber-700 transition-colors uppercase">
                                                {note.subtopic}
                                            </h3>
                                        )}
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                             <button onClick={() => { setNoteToEdit(note); setIsEditNoteModalOpen(true); }} className="p-2 text-black/20 hover:text-black hover:bg-black/5 rounded-xl"><Edit2 className="h-4 w-4" /></button>
                                             <button onClick={() => handleDeleteNote(note.id)} className="p-2 text-black/20 hover:text-red-500 hover:bg-red-500/5 rounded-xl"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>

                                    <div className="text-xl text-gray-700/90 leading-relaxed space-y-4 selection:bg-amber-500/20">
                                        {note.content.split('\n').map((line: string, i: number) => {
                                            const trimmed = line.trim();
                                            if (!trimmed) return <div key={i} className="h-4" />;
                                            const isPointer = trimmed.startsWith('→') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•');
                                            const depth = line.search(/\S/);
                                            return (
                                                <p 
                                                    key={i} 
                                                    className={`whitespace-pre-wrap transition-colors hover:text-gray-900 ${isPointer ? 'font-bold text-gray-900' : ''}`}
                                                    style={{ paddingLeft: `${(depth * 0.5) + (isPointer ? 1.5 : 0)}rem` }}
                                                >
                                                    {isPointer && <span className="absolute left-12 text-amber-500/50">▶</span>}
                                                    {trimmed.replace(/^[→\-*•]\s*/, '')}
                                                </p>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Smart Note Add-ons */}
                                    <div className="mt-8 space-y-6">
                                        {/* UPSC Extended Data */}
                                        {note.memoryTechnique?.upscExtra && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {note.memoryTechnique.upscExtra.background && (
                                                    <div className="p-6 rounded-2xl bg-black/[0.02] border border-black/5 text-base">
                                                        <span className="font-black text-black/30 uppercase tracking-[0.2em] text-[10px] block mb-2">Historical Context</span>
                                                        <p className="text-gray-600 leading-relaxed font-medium">{note.memoryTechnique.upscExtra.background}</p>
                                                    </div>
                                                )}
                                                {note.memoryTechnique.upscExtra.currentRelevance && (
                                                    <div className="p-6 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 text-base">
                                                        <span className="font-black text-amber-700/60 uppercase tracking-[0.2em] text-[10px] block mb-2">Modern Linkage</span>
                                                        <p className="text-gray-700/80 italic leading-relaxed font-medium">{note.memoryTechnique.upscExtra.currentRelevance}</p>
                                                    </div>
                                                )}
                                                {note.memoryTechnique.upscExtra.pyqAnalysis && (
                                                    <div className="p-6 rounded-2xl bg-sky-500/[0.03] border border-sky-500/10 text-base">
                                                        <span className="font-black text-sky-700/60 uppercase tracking-[0.2em] text-[10px] block mb-2">Trend Analysis</span>
                                                        <p className="text-gray-700/80 leading-relaxed font-medium">{note.memoryTechnique.upscExtra.pyqAnalysis}</p>
                                                    </div>
                                                )}
                                                {note.memoryTechnique.upscExtra.valueAddition && (
                                                    <div className="p-6 rounded-2xl bg-purple-500/[0.03] border border-purple-500/10 text-base">
                                                        <span className="font-black text-purple-700/60 uppercase tracking-[0.2em] text-[10px] block mb-2">Mains Value Addition</span>
                                                        <p className="text-gray-700/80 leading-relaxed font-medium">{note.memoryTechnique.upscExtra.valueAddition}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Analytical Angles */}
                                        {note.memoryTechnique?.upscExtra?.analyticalAngles && Array.isArray(note.memoryTechnique.upscExtra.analyticalAngles) && (
                                             <div className="p-8 rounded-2xl bg-indigo-500/[0.02] border border-indigo-500/5">
                                                <span className="font-black text-indigo-700/40 uppercase tracking-[0.2em] text-[10px] block mb-5">Expert Perspectives</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    {note.memoryTechnique.upscExtra.analyticalAngles.map((angle: string, i: number) => (
                                                        <div key={i} className="flex gap-3 text-base text-gray-600 bg-white p-4 rounded-xl shadow-sm border border-black/[0.03] font-medium">
                                                            <span className="text-amber-500">◈</span>
                                                            {angle}
                                                        </div>
                                                    ))}
                                                </div>
                                             </div>
                                        )}

                                        {/* Exam Tips */}
                                        <div className="flex flex-wrap gap-4">
                                            {note.examTips && (
                                                <div className="flex-1 min-w-[300px] p-6 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 text-base text-emerald-800">
                                                    <span className="font-black text-emerald-600 uppercase tracking-[0.2em] text-[10px] block mb-2">Examiner's Advice</span>
                                                    {note.examTips}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            <button 
                                onClick={() => {
                                    setNewNote({ ...newNote, topic: topic });
                                    setIsAddingNote(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-full py-4 border-2 border-dashed border-black/5 rounded-2xl text-black/20 hover:text-emerald-600 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 mt-8"
                            >
                                <Plus className="h-4 w-4" />
                                Add Note to "{topic}"
                            </button>
                        </div>
                    </div>
                ))}

                {/* Book closing decoration */}
                <div className="mt-32 text-center opacity-20">
                    <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-6" />
                    <Sparkles className="h-10 w-10 mx-auto text-amber-500" />
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 mt-4">Closed Module Knowledge Base</p>
                </div>
              </div>
            </DrawingCanvas>
        ) : (
          Object.entries(byTopic).map(([topic, topicNotes]) => (
            <div key={topic}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                {topic}
                <span className="text-sm font-normal text-white/40">({topicNotes.length} notes)</span>
              </h3>
              <div className="grid gap-8 grid-cols-1">
                {topicNotes.map((note, idx) => (
                  <SmartNoteCard 
                    key={note.id} 
                    note={note} 
                    index={idx} 
                    onCreateMCQ={handlePerNoteMCQ}
                    onEdit={() => {
                      setNoteToEdit(note);
                      setIsEditNoteModalOpen(true);
                    }}
                    onDelete={handleDeleteNote}
                  />
                ))}
                <button 
                    onClick={() => {
                        setNewNote({ ...newNote, topic: topic });
                        setIsAddingNote(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-10 border-2 border-dashed border-white/10 rounded-3xl text-white/20 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all font-black uppercase tracking-widest text-[11px] flex flex-col items-center justify-center gap-3 mt-4"
                >
                    <Plus className="h-6 w-6" />
                    Add Note to "{topic}"
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Specific Focus Modal */}
      <Modal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        title="Create Focused MCQs"
      >
        <div className="space-y-4">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-indigo-400 mt-0.5" />
              <div>
                <h4 className="font-bold text-indigo-300 mb-1">AI-Powered Generation</h4>
                <p className="text-xs text-indigo-200/60">
                  Enter a specific topic (e.g., "Dates & Battles", "Economic Reforms") 
                  and AI will generate targeted questions from these notes.
                  These new questions will be added to your existing quiz pool.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase mb-2">Focus Topic</label>
            <input 
              type="text" 
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              placeholder="e.g. Only Dates and Years"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-white/40 uppercase mb-2">API Account</label>
             <div className="relative">
                <select
                  value={selectedAccountIndex}
                  onChange={(e) => setSelectedAccountIndex(parseInt(e.target.value))}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                >
                  <option value={1} className="bg-[#0A0A0A] text-white py-2">
                    OpenRouter Account 1
                  </option>
                  <option value={2} className="bg-[#0A0A0A] text-white py-2">
                    OpenRouter Account 2
                  </option>
                  <option value={3} className="bg-[#0A0A0A] text-white py-2">
                    NVIDIA API
                  </option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-white/40 uppercase mb-2">AI Model</label>
             <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                >
                  {SUPPORTED_MODELS
                    .filter(m => selectedAccountIndex === 3 ? m.provider === "NVIDIA" : m.provider === "OpenRouter")
                    .map(m => (
                    <option key={m.id} value={m.id} className="bg-[#0A0A0A] text-white py-2">
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setIsFocusModalOpen(false)}
              className="px-4 py-2 text-white/50 hover:text-white font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateFocusedMCQ}
              disabled={isGenerating || !focusTopic.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Generate MCQs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Per-Note MCQ Modal */}
      <Modal
        isOpen={isPerNoteMCQOpen}
        onClose={() => {
          setIsPerNoteMCQOpen(false);
          setSelectedNote(null);
        }}
        title="Create MCQ for This Note"
      >
        <div className="space-y-4">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-indigo-400 mt-0.5" />
              <div>
                <h4 className="font-bold text-indigo-300 mb-1">Create Specific MCQs</h4>
                <p className="text-xs text-indigo-200/60">
                  Focus on this specific note's content. You can add more details to focus on (e.g., "only names and dates" or "conceptual questions").
                </p>
              </div>
            </div>
          </div>

          {selectedNote && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-white/40 uppercase font-bold mb-1">Selected Note</p>
              <p className="text-sm font-bold text-indigo-300">{selectedNote.topic}</p>
              {selectedNote.subtopic && (
                <p className="text-xs text-white/50">{selectedNote.subtopic}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase mb-2">Focus On (e.g., "Only dates", "Conceptual only")</label>
            <input 
              type="text" 
              value={perNoteFocus}
              onChange={(e) => setPerNoteFocus(e.target.value)}
              placeholder="e.g. Only important dates"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-white/40 uppercase mb-2">API Account</label>
             <div className="relative">
                <select
                  value={selectedAccountIndex}
                  onChange={(e) => setSelectedAccountIndex(parseInt(e.target.value))}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                >
                  <option value={1} className="bg-[#0A0A0A] text-white py-2">
                    OpenRouter Account 1
                  </option>
                  <option value={2} className="bg-[#0A0A0A] text-white py-2">
                    OpenRouter Account 2
                  </option>
                  <option value={3} className="bg-[#0A0A0A] text-white py-2">
                    NVIDIA API
                  </option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-white/40 uppercase mb-2">AI Model</label>
             <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                >
                  {SUPPORTED_MODELS
                    .filter(m => selectedAccountIndex === 3 ? m.provider === "NVIDIA" : m.provider === "OpenRouter")
                    .map(m => (
                    <option key={m.id} value={m.id} className="bg-[#0A0A0A] text-white py-2">
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => {
                setIsPerNoteMCQOpen(false);
                setSelectedNote(null);
              }}
              className="px-4 py-2 text-white/50 hover:text-white font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generatePerNoteMCQ}
              disabled={isGenerating || !perNoteFocus.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Generate MCQs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Enhance Notes Modal */}
      <Modal
        isOpen={isEnhanceModalOpen}
        onClose={() => setIsEnhanceModalOpen(false)}
        title="Add & Enhance Notes"
      >
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-bold text-purple-300 mb-1">Expand Knowledge Base</h4>
                <p className="text-xs text-purple-200/60">
                  Add <strong>NEW</strong> notes about a specific topic without changing existing ones. 
                  Choose a style (SSC Fact-based or UPSC Descriptive) and the AI will add them + generate fresh MCQs.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase mb-2">Focus Topic</label>
            <input 
              type="text" 
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              placeholder="e.g. In-depth analysis of 1991 Reforms"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase mb-2">Note Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(["SSC", "UPSC", "BOTH"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setEnhanceStyle(style)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${
                    enhanceStyle === style 
                    ? "bg-purple-500/20 border-purple-500 text-purple-300" 
                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-white/40 uppercase mb-2">API Account</label>
             <div className="relative">
                <select
                  value={enhanceAccountIndex}
                  onChange={(e) => setEnhanceAccountIndex(parseInt(e.target.value))}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all font-medium"
                >
                  <option value={1} className="bg-[#0A0A0A] text-white py-2">
                    OpenRouter Account 1
                  </option>
                  <option value={2} className="bg-[#0A0A0A] text-white py-2">
                    OpenRouter Account 2
                  </option>
                  <option value={3} className="bg-[#0A0A0A] text-white py-2">
                    NVIDIA API
                  </option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-white/40 uppercase mb-2">AI Model</label>
             <div className="relative">
                <select
                  value={enhanceModel}
                  onChange={(e) => setEnhanceModel(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all font-medium"
                >
                  {SUPPORTED_MODELS
                    .filter(m => enhanceAccountIndex === 3 ? m.provider === "NVIDIA" : m.provider === "OpenRouter")
                    .map(m => (
                    <option key={m.id} value={m.id} className="bg-[#0A0A0A] text-white py-2">
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setIsEnhanceModalOpen(false)}
              className="px-4 py-2 text-white/50 hover:text-white font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEnhanceNotes}
              disabled={isGenerating || !focusTopic.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Add Notes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Mind Map Modal */}
      <Modal
        isOpen={isMindMapModalOpen}
        onClose={() => setIsMindMapModalOpen(false)}
        title="Generate Mind Map"
        className="max-w-4xl"
      >
        <div className="space-y-4">
          {!mindMapContent ? (
            <div className="space-y-4">
                <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-pink-400 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-pink-300 mb-1">Visual Learning</h4>
                        <p className="text-xs text-pink-200/60">
                        Create a visual map of concepts logic. Enter a focus topic or leave blank for an overview.
                        </p>
                    </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-2">Focus Topic (Optional)</label>
                    <input 
                    type="text" 
                    value={mindMapFocus}
                    onChange={(e) => setMindMapFocus(e.target.value)}
                    placeholder="e.g. Mughal Empire Genealogy"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-2">API Account</label>
                    <div className="relative">
                        <select
                        value={mindMapAccountIndex}
                        onChange={(e) => setMindMapAccountIndex(parseInt(e.target.value))}
                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-all font-medium"
                        >
                        <option value={1} className="bg-[#0A0A0A] text-white py-2">OpenRouter Account 1</option>
                        <option value={2} className="bg-[#0A0A0A] text-white py-2">OpenRouter Account 2</option>
                        <option value={3} className="bg-[#0A0A0A] text-white py-2">NVIDIA API</option>
                        </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-2">AI Model</label>
                    <div className="relative">
                        <select
                        value={mindMapModel}
                        onChange={(e) => setMindMapModel(e.target.value)}
                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-all font-medium"
                        >
                        {SUPPORTED_MODELS
                            .filter(m => mindMapAccountIndex === 3 ? m.provider === "NVIDIA" : m.provider === "OpenRouter")
                            .map(m => (
                            <option key={m.id} value={m.id} className="bg-[#0A0A0A] text-white py-2">
                            {m.name}
                            </option>
                        ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>

              <div className="pt-2 border-t border-white/5">
                 <label className="block text-xs font-bold text-white/40 uppercase mb-2">Display Style</label>
                 <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMindMapFormat("MERMAID")}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${
                        mindMapFormat === "MERMAID" 
                        ? "bg-pink-500/20 border-pink-500 text-pink-300" 
                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      Visual Map
                    </button>
                    <button
                      onClick={() => setMindMapFormat("TEXT")}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${
                        mindMapFormat === "TEXT" 
                        ? "bg-pink-500/20 border-pink-500 text-pink-300" 
                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      Text Tree (List)
                    </button>
                 </div>
              </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button 
                    onClick={() => setIsMindMapModalOpen(false)}
                    className="px-4 py-2 text-white/50 hover:text-white font-medium text-sm transition-colors"
                    >
                    Cancel
                    </button>
                    <button
                    onClick={handleGenerateMindMap}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                    {isGenerating ? (
                        <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating Map...</span>
                        </>
                    ) : (
                        <>
                        <Zap className="h-4 w-4" />
                        <span>Generate</span>
                        </>
                    )}
                    </button>
                </div>
            </div>
          ) : (
            <div className="h-[60vh] bg-white/5 rounded-xl border border-white/10 overflow-hidden relative">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button 
                         onClick={handleDeleteMindMap}
                         disabled={isDeletingMap}
                         className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-200 text-xs rounded-lg backdrop-blur-md transition-all border border-red-500/30"
                    >
                        {isDeletingMap ? "Deleting..." : "Delete Map"}
                    </button>
                    <button 
                         onClick={() => {
                           setMindMapContent("");
                           setMindMapId(null);
                         }}
                         className="px-3 py-1 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg backdrop-blur-md transition-all"
                    >
                        New Map
                    </button>
                </div>
                <div className={`w-full h-full flex items-start justify-center p-4 bg-transparent overflow-auto ${mindMapContent.startsWith("mindmap") || mindMapContent.startsWith("graph") ? "mermaid" : ""}`}>
                    {mindMapContent.startsWith("mindmap") || mindMapContent.startsWith("graph") ? (
                         mindMapContent
                    ) : (
                        <pre className="text-white/80 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                            {mindMapContent}
                        </pre>
                    )}
                </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Note Modal */}
      <Modal
        isOpen={isEditNoteModalOpen}
        onClose={() => setIsEditNoteModalOpen(false)}
        title="Edit Smart Note"
        className="max-w-2xl"
      >
        {noteToEdit && (
          <form onSubmit={handleUpdateNote} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase mb-2">Topic</label>
              <input 
                type="text" 
                value={noteToEdit.topic}
                onChange={(e) => setNoteToEdit({...noteToEdit, topic: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase mb-2">Subtopic</label>
              <input 
                type="text" 
                value={noteToEdit.subtopic || ""}
                onChange={(e) => setNoteToEdit({...noteToEdit, subtopic: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase mb-2">Content</label>
              <textarea 
                rows={6}
                value={noteToEdit.content}
                onChange={(e) => setNoteToEdit({...noteToEdit, content: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
              />
            </div>
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => handleDeleteNote(noteToEdit.id)}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 transition-colors font-bold text-sm"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Note</span>
              </button>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditNoteModalOpen(false)}
                  className="px-4 py-2 text-white/50 hover:text-white font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingNote}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {isUpdatingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
