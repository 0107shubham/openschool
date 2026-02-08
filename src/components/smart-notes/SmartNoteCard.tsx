"use client";

import { Star, BookOpen, Brain, AlertTriangle, Lightbulb } from "lucide-react";
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
}

export function SmartNoteCard({ note, index = 0, onCreateMCQ }: SmartNoteCardProps) {
  const getExamBadgeColor = (exam: string) => {
    switch (exam) {
      case "SSC":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "UPSC":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "BOTH":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
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
      className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/5 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getExamBadgeColor(note.examRelevance)}`}>
              {note.examRelevance}
            </span>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < note.importance ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`}
                />
              ))}
            </div>
          </div>
          <h3 className="font-bold text-white">{note.topic}</h3>
          {note.subtopic && (
            <p className="text-sm font-medium text-indigo-400/90">{note.subtopic}</p>
          )}
        </div>
        {onCreateMCQ && (
          <button
            onClick={() => onCreateMCQ(note)}
            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
            title="Generate MCQ from this note"
          >
            <Brain className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-white/80 leading-relaxed mb-4">{note.content}</p>

      {/* Memory Technique - Highlighted */}
      {note.memoryTechnique && (
        <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getTechniqueIcon(note.memoryTechnique.type)}</span>
            <span className="text-sm font-black text-indigo-400 uppercase tracking-wider">
              {note.memoryTechnique.type || "Memory Trick"}
            </span>
          </div>
          <p className="text-sm font-medium text-white mb-1">
            "{note.memoryTechnique.technique}"
          </p>
          {note.memoryTechnique.explanation && (
            <p className="text-xs text-white/50">{note.memoryTechnique.explanation}</p>
          )}
        </div>
      )}

      {/* Exam Tips & Common Mistakes */}
      <div className="grid grid-cols-2 gap-2">
        {note.examTips && (
          <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
            <div className="flex items-center gap-1 mb-1">
              <Lightbulb className="h-4 w-4 text-green-400" />
              <span className="text-xs font-black text-green-400 uppercase tracking-wide">Exam Tip</span>
            </div>
            <p className="text-xs text-white/60">{note.examTips}</p>
          </div>
        )}
        {note.commonMistakes && (
          <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs font-black text-red-400 uppercase tracking-wide">Common Mistake</span>
            </div>
            <p className="text-xs text-white/60">{note.commonMistakes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
