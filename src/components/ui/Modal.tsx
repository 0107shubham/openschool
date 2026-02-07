"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className = "max-w-md" }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed left-1/2 top-1/2 z-50 w-full ${className} -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button 
                onClick={onClose}
                className="rounded-full p-1 hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/50" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
