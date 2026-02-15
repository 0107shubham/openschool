"use client";

import { useEffect, useState } from "react";
import { McqCard, MCQ } from "@/components/quiz/McqCard";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trophy, RotateCcw, Home, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const examType = searchParams.get("exam");
  
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [sourceInfo, setSourceInfo] = useState({ source: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [classroomId, setClassroomId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [id, examType]);

  const fetchQuiz = async () => {
    try {
      const url = new URL(`/api/quiz/${id}`, window.location.origin);
      if (examType) url.searchParams.set("exam", examType);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.mcqs && Array.isArray(data.mcqs)) {
        setQuestions(data.mcqs);
        setSourceInfo({ source: data.source || "Unknown", type: data.type || "Quiz" });
        setClassroomId(data.classroomId || null);
      }
    } catch (error) {
       console.error("Failed to load quiz", error);
    } finally {
       setLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowScore(true);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Error/Empty State
  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] text-white gap-4">
        <div className="rounded-full bg-yellow-500/10 p-4">
            <AlertTriangle className="h-10 w-10 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold">No Questions Found</h2>
        <p className="text-white/40 max-w-md text-center">
            This material needs to be analyzed first. Go back and upload content to generate questions.
        </p>
        <Link 
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-semibold hover:bg-white/20 transition-all"
        >
            <Home className="h-5 w-5" />
            Back to Dashboard
        </Link>
      </div>
    );
  }

  // Score Screen
  if (showScore) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/20 mb-6">
            <Trophy className="h-10 w-10 text-indigo-400" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-2">Quiz Complete!</h2>
          <p className="text-white/50 mb-8">You showed great focus.</p>

          <div className="mb-8 overflow-hidden rounded-2xl bg-black/20 p-6">
            <div className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Final Score</div>
            <div className="text-6xl font-black text-white">
              {percentage}%
            </div>
            <div className="mt-2 text-indigo-400 font-medium">
              {score} out of {questions.length} correct
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-4 font-bold text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              Retry
            </button>
            <Link href={classroomId ? `/classroom/${classroomId}` : "/dashboard"}>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-500 transition-colors">
                <Home className="h-5 w-5" />
                Done
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Quiz Interface
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      {/* Quiz Header */}
      <header className="mx-auto max-w-4xl flex items-center justify-between mb-12">
        <Link 
          href={classroomId ? `/classroom/${classroomId}` : "/dashboard"} 
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/50 hover:bg-white/10 hover:text-white transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Exit
        </Link>
        <div className="text-center">
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">
            {examType ? `${examType} PREP • ` : ""}{sourceInfo.type}
          </div>
          <h1 className="text-lg font-black uppercase tracking-tighter leading-none">
            {sourceInfo.source}
          </h1>
        </div>
        <div className="text-sm font-bold text-white/30">
          QUESTION {currentQuestionIndex + 1} / {questions.length}
        </div>
      </header>

      {/* Question Card */}
      <div className="mx-auto max-w-3xl">
        <AnimatePresence mode="wait">
           <McqCard 
               key={currentQuestionIndex}
               question={questions[currentQuestionIndex]}
               onAnswer={handleAnswer}
               onNext={handleNext}
           />
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 h-1 bg-white/10 w-full">
        <motion.div 
          className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
