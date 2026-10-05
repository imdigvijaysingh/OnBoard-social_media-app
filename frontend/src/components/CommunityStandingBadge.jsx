import React from "react";

const CommunityStandingBadge = ({
  standing = "good_standing",
  trustScore = 100,
  onClick = null,
  size = "sm",
  className = "",
}) => {
  const isGood = standing === "good_standing";
  const isReview = standing === "under_review";

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3 py-1.5 text-xs gap-2",
  }[size] || "px-2.5 py-1 text-xs gap-1.5";

  if (isGood) {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center rounded-full font-semibold border transition-all ${
          onClick ? "cursor-pointer hover:shadow-md" : ""
        } bg-emerald-50/80 border-emerald-200 text-emerald-800 shadow-sm shadow-emerald-500/10 ${sizeClasses} ${className}`}
        title={`Community Safety: Good Standing (${trustScore}% Trust Score)`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <i className="fa-solid fa-shield-halved text-emerald-600 text-[11px]"></i>
        <span className="font-bold tracking-tight">Good Standing</span>
        <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded-full">
          {trustScore}%
        </span>
      </div>
    );
  }

  if (isReview) {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center rounded-full font-semibold border transition-all ${
          onClick ? "cursor-pointer hover:shadow-md" : ""
        } bg-amber-50/80 border-amber-200 text-amber-800 shadow-sm ${sizeClasses} ${className}`}
        title="Community Safety: Under Review"
      >
        <i className="fa-solid fa-triangle-exclamation text-amber-600 text-[11px]"></i>
        <span className="font-bold tracking-tight">Under Review</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-semibold border transition-all ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      } bg-rose-50/80 border-rose-200 text-rose-800 shadow-sm ${sizeClasses} ${className}`}
      title="Community Safety: Restricted"
    >
      <i className="fa-solid fa-circle-exclamation text-rose-600 text-[11px]"></i>
      <span className="font-bold tracking-tight">Restricted</span>
    </div>
  );
};

export default CommunityStandingBadge;
