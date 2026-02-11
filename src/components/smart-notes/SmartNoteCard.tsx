"use client";

import { Star, BookOpen, Brain, AlertTriangle, Lightbulb, Edit2 } from "lucide-react";
import { motion } from "framer-motion";

interface MemoryTechnique {
  type: string;
  technique: string;
  explanation: string;
}

interface SmartNote {
  id: string;
  topic: string;
  subtopic?: string;
  content: string;
  examRelevance: "SSC" | "UPSC" | "BOTH";
  importance: number;
  memoryTechnique: MemoryTechnique;
  examTips?: string;
  commonMistakes?: string;
}

interface SmartNoteCardProps {
  note: SmartNote;
  index?: number;
  onCreateMCQ?: (note: SmartNote) => void;
  onEdit?: (note: SmartNote) => void;
}

export function SmartNoteCard({ note, index = 0, onCreateMCQ, onEdit }: SmartNoteCardProps) {
  const getExamBadgeColor = (exam: string) => {
    switch (exam) {
      case "SSC":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "UPSC":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "BOTH":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTechniqueIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "mnemonic":
        return "🧠";
      case "acronym":
        return "🔤";
      case "story":
        return "📖";
      case "visual":
        return "👁️";
      case "rhyme":
        return "🎵";
      case "association":
        return "🔗";
      default:
        return "💡";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-3xl border border-black/5 bg-[#FDFDFD] p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden"
    >
      {/* Texture/Paper Feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
      
      {/* Top Accent Bar */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${
        note.examRelevance === "UPSC" ? "bg-purple-500/50" : "bg-indigo-500/50"
      }`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-4 py-1 text-[11px] font-black rounded-full border tracking-widest uppercase shadow-sm ${getExamBadgeColor(note.examRelevance)}`}>
              {note.examRelevance}
            </span>
            <div className="flex items-center gap-0.5 opacity-40">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < note.importance ? "text-amber-500 fill-amber-500" : "text-black/10"}`}
                />
              ))}
            </div>
          </div>
          <h3 className="font-black text-3xl text-gray-900 mb-2 tracking-tight uppercase">{note.topic}</h3>
          {note.subtopic && (
            <div className="inline-block px-4 py-1.5 rounded-full bg-black/5 border border-black/5">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed">{note.subtopic}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(note)}
              className="p-3 bg-black/[0.03] hover:bg-black/[0.08] text-gray-400 hover:text-gray-900 rounded-xl transition-all"
              title="Edit Note"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          {onCreateMCQ && (
            <button
              onClick={() => onCreateMCQ(note)}
              className="p-3 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600/60 hover:text-indigo-600 rounded-xl transition-all"
              title="Generate MCQ from this note"
            >
              <Brain className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-xl text-gray-700 leading-relaxed mb-8 space-y-4 font-normal relative z-10">
        {note.content.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-4" />;
          const isPointer = trimmed.startsWith('→') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•');
          return (
            <p key={i} className={`whitespace-pre-wrap ${isPointer ? 'text-gray-900 font-medium pl-6 relative' : ''}`}>
              {isPointer && <span className="absolute left-0 text-indigo-500/50">▶</span>}
              {trimmed.replace(/^[→\-*•]\s*/, '')}
            </p>
          );
        })}
      </div>

      {/* Smart Note Add-ons - Simplified & Elegant */}
      <div className="space-y-6 pt-8 border-t border-black/5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {note.examTips && (
            <div className="rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 p-5 group/tip hover:bg-emerald-500/[0.06] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Strategy</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{note.examTips}</p>
            </div>
            )}
            {note.commonMistakes && (
            <div className="rounded-2xl bg-rose-500/[0.03] border border-rose-500/10 p-5 group/mistake hover:bg-rose-500/[0.06] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Warning</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{note.commonMistakes}</p>
            </div>
            )}
        </div>

        {/* UPSC Specific Extended Fields (Integrated) */}
        {(note.memoryTechnique as any)?.upscExtra && (
            <div className="space-y-4">
                {(note.memoryTechnique as any).upscExtra.currentRelevance && (
                    <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10">
                        <span className="font-black text-amber-700/60 uppercase tracking-[0.2em] text-[10px] block mb-2">Current Context</span>
                        <p className="text-base text-gray-700/80 italic font-medium leading-relaxed">
                            { (note.memoryTechnique as any).upscExtra.currentRelevance }
                        </p>
                    </div>
                )}
                
                {(note.memoryTechnique as any).upscExtra.pyqAnalysis && (
                    <div className="p-5 rounded-2xl bg-sky-500/[0.03] border border-sky-500/10">
                        <span className="font-black text-sky-700/60 uppercase tracking-[0.2em] text-[10px] block mb-2">PYQ Analysis</span>
                        <p className="text-sm text-gray-700/80 leading-relaxed font-medium">
                            { (note.memoryTechnique as any).upscExtra.pyqAnalysis }
                        </p>
                    </div>
                )}

                {((note.memoryTechnique as any).upscExtra.analyticalAngles && Array.isArray((note.memoryTechnique as any).upscExtra.analyticalAngles)) && (
                    <div className="p-6 rounded-2xl border border-black/5 bg-black/[0.01]">
                        <span className="font-black text-gray-400 uppercase tracking-[0.2em] text-[10px] block mb-4">Multi-Dimensional View</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                            {(note.memoryTechnique as any).upscExtra.analyticalAngles.map((angle: string, i: number) => (
                            <div key={i} className="text-sm text-gray-600 flex items-start gap-3 py-1 font-medium">
                                <span className="text-indigo-400 font-bold shrink-0">◇</span>
                                <span className="leading-snug">{angle}</span>
                            </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </motion.div>
  );
}
