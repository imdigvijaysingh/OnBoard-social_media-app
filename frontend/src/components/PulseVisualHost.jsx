import React, { useEffect, useState } from "react";
import pulse from "../utils/pulseEngine";

const PulseVisualHost = () => {
  const [activePulse, setActivePulse] = useState(null);

  useEffect(() => {
    const unsubscribe = pulse.subscribe((event) => {
      // Handle high-tier visual events (Board accepted, Post published)
      if (event.type === "BOARD_ACCEPTED") {
        setActivePulse({
          id: event.timestamp,
          type: "BOARD_ACCEPTED",
          title: "Connection Established",
          subtitle: event.payload?.targetName
            ? `You and ${event.payload.targetName} are now Boarded 🫂`
            : "You are now Boarded together 🫂",
        });
        setTimeout(() => setActivePulse(null), 3000);
      } else if (event.type === "POST_PUBLISHED") {
        setActivePulse({
          id: event.timestamp,
          type: "POST_PUBLISHED",
          title: "Shared to Your World",
          subtitle: "Your post is now live in the cabin feed ✨",
        });
        setTimeout(() => setActivePulse(null), 2500);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!activePulse) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      {activePulse.type === "BOARD_ACCEPTED" ? (
        <div className="bg-slate-950/85 text-white backdrop-blur-xl px-5 py-3 rounded-full border border-indigo-500/40 shadow-2xl shadow-indigo-500/20 flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm shadow-inner animate-pulse">
            🫂
          </div>
          <div>
            <h4 className="text-xs font-black tracking-tight text-white leading-none">
              {activePulse.title}
            </h4>
            <p className="text-[11px] text-indigo-200/90 mt-0.5 font-medium">
              {activePulse.subtitle}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/90 text-white backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-xl flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
            ✓
          </span>
          <div>
            <h4 className="text-xs font-bold text-white">{activePulse.title}</h4>
            <p className="text-[10px] text-slate-300">{activePulse.subtitle}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PulseVisualHost;
