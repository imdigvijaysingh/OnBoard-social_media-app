import React, { useState, useEffect, useRef } from "react";
import pulse from "../utils/pulseEngine";

// Curated aesthetic gradients for text beacons
const GRADIENT_PRESETS = [
  { id: "cosmic", label: "Cosmic", bg: "from-indigo-600 via-purple-600 to-pink-500" },
  { id: "ocean", label: "Ocean", bg: "from-cyan-500 via-blue-600 to-indigo-700" },
  { id: "sunset", label: "Sunset", bg: "from-amber-500 via-rose-500 to-purple-600" },
  { id: "emerald", label: "Aurora", bg: "from-emerald-500 via-teal-600 to-cyan-700" },
  { id: "midnight", label: "Midnight", bg: "from-slate-900 via-indigo-950 to-purple-950" },
];

export default function CrewBeacons({ currentUser, crewSuggestions = [] }) {
  const [beacons, setBeacons] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null); // Which user's story
  const [activeSlideIndex, setActiveSlideIndex] = useState(0); // Which slide inside that story
  const [isPaused, setIsPaused] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Creation State
  const [createMode, setCreateMode] = useState("text"); // "text" | "photo"
  const [textContent, setTextContent] = useState("");
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // Initialize sample / stored beacons
  useEffect(() => {
    const saved = localStorage.getItem("onboard_crew_beacons");
    if (saved) {
      try {
        setBeacons(JSON.parse(saved));
        return;
      } catch (e) {
        console.error("Failed to parse beacons", e);
      }
    }

    // Default lively crew beacons
    const initialBeacons = [
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
            text: "Exploring the new OnBoard build today! 🚀 The vibe feels so clean.",
            gradient: "from-indigo-600 via-purple-600 to-pink-500",
            createdAt: "2h ago",
          },
          {
            id: "s1-2",
            type: "photo",
            image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
            caption: "Late night code sessions with good coffee ☕✨",
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
            text: "Designing chapters & interactive moments for our upcoming travel logs 🗺️",
            gradient: "from-cyan-500 via-blue-600 to-indigo-700",
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
            caption: "Catching the ocean horizon before sunset 🌅🌊",
            createdAt: "5h ago",
          },
        ],
      },
    ];

    setBeacons(initialBeacons);
    localStorage.setItem("onboard_crew_beacons", JSON.stringify(initialBeacons));
  }, []);

  // Timer for auto-advancing slides in viewer
  useEffect(() => {
    if (activeStoryIndex === null || isPaused) return;

    const currentStoryUser = beacons[activeStoryIndex];
    if (!currentStoryUser) return;

    const timer = setTimeout(() => {
      if (activeSlideIndex < currentStoryUser.stories.length - 1) {
        setActiveSlideIndex((prev) => prev + 1);
      } else {
        // Next user or close
        if (activeStoryIndex < beacons.length - 1) {
          setActiveStoryIndex((prev) => prev + 1);
          setActiveSlideIndex(0);
        } else {
          closeViewer();
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeStoryIndex, activeSlideIndex, isPaused, beacons]);

  const openStory = (userIndex) => {
    pulse.pop();
    setActiveStoryIndex(userIndex);
    setActiveSlideIndex(0);

    // Mark as viewed
    setBeacons((prev) => {
      const next = [...prev];
      next[userIndex] = { ...next[userIndex], viewed: true };
      localStorage.setItem("onboard_crew_beacons", JSON.stringify(next));
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
    const currentStoryUser = beacons[activeStoryIndex];
    if (activeSlideIndex < currentStoryUser.stories.length - 1) {
      setActiveSlideIndex((prev) => prev + 1);
    } else if (activeStoryIndex < beacons.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setActiveSlideIndex(0);
    } else {
      closeViewer();
    }
  };

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    pulse.tap();
    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
    } else if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      const prevUserStories = beacons[activeStoryIndex - 1].stories;
      setActiveSlideIndex(prevUserStories.length - 1);
    }
  };

  const handleCreateBeacon = () => {
    if (createMode === "text" && !textContent.trim()) return;
    if (createMode === "photo" && !photoUrl.trim()) return;

    const newSlide =
      createMode === "text"
        ? {
            id: `s-${Date.now()}`,
            type: "text",
            text: textContent.trim(),
            gradient: selectedGradient.bg,
            createdAt: "Just now",
          }
        : {
            id: `s-${Date.now()}`,
            type: "photo",
            image: photoUrl.trim(),
            caption: photoCaption.trim(),
            createdAt: "Just now",
          };

    // Check if current user already has a beacon card
    const myId = currentUser?.userId || currentUser?._id || "my-beacon";
    const existingIndex = beacons.findIndex((b) => b.isSelf || b.userId === myId);

    let updated = [];
    if (existingIndex >= 0) {
      updated = [...beacons];
      updated[existingIndex].stories.push(newSlide);
      updated[existingIndex].viewed = false;
    } else {
      const myBeacon = {
        id: `beacon-${Date.now()}`,
        userId: myId,
        userName: currentUser?.userName || "you",
        name: currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim() : "You",
        avatar: currentUser?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        isSelf: true,
        viewed: false,
        stories: [newSlide],
      };
      updated = [myBeacon, ...beacons];
    }

    setBeacons(updated);
    localStorage.setItem("onboard_crew_beacons", JSON.stringify(updated));

    // Reset & close
    setTextContent("");
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

  const myBeaconData = beacons.find((b) => b.isSelf);

  return (
    <>
      {/* Horizontal Beacons Strip */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-base">🏮</span>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Crew Beacons</h3>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              24h Pulse
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Tap to view • Disappears in 24h
          </span>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-1.5 scrollbar-none select-none">
          {/* Add / View My Beacon Button */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
            <div className="relative">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] transition-transform duration-200 group-hover:scale-105 ${
                  myBeaconData && myBeaconData.stories.length > 0
                    ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600"
                    : "bg-slate-200"
                }`}
                onClick={() => {
                  if (myBeaconData && myBeaconData.stories.length > 0) {
                    const idx = beacons.findIndex((b) => b.isSelf);
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
                  alt="Your Beacon"
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
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm cursor-pointer transition-transform group-hover:scale-110"
                title="Light a Beacon"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 max-w-[64px] truncate text-center">
              Your Beacon
            </span>
          </div>

          {/* Crew Members' Beacons */}
          {beacons
            .filter((b) => !b.isSelf)
            .map((b) => {
              const fullIndex = beacons.findIndex((item) => item.id === b.id);
              return (
                <div
                  key={b.id}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                  onClick={() => openStory(fullIndex)}
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] transition-transform duration-200 group-hover:scale-105 ${
                      b.viewed
                        ? "bg-slate-300"
                        : "bg-gradient-to-tr from-pink-500 via-indigo-600 to-cyan-500 animate-gradient"
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

      {/* Story / Beacon Fullscreen Viewer Modal */}
      {activeStoryIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none"
          onClick={closeViewer}
        >
          {/* Story Container */}
          <div
            className="relative w-full max-w-md h-full sm:h-[85vh] sm:max-h-[760px] bg-slate-950 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Top Progress Bars */}
            <div className="absolute top-0 left-0 right-0 z-30 p-3 pt-4 sm:pt-3 flex gap-1.5">
              {beacons[activeStoryIndex].stories.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all duration-linear ${
                      i < activeSlideIndex
                        ? "w-full"
                        : i === activeSlideIndex
                        ? "w-full animate-progress"
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

            {/* Author Info & Close Button */}
            <div className="absolute top-6 left-0 right-0 z-30 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={beacons[activeStoryIndex].avatar}
                  alt={beacons[activeStoryIndex].name}
                  className="w-9 h-9 rounded-full object-cover border border-white/60 shadow-md"
                />
                <div className="text-white drop-shadow-md">
                  <span className="text-xs font-bold block leading-tight">
                    {beacons[activeStoryIndex].name}
                  </span>
                  <span className="text-[10px] text-white/70 block">
                    @{beacons[activeStoryIndex].userName} •{" "}
                    {beacons[activeStoryIndex].stories[activeSlideIndex]?.createdAt || "Just now"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer text-xs"
                >
                  <i className={`fa-solid ${isPaused ? "fa-play" : "fa-pause"}`}></i>
                </button>
                <button
                  type="button"
                  onClick={closeViewer}
                  className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer text-sm"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            {/* Slide Content */}
            <div className="relative flex-1 flex items-center justify-center">
              {/* Tap Left / Right Zones */}
              <div
                className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                onClick={handlePrevSlide}
              ></div>
              <div
                className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer"
                onClick={handleNextSlide}
              ></div>

              {/* Render Slide */}
              {(() => {
                const currentSlide = beacons[activeStoryIndex].stories[activeSlideIndex];
                if (!currentSlide) return null;

                if (currentSlide.type === "photo") {
                  return (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <img
                        src={currentSlide.image}
                        alt="Beacon Slide"
                        className="w-full h-full object-contain"
                      />
                      {currentSlide.caption && (
                        <div className="absolute bottom-16 left-0 right-0 z-20 px-6 py-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-center">
                          <p className="text-sm font-medium drop-shadow-md">
                            {currentSlide.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }

                // Text Slide with Vibrant Gradient
                return (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${
                      currentSlide.gradient || "from-indigo-600 to-purple-800"
                    } flex items-center justify-center p-8 text-center`}
                  >
                    <p className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed drop-shadow-lg max-w-sm">
                      "{currentSlide.text}"
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Bottom Quick Reaction Bar */}
            <div className="relative z-30 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center gap-2 px-4">
              <div className="flex-1 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-white/60 text-xs flex items-center justify-between">
                <span>React to Beacon...</span>
                <div className="flex items-center gap-2 text-base">
                  {["🔥", "❤️", "⚡", "🏮", "👏"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        pulse.pop();
                        // Small bounce effect
                        const el = e.currentTarget;
                        el.classList.add("scale-125");
                        setTimeout(() => el.classList.remove("scale-125"), 200);
                      }}
                      className="hover:scale-125 active:scale-150 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Beacon Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏮</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Light a Beacon</h3>
                  <p className="text-[11px] text-slate-500">Visible to your crew for 24 hours</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Type Switcher: Text vs Photo */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => setCreateMode("text")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  createMode === "text"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <i className="fa-solid fa-font text-[11px]"></i>
                <span>Text Vibe</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateMode("photo")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  createMode === "photo"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <i className="fa-solid fa-image text-[11px]"></i>
                <span>Photo</span>
              </button>
            </div>

            {/* Mode: Text Vibe */}
            {createMode === "text" && (
              <div className="space-y-4">
                {/* Preview Box */}
                <div
                  className={`w-full h-44 rounded-2xl bg-gradient-to-br ${selectedGradient.bg} p-6 flex items-center justify-center text-center shadow-inner relative overflow-hidden`}
                >
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="What's happening in your voyage today? ✨"
                    maxLength={160}
                    className="w-full bg-transparent text-white font-extrabold text-base placeholder:text-white/60 text-center resize-none outline-none drop-shadow-md"
                    rows={3}
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-white/70 font-semibold">
                    {textContent.length}/160
                  </span>
                </div>

                {/* Gradient Picker */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-2">
                    Pick a Gradient Aura
                  </span>
                  <div className="flex gap-2">
                    {GRADIENT_PRESETS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGradient(g)}
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${g.bg} transition-all cursor-pointer ${
                          selectedGradient.id === g.id
                            ? "ring-2 ring-indigo-600 ring-offset-2 scale-110 shadow-sm"
                            : "opacity-70 hover:opacity-100"
                        }`}
                        title={g.label}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode: Photo */}
            {createMode === "photo" && (
              <div className="space-y-3">
                {photoUrl ? (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors p-4">
                    <i className="fa-solid fa-cloud-arrow-up text-2xl text-indigo-500 mb-2"></i>
                    <span className="text-xs font-bold text-slate-700">Choose a Photo</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                {photoUrl && (
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Add a caption to your beacon..."
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>
            )}

            {/* Post Action */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
                onClick={handleCreateBeacon}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-paper-plane text-[10px]"></i>
                <span>Broadcast Beacon</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
