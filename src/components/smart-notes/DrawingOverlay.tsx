"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Pencil, X } from 'lucide-react';

interface DrawingCanvasProps {
  children: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

const COLORS = [
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#000000', // Black
];

export function DrawingCanvas({ children, isActive, onToggle, className = "" }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Set actual resolution
        const dpr = window.devicePixelRatio || 1;
        canvas.width = parent.offsetWidth * dpr;
        canvas.height = parent.offsetHeight * dpr;
        
        // Scale back for CSS display
        canvas.style.width = `${parent.offsetWidth}px`;
        canvas.style.height = `${parent.offsetHeight}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isActive]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive) return;
    setIsDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getPos(e);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    setLastPos(currentPos);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      const mouseEvent = e as React.MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 z-[60] flex items-center gap-2">
            {isActive && (
                <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md border border-black/10 p-2 rounded-2xl shadow-xl shadow-black/5 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex items-center gap-1.5 px-1">
                      {COLORS.map((c) => (
                          <button
                              key={c}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setColor(c); }}
                              className={`w-5 h-5 rounded-full transition-all active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-black/20 scale-125' : 'hover:scale-110 opacity-60 hover:opacity-100'}`}
                              style={{ backgroundColor: c }}
                          />
                      ))}
                    </div>
                    <div className="w-px h-5 bg-black/10 mx-1" />
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearCanvas(); }}
                        className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-rose-600 transition-colors bg-black/[0.03] hover:bg-rose-50 rounded-lg"
                    >
                        Clear
                    </button>
                </div>
            )}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`w-11 h-11 rounded-xl transition-all shadow-lg flex items-center justify-center border ${
                    isActive 
                    ? 'bg-black text-white border-black scale-105' 
                    : 'bg-white text-black/30 hover:text-black border-black/5 hover:border-black/10 shadow-black/2'
                }`}
                title={isActive ? "Close Drawing" : "Draw on Note"}
            >
                {isActive ? <X className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
            </button>
        </div>

        {/* Canvas Overlay */}
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-50 touch-none ${isActive ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none overflow-hidden'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
        />

        {/* Content */}
        <div className={`transition-opacity duration-300 ${isActive ? 'opacity-90 select-none pointer-events-none' : ''}`}>
            {children}
        </div>
    </div>
  );
}
