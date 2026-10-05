import React, { useState, useEffect } from "react";
import pulse from "../utils/pulseEngine";

// Curated aesthetic gradients for text currents
const GRADIENT_PRESETS = [
  { id: "ocean", label: "Ocean Flow", bg: "from-cyan-500 via-blue-600 to-indigo-700" },
  { id: "cosmic", label: "Deep Tide", bg: "from-indigo-600 via-purple-600 to-pink-500" },
  { id: "sunset", label: "Sunset Drift", bg: "from-amber-500 via-rose-500 to-purple-600" },
  { id: "emerald", label: "Aqua Coast", bg: "from-emerald-500 via-teal-600 to-cyan-700" },
  { id: "midnight", label: "Midnight Stream", bg: "from-slate-900 via-indigo-950 to-purple-950" },
  { id: "aurora", label: "Neon Aurora", bg: "from-fuchsia-600 via-pink-600 to-rose-500" },
];

const VIBE_TAGS = [
  "🌊 Chilling",
  "🚀 Shipping",
  "✨ In Flow",
  "🎧 Vibing",
  "☕ Café Mode",
  "🔥 On Fire",
];

const QUICK_EMOJIS = ["🌊", "✨", "🚀", "🔥", "🌴", "🎧", "☕", "💫", "🫡", "❤️"];

