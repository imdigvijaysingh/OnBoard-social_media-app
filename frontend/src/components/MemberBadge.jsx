import React from "react";

const MemberBadge = ({
  tier = "standard",
  size = "sm",
  showLabel = false,
  className = "",
  showStandard = false,
}) => {
  if (!tier || (tier === "standard" && !showStandard)) {
    return null;
  }

  // Size definitions
  const sizeClasses = {
    xs: {
      pill: "px-1.5 py-0.5 text-[9px] gap-1",
      icon: "text-[9px]",
    },
    sm: {
      pill: "px-2 py-0.5 text-[10px] gap-1",
      icon: "text-[10px]",
    },
    md: {
      pill: "px-2.5 py-1 text-xs gap-1.5",
      icon: "text-xs",
    },
    lg: {
      pill: "px-3 py-1.5 text-sm gap-2",
      icon: "text-sm",
    },
  }[size] || {
    pill: "px-2 py-0.5 text-[10px] gap-1",
    icon: "text-[10px]",
  };

  if (tier === "diamond") {
    return (
      <span
        title="💎 Diamond Supporter (First Class)"
        className={`inline-flex items-center font-extrabold rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-600 text-slate-900 shadow-sm shadow-cyan-400/40 ring-1 ring-cyan-200/80 tracking-wide select-none ${sizeClasses.pill} ${className}`}
      >
        <i className={`fa-solid fa-gem text-blue-900 drop-shadow-sm ${sizeClasses.icon}`}></i>
        {showLabel && <span className="font-black uppercase tracking-tight text-[9px] text-blue-950">First Class</span>}
      </span>
    );
  }

  if (tier === "gold_vip") {
    return (
      <span
        title="👑 Gold VIP Member"
        className={`inline-flex items-center font-extrabold rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 shadow-sm shadow-amber-500/35 ring-1 ring-amber-200/80 tracking-wide select-none ${sizeClasses.pill} ${className}`}
      >
        <i className={`fa-solid fa-crown text-amber-950 drop-shadow-sm ${sizeClasses.icon}`}></i>
        {showLabel && <span className="font-black uppercase tracking-tight text-[9px] text-amber-950">Gold VIP</span>}
      </span>
    );
  }

  if (tier === "creator_pro") {
    return (
      <span
        title="🚀 Creator Pro"
        className={`inline-flex items-center font-extrabold rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm shadow-purple-500/35 ring-1 ring-purple-300/60 tracking-wide select-none ${sizeClasses.pill} ${className}`}
      >
        <i className={`fa-solid fa-rocket text-white drop-shadow-sm ${sizeClasses.icon}`}></i>
        {showLabel && <span className="font-black uppercase tracking-tight text-[9px]">Creator Pro</span>}
      </span>
    );
  }

  if (tier === "standard" && showStandard) {
    return (
      <span
        title="🌿 Passenger Member"
        className={`inline-flex items-center font-bold rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200 select-none ${sizeClasses.pill} ${className}`}
      >
        <i className={`fa-solid fa-passport text-slate-500 ${sizeClasses.icon}`}></i>
        {showLabel && <span className="text-[9px]">Passenger</span>}
      </span>
    );
  }

  return null;
};

export default MemberBadge;
