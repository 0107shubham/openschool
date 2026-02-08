"use client";

import { useState, useEffect } from "react";
import { SmartNoteCard } from "./SmartNoteCard";
import { Loader2, BookOpen, GraduationCap, FileText, Filter, Target, Sparkles, Plus, Zap, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner"; 
import mermaid from "mermaid"; 

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
          accountIndex: selectedAccountIndex
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
          accountIndex: enhanceAccountIndex
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
          accountIndex: selectedAccountIndex
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-purple-500/20"
            >
              <Zap className="h-4 w-4" />
              <span>Add/Enhance Notes</span>
            </button>
            <button
              onClick={() => setIsFocusModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              <Target className="h-4 w-4" />
              <span>Focused MCQ</span>
            </button>
            <button
              onClick={() => setIsMindMapModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-pink-500/20"
            >
              <Brain className="h-4 w-4" />
              <span>Mind Map</span>
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
      </div>

      {/* Notes by Topic */}
      <div className="space-y-8">
        {Object.entries(byTopic).map(([topic, topicNotes]) => (
          <div key={topic}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              {topic}
              <span className="text-sm font-normal text-white/40">({topicNotes.length} notes)</span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {topicNotes.map((note, idx) => (
                <SmartNoteCard 
                  key={note.id} 
                  note={note} 
                  index={idx} 
                  onCreateMCQ={handlePerNoteMCQ}
                />
              ))}
            </div>
          </div>
        ))}
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
    </div>
  );
}