export default function CrewCurrents({ currentUser, crewSuggestions = [] }) {
  const [currents, setCurrents] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null); // Which user's current
  const [activeSlideIndex, setActiveSlideIndex] = useState(0); // Which slide inside that current
  const [isPaused, setIsPaused] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Story Viewer Preview & Interactive States
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyToast, setReplyToast] = useState(null);
  const [likedCurrents, setLikedCurrents] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Creation State
  const [createMode, setCreateMode] = useState("text"); // "text" | "photo"
  const [textContent, setTextContent] = useState("");
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0]);
  const [selectedVibe, setSelectedVibe] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // Initialize sample / stored currents
  useEffect(() => {
    const saved = localStorage.getItem("onboard_crew_currents");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((p) => p.stories && p.stories.length > 0)
        ) {
          setCurrents(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse currents", e);
      }
    }

    // Default lively crew currents
    const initialCurrents = [
      {
        id: "demo-1",
        userId: "radhakrishna",
        userName: "radhakrishna",
        name: "Digvijay Pundir",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        viewed: false,
        stories: [
          {
            id: "s1-1",
            type: "text",
            text: "Exploring the clean new OnBoard feed today! 🌊 The vibe is so peaceful.",
            gradient: "from-cyan-500 via-blue-600 to-indigo-700",
            createdAt: "2h ago",
          },
          {
            id: "s1-2",
            type: "photo",
            image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
            caption: "Late night building sessions with good coffee ☕✨",
            createdAt: "1h ago",
          },
        ],
      },
      {
        id: "demo-2",
        userId: "sushantup",
        userName: "sushantup",
        name: "Sushant Upadhyay",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        viewed: false,
        stories: [
          {
            id: "s2-1",
            type: "text",
            text: "Organizing our crew chapters and travel logs 🗺️ Heading into the weekend flow.",
            gradient: "from-indigo-600 via-purple-600 to-pink-500",
            createdAt: "4h ago",
          },
        ],
      },
      {
        id: "demo-3",
        userId: "digvijaysingh",
        userName: "digvijaysingh",
        name: "Digvijay Singh",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        viewed: false,
        stories: [
          {
            id: "s3-1",
            type: "photo",
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
            caption: "Watching the tides roll in before sunset 🌅🌊",
            createdAt: "5h ago",
          },
        ],
      },
    ];

    setCurrents(initialCurrents);
    localStorage.setItem("onboard_crew_currents", JSON.stringify(initialCurrents));
  }, []);

  // Timer for auto-advancing slides in viewer
  useEffect(() => {
    if (activeStoryIndex === null || isPaused) return;

    const currentStoryUser = currents[activeStoryIndex];
    if (!currentStoryUser) return;

    const timer = setTimeout(() => {
      if (activeSlideIndex < currentStoryUser.stories.length - 1) {
        setActiveSlideIndex((prev) => prev + 1);
      } else {
        // Next user or close
        if (activeStoryIndex < currents.length - 1) {
          setActiveStoryIndex((prev) => prev + 1);
          setActiveSlideIndex(0);
        } else {
          closeViewer();
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeStoryIndex, activeSlideIndex, isPaused, currents]);

  const openStory = (userIndex) => {
    pulse.pop();
    setActiveStoryIndex(userIndex);
    setActiveSlideIndex(0);

    // Mark as viewed
    setCurrents((prev) => {
      const next = [...prev];
      next[userIndex] = { ...next[userIndex], viewed: true };
      localStorage.setItem("onboard_crew_currents", JSON.stringify(next));
      return next;
    });
  };

  const closeViewer = () => {
    setActiveStoryIndex(null);
    setActiveSlideIndex(0);
    setIsPaused(false);
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    pulse.tap();
    const currentStoryUser = currents[activeStoryIndex];
    if (activeSlideIndex < currentStoryUser.stories.length - 1) {
      setActiveSlideIndex((prev) => prev + 1);
    } else if (activeStoryIndex < currents.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setActiveSlideIndex(0);
    } else {
      closeViewer();
    }
  };

  const handlePrevSlide = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    pulse.tap();
    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
    } else if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      const prevUserStories = currents[activeStoryIndex - 1]?.stories || [];
      setActiveSlideIndex(Math.max(0, prevUserStories.length - 1));
    }
  };

  const triggerReaction = (emoji) => {
    pulse.pop();
    const id = Date.now() + Math.random();
    const leftOffset = 20 + Math.random() * 60; // 20% to 80%
    setFloatingReactions((prev) => [...prev, { id, emoji, leftOffset }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1200);
  };

  const handleSendReply = (e) => {
    if (e) e.preventDefault();
    if (!replyMessage.trim() || activeStoryIndex === null) return;
    const authorName = currents[activeStoryIndex]?.name || currents[activeStoryIndex]?.userName || "Creator";
    pulse.tap();
    setReplyToast(`Reply sent to ${authorName}! 💬`);
    setReplyMessage("");
    setTimeout(() => setReplyToast(null), 3000);
  };

  const toggleLikeCurrent = (storyId) => {
    pulse.pop();
    setLikedCurrents((prev) => ({
      ...prev,
      [storyId]: !prev[storyId],
    }));
    triggerReaction("❤️");
  };

  const handleCopyLink = () => {
    pulse.tap();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Keyboard navigation for Current viewer
  useEffect(() => {
    if (activeStoryIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeViewer();
      } else if (e.key === "ArrowRight") {
        handleNextSlide(e);
      } else if (e.key === "ArrowLeft") {
        handlePrevSlide(e);
      } else if (e.key === " ") {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setIsPaused((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStoryIndex, activeSlideIndex, currents]);

  const handleCreateCurrent = () => {
    if (createMode === "text" && !textContent.trim()) return;
    if (createMode === "photo" && !photoUrl.trim()) return;

    const newSlide =
      createMode === "text"
        ? {
            id: `s-${Date.now()}`,
            type: "text",
            text: textContent.trim(),
            gradient: selectedGradient.bg,
            vibe: selectedVibe || "",
            createdAt: "Just now",
          }
        : {
            id: `s-${Date.now()}`,
            type: "photo",
            image: photoUrl.trim(),
            caption: photoCaption.trim(),
            vibe: selectedVibe || "",
            createdAt: "Just now",
          };

    // Check if current user already has a current card
    const myId = currentUser?.userId || currentUser?._id || "my-current";
    const existingIndex = currents.findIndex((b) => b.isSelf || b.userId === myId);

    let updated = [];
    if (existingIndex >= 0) {
      updated = [...currents];
      updated[existingIndex].stories.push(newSlide);
      updated[existingIndex].viewed = false;
    } else {
      const myCurrent = {
        id: `current-${Date.now()}`,
        userId: myId,
        userName: currentUser?.userName || "you",
        name: currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim() : "You",
        avatar: currentUser?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        isSelf: true,
        viewed: false,
        stories: [newSlide],
      };
      updated = [myCurrent, ...currents];
    }

    setCurrents(updated);
    localStorage.setItem("onboard_crew_currents", JSON.stringify(updated));

    // Reset & close
    setTextContent("");
    setSelectedVibe("");
    setPhotoUrl("");
    setPhotoCaption("");
    setIsCreateOpen(false);
    pulse.postCreated();
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result);
      setUploadLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const myCurrentData = currents.find((b) => b.isSelf);

  return (
    <>
      {/* Horizontal Currents Strip */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 mb-6 relative">
        <div className="flex items-center justify-between mb-2 px-1 relative z-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🌊</span>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Crew Currents</h3>
            <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200/80 px-2 py-0.5 rounded-full">
              24h Flow
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Tap to view • Flows away in 24h
          </span>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pt-2.5 pb-2 px-1 scrollbar-none select-none relative z-10">
          {/* Add / View My Current Card */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group relative z-10 hover:z-30 transition-all">
            <div className="relative z-10 group-hover:z-30">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] transition-all duration-200 group-hover:scale-105 group-hover:shadow-md ${
                  myCurrentData && myCurrentData.stories.length > 0
                    ? "bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500"
                    : "bg-slate-200"
                }`}
                onClick={() => {
                  if (myCurrentData && myCurrentData.stories.length > 0) {
                    const idx = currents.findIndex((b) => b.isSelf);
                    openStory(idx);
                  } else {
                    setIsCreateOpen(true);
                  }
                }}
              >
                <img
                  src={
                    currentUser?.profilePhoto ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                  }
                  alt="Your Current"
                  className="w-full h-full rounded-full object-cover border-2 border-white bg-slate-100"
                />
              </div>

              {/* Add + badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateOpen(true);
                }}
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm cursor-pointer transition-transform group-hover:scale-110 z-20"
                title="Post to Currents"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 max-w-[64px] truncate text-center">
              Your Current
            </span>
          </div>

          {/* Crew Members' Currents */}
          {currents
            .filter((b) => !b.isSelf)
            .map((b) => {
              const fullIndex = currents.findIndex((item) => item.id === b.id);
              return (
                <div
                  key={b.id}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group relative z-10 hover:z-30 transition-all"
                  onClick={() => openStory(fullIndex)}
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] transition-all duration-200 group-hover:scale-105 group-hover:shadow-md relative z-10 group-hover:z-30 ${
                      b.viewed
                        ? "bg-slate-300"
                        : "bg-gradient-to-tr from-cyan-400 via-indigo-600 to-rose-500 animate-gradient"
                    }`}
                  >
                    <img
                      src={b.avatar}
                      alt={b.name}
                      className="w-full h-full rounded-full object-cover border-2 border-white bg-slate-100"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 max-w-[68px] truncate text-center">
                    {b.userName || b.name}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Story / Current Fullscreen Viewer Modal & Preview Interface */}
      {activeStoryIndex !== null && currents[activeStoryIndex] && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-between p-2 sm:p-4 select-none animate-in fade-in duration-200"
          onClick={closeViewer}
        >
          {/* Top Global Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between px-3 py-2 text-white shrink-0 z-40">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌊</span>
              <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Crew Currents
              </span>
              <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full hidden sm:inline">
                24h Ephemeral
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-white/50 hidden md:inline">
                Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[11px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[11px]">→</kbd> keys • <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[11px]">Space</kbd> to pause
              </span>
              <button
                type="button"
                onClick={closeViewer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-semibold cursor-pointer border border-white/10"
                title="Close (Esc)"
              >
                <span>Close</span>
                <kbd className="text-[10px] opacity-60 font-mono">Esc</kbd>
                <i className="fa-solid fa-xmark text-sm ml-0.5"></i>
              </button>
            </div>
          </div>

          {/* Main Stage: Carousel with Left Preview, Center Active Card, Right Preview */}
          <div
            className="flex-1 w-full max-w-5xl flex items-center justify-center gap-4 sm:gap-6 min-h-0 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Desktop Left Preview Card (Previous User's Current) */}
            {activeStoryIndex > 0 && currents[activeStoryIndex - 1] ? (
              <div
                className="hidden lg:flex flex-col items-center justify-center w-52 h-[420px] rounded-3xl overflow-hidden bg-slate-900/80 border border-white/10 shadow-xl cursor-pointer group hover:scale-102 hover:border-white/30 transition-all duration-300 relative shrink-0"
                onClick={() => {
                  pulse.tap();
                  setActiveStoryIndex((prev) => prev - 1);
                  setActiveSlideIndex(0);
                }}
                title={`View ${currents[activeStoryIndex - 1].name}'s Current`}
              >
                {/* Background teaser blur */}
                {currents[activeStoryIndex - 1].stories?.[0]?.type === "photo" ? (
                  <img
                    src={currents[activeStoryIndex - 1].stories[0].image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover filter blur-xs opacity-40 group-hover:opacity-60 transition-opacity"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      currents[activeStoryIndex - 1].stories?.[0]?.gradient || "from-cyan-500 to-blue-600"
                    } opacity-40 group-hover:opacity-60 transition-opacity`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 shadow-lg">
                    <img
                      src={currents[activeStoryIndex - 1].avatar}
                      alt=""
                      className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                    />
                  </div>
                  <span className="text-xs font-bold text-white block truncate max-w-[150px]">
                    {currents[activeStoryIndex - 1].name}
                  </span>
                  <span className="text-[10px] text-white/60 block">
                    @{currents[activeStoryIndex - 1].userName}
                  </span>
                  <span className="mt-2 text-[10px] font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-1 rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-colors flex items-center gap-1">
                    <i className="fa-solid fa-arrow-left text-[9px]"></i> Previous
                  </span>
                </div>
              </div>
            ) : (
              <div className="hidden lg:block w-52 shrink-0 opacity-0 pointer-events-none" />
            )}

            {/* Left Nav Arrow Button */}
            {activeStoryIndex > 0 || activeSlideIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevSlide}
                className="hidden sm:flex w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md border border-white/20 items-center justify-center shadow-xl transition-all cursor-pointer z-30 shrink-0"
                title="Previous Slide (←)"
                aria-label="Previous Slide"
              >
                <i className="fa-solid fa-chevron-left text-base"></i>
              </button>
            ) : (
              <div className="hidden sm:block w-11 shrink-0" />
            )}

            {/* Center: Active Current Card */}
            <div
              className="relative w-full max-w-[400px] h-full sm:h-[82vh] sm:max-h-[720px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between shrink-0"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {/* Floating Reaction Particles Layer */}
              <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
                {floatingReactions.map((r) => (
                  <div
                    key={r.id}
                    className="absolute bottom-20 text-3xl animate-reaction-burst drop-shadow-lg"
                    style={{ left: `${r.leftOffset}%` }}
                  >
                    {r.emoji}
                  </div>
                ))}
              </div>

              {/* Toast when reply sent */}
              {replyToast && (
                <div className="absolute top-16 left-4 right-4 z-40 bg-emerald-500/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-xs font-bold text-center shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  {replyToast}
                </div>
              )}

              {/* Copied Link Toast */}
              {copiedLink && (
                <div className="absolute top-16 left-4 right-4 z-40 bg-indigo-600/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-xs font-bold text-center shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  Link copied to clipboard!
                </div>
              )}

              {/* Top Progress Bars */}
              <div className="absolute top-0 left-0 right-0 z-30 p-3 pt-3.5 flex gap-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                {(currents[activeStoryIndex]?.stories || []).map((_, i) => (
                  <div key={i} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-white transition-all ${
                        i < activeSlideIndex
                          ? "w-full"
                          : i === activeSlideIndex
                          ? "w-full animate-story-progress"
                          : "w-0"
                      }`}
                      style={{
                        animationDuration: "5000ms",
                        animationPlayState: isPaused ? "paused" : "running",
                      }}
                    ></div>
                  </div>
                ))}
              </div>

              {/* Creator Header */}
              <div className="absolute top-5 left-0 right-0 z-30 px-3.5 pt-2 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 shrink-0">
                    <img
                      src={currents[activeStoryIndex].avatar}
                      alt={currents[activeStoryIndex].name}
                      className="w-full h-full rounded-full object-cover border border-slate-900"
                    />
                  </div>
                  <div className="min-w-0 drop-shadow-md">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold truncate block">
                        {currents[activeStoryIndex].name}
                      </span>
                      <span className="text-[10px] text-white/60 font-mono bg-white/10 px-1.5 py-0.2 rounded">
                        {activeSlideIndex + 1}/{currents[activeStoryIndex].stories?.length || 1}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/70 block truncate">
                      @{currents[activeStoryIndex].userName} •{" "}
                      {currents[activeStoryIndex].stories?.[activeSlideIndex]?.createdAt || "Just now"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Pause / Play button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPaused((prev) => !prev);
                    }}
                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white/90 flex items-center justify-center transition-colors cursor-pointer text-xs"
                    title={isPaused ? "Play" : "Pause"}
                  >
                    <i className={`fa-solid ${isPaused ? "fa-play" : "fa-pause"}`}></i>
                  </button>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink();
                    }}
                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white/90 flex items-center justify-center transition-colors cursor-pointer text-xs"
                    title="Share Current"
                  >
                    <i className="fa-solid fa-share-nodes"></i>
                  </button>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeViewer();
                    }}
                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
                    title="Close"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>

              {/* Story Content Canvas */}
              <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                {/* Visual Tap Navigation Zones */}
                <div
                  className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                  onClick={handlePrevSlide}
                  title="Previous slide"
                ></div>
                <div
                  className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer"
                  onClick={handleNextSlide}
                  title="Next slide"
                ></div>

                {/* Paused Badge Indicator */}
                {isPaused && (
                  <div className="absolute top-20 z-30 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-lg animate-in fade-in duration-150">
                    <i className="fa-solid fa-pause text-[10px] text-amber-400"></i>
                    <span>Paused • Release to continue</span>
                  </div>
                )}

                {/* Render Slide */}
                {(() => {
                  const currentSlide = currents[activeStoryIndex]?.stories?.[activeSlideIndex];
                  if (!currentSlide) return null;

                  if (currentSlide.type === "photo") {
                    return (
                      <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <img
                          src={currentSlide.image}
                          alt="Current Slide"
                          className="w-full h-full object-contain select-none"
                        />
                        {/* Caption & Vibe Scrim */}
                        <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pt-8 pb-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white">
                          {currentSlide.vibe && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold mb-2 border border-white/30 shadow-xs">
                              {currentSlide.vibe}
                            </span>
                          )}
                          {currentSlide.caption && (
                            <p className="text-sm font-semibold leading-snug drop-shadow-md text-white/95">
                              {currentSlide.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Text Slide with Rich Flow Gradient
                  return (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${
                        currentSlide.gradient || "from-cyan-500 via-blue-600 to-indigo-700"
                      } flex flex-col items-center justify-center p-8 text-center relative overflow-hidden`}
                    >
                      {/* Decorative ambient background blur circle */}
                      <div className="absolute w-64 h-64 rounded-full bg-white/10 filter blur-3xl pointer-events-none -top-10 -left-10"></div>
                      <div className="absolute w-64 h-64 rounded-full bg-black/10 filter blur-3xl pointer-events-none -bottom-10 -right-10"></div>

                      {currentSlide.vibe && (
                        <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black mb-5 border border-white/30 shadow-md">
                          {currentSlide.vibe}
                        </span>
                      )}

                      <div className="relative z-10">
                        <span className="text-4xl text-white/40 font-serif leading-none block mb-1">“</span>
                        <p className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed drop-shadow-lg max-w-xs">
                          {currentSlide.text}
                        </p>
                        <span className="text-4xl text-white/40 font-serif leading-none block mt-1">”</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bottom Interactive Deck: Reply & Reaction Bar */}
              <div className="relative z-30 p-3 pt-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2.5">
                {/* Quick Emoji Reactions */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold text-white/60">Quick Reaction:</span>
                  <div className="flex items-center gap-2">
                    {QUICK_EMOJIS.slice(0, 6).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerReaction(emoji);
                        }}
                        className="text-lg hover:scale-130 active:scale-95 transition-transform cursor-pointer"
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reply Input Box + Like Button */}
                <div className="flex items-center gap-2">
                  <form
                    onSubmit={handleSendReply}
                    className="flex-1 flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white/20 border border-white/20 focus-within:border-cyan-400/80 rounded-full px-3.5 py-1.5 transition-all"
                  >
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder={`Reply to @${currents[activeStoryIndex]?.userName || "crew"}...`}
                      className="flex-1 bg-transparent text-white placeholder-white/50 text-xs font-medium outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!replyMessage.trim()}
                      className={`text-xs ml-1.5 transition-all ${
                        replyMessage.trim()
                          ? "text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                          : "text-white/30 cursor-not-allowed"
                      }`}
                      title="Send reply"
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                    </button>
                  </form>

                  {/* Like Current button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentStoryId = currents[activeStoryIndex]?.stories?.[activeSlideIndex]?.id || "s";
                      toggleLikeCurrent(currentStoryId);
                    }}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm transition-all cursor-pointer ${
                      likedCurrents[currents[activeStoryIndex]?.stories?.[activeSlideIndex]?.id]
                        ? "bg-rose-500/20 border-rose-500/60 text-rose-500 scale-105"
                        : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                    }`}
                    title="Like this current"
                  >
                    <i
                      className={`fa-heart ${
                        likedCurrents[currents[activeStoryIndex]?.stories?.[activeSlideIndex]?.id]
                          ? "fa-solid"
                          : "fa-regular"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Nav Arrow Button */}
            {activeStoryIndex < currents.length - 1 ||
            activeSlideIndex < (currents[activeStoryIndex]?.stories?.length || 1) - 1 ? (
              <button
                type="button"
                onClick={handleNextSlide}
                className="hidden sm:flex w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md border border-white/20 items-center justify-center shadow-xl transition-all cursor-pointer z-30 shrink-0"
                title="Next Slide (→)"
                aria-label="Next Slide"
              >
                <i className="fa-solid fa-chevron-right text-base"></i>
              </button>
            ) : (
              <div className="hidden sm:block w-11 shrink-0" />
            )}

            {/* Desktop Right Preview Card (Next User's Current) */}
            {activeStoryIndex < currents.length - 1 && currents[activeStoryIndex + 1] ? (
              <div
                className="hidden lg:flex flex-col items-center justify-center w-52 h-[420px] rounded-3xl overflow-hidden bg-slate-900/80 border border-white/10 shadow-xl cursor-pointer group hover:scale-102 hover:border-white/30 transition-all duration-300 relative shrink-0"
                onClick={() => {
                  pulse.tap();
                  setActiveStoryIndex((prev) => prev + 1);
                  setActiveSlideIndex(0);
                }}
                title={`View ${currents[activeStoryIndex + 1].name}'s Current`}
              >
                {/* Background teaser blur */}
                {currents[activeStoryIndex + 1].stories?.[0]?.type === "photo" ? (
                  <img
                    src={currents[activeStoryIndex + 1].stories[0].image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover filter blur-xs opacity-40 group-hover:opacity-60 transition-opacity"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      currents[activeStoryIndex + 1].stories?.[0]?.gradient || "from-indigo-600 to-pink-500"
                    } opacity-40 group-hover:opacity-60 transition-opacity`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 shadow-lg">
                    <img
                      src={currents[activeStoryIndex + 1].avatar}
                      alt=""
                      className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                    />
                  </div>
                  <span className="text-xs font-bold text-white block truncate max-w-[150px]">
                    {currents[activeStoryIndex + 1].name}
                  </span>
                  <span className="text-[10px] text-white/60 block">
                    @{currents[activeStoryIndex + 1].userName}
                  </span>
                  <span className="mt-2 text-[10px] font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-1 rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-colors flex items-center gap-1">
                    Next <i className="fa-solid fa-arrow-right text-[9px]"></i>
                  </span>
                </div>
              </div>
            ) : (
              <div className="hidden lg:block w-52 shrink-0 opacity-0 pointer-events-none" />
            )}
          </div>

          {/* Bottom helper text */}
          <div className="text-[11px] text-white/40 pb-1 shrink-0 hidden sm:block">
            Tap sides of card to navigate • Press and hold to pause flow
          </div>
        </div>
      )}

      {/* Create Current Modal Studio */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl shadow-slate-950/60 border border-slate-100/90 overflow-hidden relative flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md shadow-indigo-600/20">
                  <span>🌊</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Create Crew Current</h3>
                  <p className="text-xs text-slate-500 font-medium">Visible to your crew for 24 hours • Ephemeral Story</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Studio Body: Live Preview Canvas + Controls */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col md:flex-row gap-6 items-stretch">
              {/* Left Column: Live Canvas Preview */}
              <div className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col items-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 self-start flex items-center gap-1.5">
                  <i className="fa-solid fa-eye text-indigo-500"></i> Live Story Preview
                </div>
                
                {/* The Story Canvas */}
                <div
                  className={`w-full h-80 md:h-[400px] rounded-[26px] relative overflow-hidden shadow-xl flex flex-col justify-between p-4 transition-all duration-300 border border-slate-200/60 ${
                    createMode === "text"
                      ? `bg-gradient-to-br ${selectedGradient.bg}`
                      : "bg-slate-950"
                  }`}
                >
                  {/* Top Bar inside Canvas */}
                  <div className="relative z-10">
                    <div className="w-full h-1 bg-white/30 rounded-full mb-3 overflow-hidden">
                      <div className="w-full h-full bg-white rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            currentUser?.profilePhoto ||
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                          }
                          alt="You"
                          className="w-7 h-7 rounded-full object-cover border border-white/60 shadow-sm"
                        />
                        <div className="leading-tight text-white drop-shadow-md">
                          <span className="text-xs font-bold block">{currentUser?.userName || "You"}</span>
                          <span className="text-[9px] text-white/80 block">Just now</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-white/80 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                        24h
                      </span>
                    </div>

                    {/* Vibe Tag Chip */}
                    {selectedVibe && (
                      <div className="mt-2.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/30 shadow-xs">
                          {selectedVibe}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Center Content */}
                  {createMode === "text" ? (
                    <div className="relative z-10 flex-1 flex items-center justify-center p-3 text-center">
                      <p className="text-base sm:text-lg font-black text-white leading-relaxed drop-shadow-md break-words max-h-48 overflow-y-auto scrollbar-none">
                        {textContent.trim() ? (
                          `"${textContent.trim()}"`
                        ) : (
                          <span className="text-white/60 italic font-medium text-sm">
                            What's flowing in your world today? 🌊✨
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 z-0">
                      {photoUrl ? (
                        <>
                          <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          {photoCaption && (
                            <div className="absolute bottom-10 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-center">
                              <p className="text-xs font-semibold drop-shadow-md">{photoCaption}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                          <i className="fa-regular fa-image text-3xl mb-2 opacity-50"></i>
                          <p className="text-xs font-medium">Select a photo from the controls</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Canvas Watermark */}
                  <div className="relative z-10 flex items-center justify-between text-[9px] font-semibold text-white/70">
                    <span className="flex items-center gap-1 drop-shadow-xs">
                      <i className="fa-solid fa-water text-[8px]"></i> Crew Currents
                    </span>
                    <span className="opacity-80">OnBoard</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Creative Studio Controls */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Mode Selector Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => setCreateMode("text")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      createMode === "text"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <i className="fa-solid fa-pen-nib text-xs"></i>
                    <span>Text Flow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode("photo")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      createMode === "photo"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <i className="fa-solid fa-camera-retro text-xs"></i>
                    <span>Photo Story</span>
                  </button>
                </div>

                {/* Text Flow Controls */}
                {createMode === "text" && (
                  <div className="space-y-4">
                    {/* Textarea Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">Write your Current</label>
                        <span className={`text-[10px] font-bold ${textContent.length >= 150 ? "text-amber-500" : "text-slate-400"}`}>
                          {textContent.length}/160
                        </span>
                      </div>
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Share a quick thought, update, or moment with your crew..."
                        maxLength={160}
                        rows={3}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all resize-none shadow-inner"
                      />
                    </div>

                    {/* Quick Emojis Bar */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Quick Vibes</span>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              if (textContent.length < 158) {
                                setTextContent((prev) => (prev ? `${prev} ${emoji}` : emoji));
                              }
                            }}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aura Gradient Swatches */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Aura / Water Theme</span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {GRADIENT_PRESETS.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setSelectedGradient(g)}
                            className={`h-10 rounded-2xl bg-gradient-to-br ${g.bg} p-1 transition-all cursor-pointer relative flex items-center justify-center shadow-xs ${
                              selectedGradient.id === g.id
                                ? "ring-2 ring-indigo-600 ring-offset-2 scale-105 shadow-md"
                                : "opacity-80 hover:opacity-100"
                            }`}
                            title={g.label}
                          >
                            {selectedGradient.id === g.id && (
                              <i className="fa-solid fa-check text-white text-xs drop-shadow-sm"></i>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vibe / Mood Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-500">Vibe Tag (Optional)</span>
                        {selectedVibe && (
                          <button
                            type="button"
                            onClick={() => setSelectedVibe("")}
                            className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {VIBE_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSelectedVibe((prev) => (prev === tag ? "" : tag))}
                            className={`text-xs px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer border ${
                              selectedVibe === tag
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Story Controls */}
                {createMode === "photo" && (
                  <div className="space-y-4">
                    {photoUrl ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                          <div className="flex items-center gap-3 truncate">
                            <img src={photoUrl} alt="Thumbnail" className="w-12 h-12 rounded-xl object-cover" />
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Photo Selected</span>
                              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                <i className="fa-solid fa-circle-check text-[9px]"></i> Ready to broadcast
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPhotoUrl("")}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Photo Caption (Optional)</label>
                          <input
                            type="text"
                            value={photoCaption}
                            onChange={(e) => setPhotoCaption(e.target.value)}
                            placeholder="Add a short caption to your current..."
                            maxLength={100}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <label className="w-full h-52 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 bg-slate-50/70 flex flex-col items-center justify-center cursor-pointer transition-all p-6 group">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
                          <i className="fa-solid fa-cloud-arrow-up"></i>
                        </div>
                        <span className="text-xs font-bold text-slate-800 mb-0.5">Click or drag a photo here</span>
                        <span className="text-[11px] text-slate-400 mb-3">PNG, JPG, WEBP up to 10MB</span>
                        <span className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all">
                          Choose Image
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                    )}

                    {/* Vibe / Mood Selector in photo mode */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Vibe Tag (Optional)</span>
                      <div className="flex flex-wrap gap-1.5">
                        {VIBE_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSelectedVibe((prev) => (prev === tag ? "" : tag))}
                            className={`text-xs px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer border ${
                              selectedVibe === tag
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <i className="fa-solid fa-users text-indigo-500"></i>
                <span className="hidden sm:inline">Visible to your crew for 24h</span>
                <span className="sm:hidden">Crew 24h</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    (createMode === "text" && !textContent.trim()) ||
                    (createMode === "photo" && !photoUrl.trim()) ||
                    uploadLoading
                  }
                  onClick={handleCreateCurrent}
                  className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <i className="fa-solid fa-paper-plane text-[11px]"></i>
                  <span>Broadcast to Currents</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
