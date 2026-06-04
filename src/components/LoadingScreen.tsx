"use client";

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  isLoaded: boolean;
}

export default function LoadingScreen({ isLoaded }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const timer = window.setTimeout(() => setVisible(false), 500);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-[#050505] transition-opacity duration-500 ${
        isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="h-10 w-10 rounded-full border-2 border-white/15 border-t-[#f54900] animate-spin" />
      <div className="w-40 h-px bg-white/10 overflow-hidden">
        <div className="h-full w-1/2 bg-[#f54900] animate-pulse" />
      </div>
      <p className="font-mono text-[10px] tracking-[0.28em] text-neutral-500 uppercase">
        Loading model
      </p>
    </div>
  );
}
