"use client";

import { useState, useEffect } from "react";
import { SmartNoteCard } from "./SmartNoteCard";
import { Loader2, BookOpen, GraduationCap, FileText, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
                <SmartNoteCard key={note.id} note={note} index={idx} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
