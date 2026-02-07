"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, HelpCircle, ArrowRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MCQ {
  id?: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  pyqContext?: string;
}

interface McqCardProps {
  question: MCQ;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
}

export function McqCard({ question, onAnswer, onNext }: McqCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    onAnswer(option === question.answer);
  };

  const isCorrect = selected === question.answer;

  return (
    <div className="mx-auto max-w-2xl w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
          <HelpCircle className="h-4 w-4" />
          Question Context: {question.pyqContext || "General Pattern"}
        </div>

        <h2 className="text-2xl font-bold leading-tight text-white mb-10">
          {question.question}
        </h2>

        <div className="grid gap-4">
          {question.options.map((option, idx) => {
            const isTarget = selected === option;
            const isCorrectOption = option === question.answer;
            
            let stateStyle = "border-white/10 bg-white/5 hover:bg-white/10";
            if (showResult) {
              if (isCorrectOption) stateStyle = "border-green-500/50 bg-green-500/10 text-green-400";
              else if (isTarget) stateStyle = "border-red-500/50 bg-red-500/10 text-red-400";
              else stateStyle = "border-white/5 bg-white/[0.02] opacity-50";
            }

            return (
              <button
                key={idx}
                disabled={showResult}
                onClick={() => handleSelect(option)}
                className={cn(
                  "relative flex items-center justify-between rounded-2xl border px-6 py-5 text-left transition-all duration-300",
                  stateStyle
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white/40">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-medium">{option}</span>
                </div>
                
                {showResult && isCorrectOption && <Check className="h-5 w-5 text-green-500" />}
                {showResult && isTarget && !isCorrectOption && <X className="h-5 w-5 text-red-500" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 space-y-6 pt-8 border-t border-white/10"
            >
              <div className="rounded-2xl bg-indigo-500/5 p-6 border border-indigo-500/10">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-3">
                  <Lightbulb className="h-4 w-4" />
                  ANALYSIS & EXPLANATION
                </div>
                <p className="text-white/70 leading-relaxed text-sm">
                  {question.explanation}
                </p>
              </div>

              <motion.button
                whileHover={{ x: 5 }}
                onClick={() => onNext()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-500"
              >
                CONTINUE TO NEXT
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
