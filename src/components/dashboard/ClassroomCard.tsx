"use client";

import { motion } from "framer-motion";
import { BookOpen, MoreVertical, BrainCircuit, Rocket, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassroomCardProps {
  id: string;
  name: string;
  subject: string;
  materialCount: number;
  strength: number; // 0 to 100
  onDelete?: (e: React.MouseEvent) => void;
}

export function ClassroomCard({ id, name, subject, materialCount, strength, onDelete }: ClassroomCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/50 hover:bg-white/[0.08]"
    >
      {/* Decorative Glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl transition-all group-hover:bg-indigo-500/20" />

      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-indigo-500/20 p-3 text-indigo-400">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(e);
              }}
              className="text-white/20 hover:text-red-400 transition-colors p-2 -m-2 relative z-10"
              title="Delete Classroom"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button className="text-white/40 hover:text-white">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{name}</h3>
        <p className="text-sm text-white/50">{subject}</p>
      </div>

      <div className="mt-8 space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Topic Strength</span>
            <span className="font-medium text-indigo-400">{strength}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${strength}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>{materialCount} Materials</span>
          </div>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            <span>LEARN</span>
            <Rocket className="h-3.5 w-3.5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
