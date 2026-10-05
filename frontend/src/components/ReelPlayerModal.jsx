import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// Allegation categories for reporting
const PRESET_ALLEGATIONS = [
  { id: "spam", label: "🚫 Spam, scam, or misleading content", reason: "spam" },
  { id: "inappropriate_media", label: "🔞 Inappropriate, nudity, or adult media", reason: "inappropriate_media" },
  { id: "harassment", label: "🛑 Harassment, bullying, or hate speech", reason: "harassment" },
  { id: "violence", label: "⚠️ Violence or dangerous content", reason: "other" },
  { id: "fake_news", label: "📢 Misinformation or fake news", reason: "other" },
  { id: "copyright", label: "©️ Copyright or intellectual property violation", reason: "other" },
];

const QUALITY_CONFIGS = {
  "144p": {
    label: "144p (Data Saver)",
    subtext: "Data saver • Low Res",
    badgeText: "144p Low Res",
    filter: "blur(3px) contrast(86%) brightness(96%) saturate(82%)",
    scale: 1.05,
    gridSize: "5px",
    gridOpacity: 0.4,
    scanlines: true,
  },
  "360p": {
    label: "360p (Medium)",
    subtext: "Low data • 360p",
    badgeText: "360p SD",
    filter: "blur(1.4px) contrast(94%) brightness(98%) saturate(92%)",
    scale: 1.03,
    gridSize: "3px",
    gridOpacity: 0.22,
    scanlines: false,
  },
  "480p": {
    label: "480p (Standard)",
    subtext: "Standard • 480p",
    badgeText: "480p",
    filter: "blur(0.55px) contrast(99%)",
    scale: 1.02,
    gridSize: null,
    gridOpacity: 0,
    scanlines: false,
  },
  "720p": {
    label: "720p (HD)",
    subtext: "High Definition",
    badgeText: "720p HD",
    filter: "contrast(102%)",
    scale: 1,
    gridSize: null,
    gridOpacity: 0,
    scanlines: false,
  },
  "1080p HD": {
    label: "1080p HD (Best)",
    subtext: "Full High Definition",
    badgeText: "1080p HD",
    filter: "none",
    scale: 1,
    gridSize: null,
    gridOpacity: 0,
    scanlines: false,
  },
  "Auto": {
    label: "Auto (1080p)",
    subtext: "Adjusts to network",
    badgeText: "Auto",
    filter: "none",
    scale: 1,
    gridSize: null,
    gridOpacity: 0,
    scanlines: false,
  },
};

const QUALITY_OPTIONS = ["Auto", "1080p HD", "720p", "480p", "360p", "144p"];

// Fisher-Yates array shuffle helper
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Generate shuffled batch preventing consecutive duplicate across cycle boundary
const generateShuffledBatch = (items, lastItemId) => {
  if (!items || items.length === 0) return [];
  if (items.length === 1) return [...items];

  const shuffled = shuffleArray(items);
  const getReelId = (item) => (item?._id ? item._id.toString() : item?.id ? item.id.toString() : "");

  if (lastItemId && items.length > 1 && getReelId(shuffled[0]) === lastItemId.toString()) {
    const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]];
  }
  return shuffled;
};

const ReelPlayerModal = ({
  isOpen,
  reels = [],
  initialIndex = 0,
  onClose,
  onLike,
  onBookmark,
  currentUserId,
  onRecordView,
}) => {
  // Infinite Looping Playlist Queue State
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showPlayStateIcon, setShowPlayStateIcon] = useState(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [localComments, setLocalComments] = useState({});
  const [localLikes, setLocalLikes] = useState({});
  const [localBookmarks, setLocalBookmarks] = useState({});
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // New Requested Features
  const [isCleanView, setIsCleanView] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [videoQuality, setVideoQuality] = useState("1080p HD");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedAllegation, setSelectedAllegation] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showAudioTooltip, setShowAudioTooltip] = useState(false);
  const [playerToast, setPlayerToast] = useState(null);

  // Swipe & Gestures State
  const [slideTransition, setSlideTransition] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  const videoRef = useRef(null);
  const lastTapRef = useRef(0);

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const isTouchingRef = useRef(false);
  const hasMovedSignificantlyRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const mouseStartRef = useRef({ x: 0, y: 0, time: 0 });
  const wheelCooldownRef = useRef(false);

  const currentIndexRef = useRef(currentIndex);
  const playlistRef = useRef(playlist);
  const reelsRef = useRef(reels);
  const wasOpenRef = useRef(false);
  const lastInitialIndexRef = useRef(null);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    reelsRef.current = reels;
  }, [reels]);

  // Current active reel from the dynamic playlist
  const currentReel = playlist[currentIndex] || reels[currentIndex] || reels[0] || null;

  // Active quality configuration (drives live visual resolution & pixelation)
  const activeQualityConfig = QUALITY_CONFIGS[videoQuality] || QUALITY_CONFIGS["Auto"];

  const showToast = (text) => {
    setPlayerToast(text);
    setTimeout(() => setPlayerToast(null), 3000);
  };

  // Initialize randomized infinite queue when modal opens
  useEffect(() => {
    if (isOpen && reels && reels.length > 0) {
      if (!wasOpenRef.current || lastInitialIndexRef.current !== initialIndex) {
        wasOpenRef.current = true;
        lastInitialIndexRef.current = initialIndex;

        const safeIndex = initialIndex >= 0 && initialIndex < reels.length ? initialIndex : 0;
        const initialItem = reels[safeIndex] || reels[0];
        const otherItems = reels.filter((_, idx) => idx !== safeIndex);
        const firstBatch = initialItem ? [initialItem, ...shuffleArray(otherItems)] : [];

        const getReelId = (item) => (item?._id ? item._id.toString() : item?.id ? item.id.toString() : "");
        const lastId = firstBatch.length > 0 ? getReelId(firstBatch[firstBatch.length - 1]) : null;
        const secondBatch = generateShuffledBatch(reels, lastId);

        setPlaylist([...firstBatch, ...secondBatch]);
        setCurrentIndex(0);
        setIsPlaying(true);
        setProgress(0);
        setCaptionExpanded(false);
        setIsCommentsOpen(false);
        setSlideTransition(null);
        setDragOffset(0);
        setShowMoreMenu(false);
        setShowQualityMenu(false);
        setIsReportOpen(false);
        setIsCleanView(false);
      }
    } else if (!isOpen) {
      wasOpenRef.current = false;
      lastInitialIndexRef.current = null;
    }
  }, [isOpen, initialIndex, reels]);

  useEffect(() => {
    if (isOpen) {
      setShowSwipeHint(true);
      const timer = setTimeout(() => setShowSwipeHint(false), 4500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentIndex]);

  useEffect(() => {
    if (isOpen && currentReel?._id && onRecordView) {
      onRecordView(currentReel._id);
    }
  }, [isOpen, currentIndex, currentReel?._id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (!videoRef.current.muted) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().catch(() => {});
            }
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setProgress(0);
      setIsPlaying(true);
      setCaptionExpanded(false);
      setShowAudioTooltip(false);
    }
  }, [currentIndex]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      setShowPlayStateIcon(next ? "play" : "pause");
      setTimeout(() => setShowPlayStateIcon(null), 600);
      return next;
    });
  };

  // Append freshly shuffled batch of reels when approaching queue buffer end
  const appendMoreIfNeeded = (nextIndex) => {
    const curr = playlistRef.current;
    const baseReels = reelsRef.current;
    if (baseReels && baseReels.length > 0 && nextIndex >= curr.length - 3) {
      const getReelId = (item) => (item?._id ? item._id.toString() : item?.id ? item.id.toString() : "");
      const lastId = curr.length > 0 ? getReelId(curr[curr.length - 1]) : null;
      const nextBatch = generateShuffledBatch(baseReels, lastId);
      const updated = [...curr, ...nextBatch];
      setPlaylist(updated);
      playlistRef.current = updated;
    }
  };

  // Advance to next wave indefinitely (never stops, endless loop)
  const goToNextReel = () => {
    if (slideTransition) return;
    setSlideTransition("next");
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        appendMoreIfNeeded(next);
        return next;
      });
      setSlideTransition(null);
    }, 240);
  };

  // Go to previous wave if currentIndex > 0
  const goToPrevReel = () => {
    if (slideTransition) return;
    if (currentIndexRef.current > 0) {
      setSlideTransition("prev");
      setTimeout(() => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        setSlideTransition(null);
      }, 240);
    }
  };

  const handleWheel = (e) => {
    if (isCommentsOpen || isReportOpen) return;
    if (wheelCooldownRef.current) return;

    if (Math.abs(e.deltaY) > 35) {
      wheelCooldownRef.current = true;
      if (e.deltaY > 0) {
        goToNextReel();
      } else {
        goToPrevReel();
      }
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 550);
    }
  };

  const handleSwipeNext = () => {
    goToNextReel();
  };

  const handleSwipePrev = () => {
    goToPrevReel();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isCleanView) {
          setIsCleanView(false);
        } else if (isReportOpen) {
          setIsReportOpen(false);
        } else if (isCommentsOpen) {
          setIsCommentsOpen(false);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        goToNextReel();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goToPrevReel();
      } else if (e.key === " " && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "m" || e.key === "M") {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCleanView, isReportOpen, isCommentsOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalMouseMove = (e) => {
      if (!isMouseDownRef.current || isCommentsOpen || isReportOpen) return;
      const deltaY = e.clientY - mouseStartRef.current.y;
      const deltaX = e.clientX - mouseStartRef.current.x;

      if (Math.abs(deltaY) > 8 || Math.abs(deltaX) > 8) {
        hasMovedSignificantlyRef.current = true;
        setIsDragging(true);
      }

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        let offset = deltaY;
        if (currentIndexRef.current === 0 && deltaY > 0) {
          offset = deltaY * 0.25;
        } else {
          offset = deltaY * 0.75;
        }
        setDragOffset(offset);
      }
    };

    const handleGlobalMouseUp = () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      setTimeout(() => setIsDragging(false), 80);

      const SWIPE_THRESHOLD = 50;
      setDragOffset((currOffset) => {
        if (currOffset < -SWIPE_THRESHOLD) {
          handleSwipeNext();
        } else if (currOffset > SWIPE_THRESHOLD) {
          handleSwipePrev();
        }
        return 0;
      });
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isOpen, isCommentsOpen, isReportOpen]);

  const handleTouchStart = (e) => {
    if (isCommentsOpen || isReportOpen) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isTouchingRef.current = true;
    hasMovedSignificantlyRef.current = false;
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isTouchingRef.current || isCommentsOpen || isReportOpen) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaX = touch.clientX - touchStartRef.current.x;

    if (Math.abs(deltaY) > 8 || Math.abs(deltaX) > 8) {
      hasMovedSignificantlyRef.current = true;
      setIsDragging(true);
    }

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      let offset = deltaY;
      if (currentIndexRef.current === 0 && deltaY > 0) {
        offset = deltaY * 0.25;
      } else {
        offset = deltaY * 0.8;
      }
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (!isTouchingRef.current) return;
    isTouchingRef.current = false;
    setTimeout(() => setIsDragging(false), 80);

    const SWIPE_THRESHOLD = 50;
    if (dragOffset < -SWIPE_THRESHOLD) {
      handleSwipeNext();
    } else if (dragOffset > SWIPE_THRESHOLD) {
      handleSwipePrev();
    }
    setDragOffset(0);
  };

  const handleMouseDown = (e) => {
    if (isCommentsOpen || isReportOpen) return;
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    mouseStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    hasMovedSignificantlyRef.current = false;
    setDragOffset(0);
  };

  const handleVideoTap = (e) => {
    if (hasMovedSignificantlyRef.current || isDragging) return;

    if (isCleanView) {
      setIsCleanView(false);
      return;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      triggerLike();
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY && lastTapRef.current !== 0) {
          togglePlayPause();
          lastTapRef.current = 0;
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  if (!isOpen || !currentReel) return null;

  const isLiked =
    localLikes[currentReel._id] !== undefined
      ? localLikes[currentReel._id]
      : currentReel.isLiked ||
        currentReel.likes?.some((u) => (u._id || u).toString() === currentUserId?.toString());

  const likeCount =
    (currentReel.likeCount || currentReel.likes?.length || 0) +
    (localLikes[currentReel._id] && !currentReel.isLiked ? 1 : 0) -
    (localLikes[currentReel._id] === false && currentReel.isLiked ? 1 : 0);

  const isSaved =
    localBookmarks[currentReel._id] !== undefined
      ? localBookmarks[currentReel._id]
      : currentReel.isSaved || false;

  const commentsList = localComments[currentReel._id] || currentReel.comments || [];

  const triggerLike = () => {
    const nextLiked = !isLiked;
    setLocalLikes((prev) => ({ ...prev, [currentReel._id]: nextLiked }));
    if (onLike) onLike(currentReel._id);
  };

  const triggerBookmark = () => {
    const nextSaved = !isSaved;
    setLocalBookmarks((prev) => ({ ...prev, [currentReel._id]: nextSaved }));
    if (onBookmark) onBookmark(currentReel._id);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/discover?reelId=${currentReel._id}`;
    if (navigator.share) {
      navigator.share({
        title: "Wave on OnBoard",
        text: currentReel.caption || "Check out this Wave on OnBoard!",
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast("Link copied to clipboard!");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await axios.post(
        `http://localhost:3000/api/posts/${currentReel._id}/comment`,
        { text: commentInput.trim() },
        { withCredentials: true }
      );

      const updatedComments = res.data.post?.comments || [
        ...commentsList,
        {
          text: commentInput.trim(),
          createdAt: new Date().toISOString(),
          profile: currentReel.profile,
        },
      ];

      setLocalComments((prev) => ({
        ...prev,
        [currentReel._id]: updatedComments,
      }));
      setCommentInput("");
    } catch (err) {
      console.error("Failed to post comment", err);
      showToast("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSelectQuality = (qual) => {
    setVideoQuality(qual);
    setShowQualityMenu(false);
    setShowMoreMenu(false);
    const cfg = QUALITY_CONFIGS[qual] || {};
    showToast(`Streaming quality set to ${cfg.label || qual}`);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setIsSubmittingReport(true);

    try {
      const allegationObj = PRESET_ALLEGATIONS.find((a) => a.id === selectedAllegation);
      await axios.post(
        "http://localhost:3000/api/safety/report",
        {
          targetType: "post",
          targetId: currentReel._id,
          reason: allegationObj?.reason || "other",
          details: `${allegationObj?.label || "Report"}: ${reportDetails.trim()}`,
        },
        { withCredentials: true }
      );

      setIsReportOpen(false);
      setReportDetails("");
      showToast("Report submitted. Thank you for keeping OnBoard safe.");
    } catch (err) {
      console.error("Report error:", err);
      showToast(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const formatViewCount = (count) => {
    if (!count) return "0";
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const authorProfile = currentReel.profile || {};
  const authorUser = currentReel.user || {};
  const authorName = authorProfile.userName || authorUser.firstName || "Creator";
  const authorPhoto =
    authorProfile.profilePhoto ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200">
      {/* Toast Notification */}
      {playerToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[150] px-4 py-2 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md bg-white/95 text-slate-800 border border-slate-200 animate-in fade-in zoom-in">
          {playerToast}
        </div>
      )}

      {/* Top Close Button (White Clean Theme) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-slate-800 hover:text-slate-950 bg-white/90 hover:bg-white p-2.5 rounded-full transition-all cursor-pointer backdrop-blur-md shadow-md border border-slate-200/80 hover:scale-105"
        aria-label="Close Waves"
      >
        <i className="fa-solid fa-xmark text-lg w-5 h-5 flex items-center justify-center"></i>
      </button>

      {/* Main Reels Card Container (Clean White Bezel Presentation) */}
      <div
        className="relative w-full max-w-[420px] h-full sm:h-[92vh] sm:max-h-[820px] bg-white sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200/80 select-none touch-none"
        onWheel={handleWheel}
      >
        {/* TOP HEADER: Dynamic Wave Serial Number + Mute & Three-dots (NO 6/6, NO Views inside) */}
        {!isCleanView && (
          <div className="absolute top-0 inset-x-0 z-30 p-3.5 bg-gradient-to-b from-black/75 via-black/35 to-transparent flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <span className="text-white text-xs font-black tracking-wide bg-gradient-to-r from-pink-500 via-indigo-600 to-indigo-700 px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-white/20">
                <i className="fa-solid fa-water text-[10px]"></i>
                <span>Wave #{currentIndex + 1}</span>
              </span>
              {videoQuality !== "1080p HD" && videoQuality !== "Auto" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-md flex items-center gap-1 border border-white/20 transition-all ${
                  videoQuality === "144p"
                    ? "bg-amber-600/90 text-amber-100 animate-pulse"
                    : videoQuality === "360p"
                    ? "bg-amber-500/80 text-white"
                    : "bg-black/50 text-white/90"
                }`}>
                  <i className="fa-solid fa-sliders text-[9px]"></i>
                  <span>{activeQualityConfig.badgeText}</span>
                </span>
              )}
            </div>

            {/* Top Right Controls: Mute Toggle + Three-dots Menu */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Sound Mute/Unmute */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((prev) => !prev);
                }}
                className="text-white bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 p-2 rounded-full transition-all cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                <i
                  className={`fa-solid ${
                    isMuted ? "fa-volume-xmark" : "fa-volume-high"
                  } text-xs w-3.5 h-3.5 flex items-center justify-center`}
                ></i>
              </button>

              {/* Three Dots Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreMenu((prev) => !prev);
                  setShowQualityMenu(false);
                }}
                className="text-white bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 p-2 rounded-full transition-all cursor-pointer"
                title="Options"
              >
                <i className="fa-solid fa-ellipsis-vertical text-xs w-3.5 h-3.5 flex items-center justify-center"></i>
              </button>
            </div>
          </div>
        )}

        {/* Clean View Exit Floating Button */}
        {isCleanView && (
          <button
            onClick={() => setIsCleanView(false)}
            className="absolute top-4 left-4 z-40 bg-white/90 hover:bg-white text-slate-800 backdrop-blur-md border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
          >
            <i className="fa-solid fa-compress text-indigo-600"></i>
            <span>Exit Fullscreen</span>
          </button>
        )}

        {/* Three Dots Dropdown Menu */}
        {showMoreMenu && !isCleanView && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-14 right-3 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-2 w-52 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Option 1: Clean Fullscreen (Hides buttons, usernames, captions) */}
            <button
              onClick={() => {
                setIsCleanView(true);
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors text-left text-slate-800"
            >
              <i className="fa-solid fa-expand text-indigo-600 text-sm"></i>
              <div>
                <span>View in Fullscreen</span>
                <span className="block text-[10px] text-slate-400 font-normal">
                  Hide buttons & captions
                </span>
              </div>
            </button>

            {/* Option 2: Quality Switcher */}
            <button
              onClick={() => setShowQualityMenu((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors text-left text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-sliders text-indigo-600 text-sm"></i>
                <span>Quality</span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded-md font-bold">
                {videoQuality}
              </span>
            </button>

            {/* Option 3: Report Wave */}
            <button
              onClick={() => {
                setIsReportOpen(true);
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl hover:bg-rose-50 text-rose-600 transition-colors text-left"
            >
              <i className="fa-solid fa-flag text-rose-500 text-sm"></i>
              <span>Report Wave</span>
            </button>
          </div>
        )}

        {/* Quality Options Submenu */}
        {showQualityMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-28 right-3 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-2 w-52 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Select Quality
            </div>
            {QUALITY_OPTIONS.map((q) => {
              const cfg = QUALITY_CONFIGS[q] || {};
              const isSelected = videoQuality === q;
              return (
                <button
                  key={q}
                  onClick={() => handleSelectQuality(q)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span>{q}</span>
                    <span
                      className={`text-[9px] font-normal ${
                        isSelected ? "text-indigo-200" : "text-slate-400"
                      }`}
                    >
                      {cfg.subtext}
                    </span>
                  </div>
                  {isSelected && <i className="fa-solid fa-check text-[10px]"></i>}
                </button>
              );
            })}
          </div>
        )}

        {/* Video Player & Swipe Target Container */}
        <div
          className={`relative flex-1 bg-black flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden ${
            slideTransition === "next"
              ? "animate-reel-slide-up"
              : slideTransition === "prev"
              ? "animate-reel-slide-down"
              : ""
          }`}
          style={{
            transform: dragOffset !== 0 ? `translateY(${dragOffset}px)` : undefined,
            transition:
              dragOffset === 0 && !slideTransition
                ? "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)"
                : undefined,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onClick={handleVideoTap}
        >
          {/* Main Media (Video or Image) with Real-Time Quality Rendering */}
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden relative"
            style={{
              filter: activeQualityConfig.filter,
              transform: `scale(${activeQualityConfig.scale || 1})`,
              transition: "filter 0.25s ease, transform 0.25s ease",
            }}
          >
            {currentReel.videoUrl ? (
              <video
                ref={videoRef}
                key={currentReel._id ? `${currentReel._id}-${currentIndex}` : `wave-${currentIndex}`}
                src={currentReel.videoUrl}
                poster={currentReel.thumbnailUrl || currentReel.image}
                className="w-full h-full object-cover pointer-events-none select-none"
                style={{
                  imageRendering: activeQualityConfig.gridSize ? "pixelated" : "auto",
                }}
                playsInline
                autoPlay
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={goToNextReel}
              />
            ) : (
              <img
                src={currentReel.image || currentReel.thumbnailUrl}
                alt="Wave content"
                className="w-full h-full object-cover pointer-events-none select-none"
                style={{
                  imageRendering: activeQualityConfig.gridSize ? "pixelated" : "auto",
                }}
              />
            )}
          </div>

          {/* Macroblock Pixel Grid Overlay for 144p / 360p Low-Res Simulation */}
          {activeQualityConfig.gridSize && (
            <div
              className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
              style={{
                opacity: activeQualityConfig.gridOpacity,
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 0, 0, 0.45) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 0, 0, 0.45) 1px, transparent 1px)
                `,
                backgroundSize: `${activeQualityConfig.gridSize} ${activeQualityConfig.gridSize}`,
              }}
            />
          )}

          {/* Low-Bitrate Scanlines for 144p */}
          {activeQualityConfig.scanlines && (
            <div
              className="absolute inset-0 pointer-events-none z-10 opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
              }}
            />
          )}

          {/* Center Play/Pause State Animation */}
          {showPlayStateIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-150">
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white text-2xl shadow-2xl">
                <i
                  className={`fa-solid ${
                    showPlayStateIcon === "play" ? "fa-play pl-1" : "fa-pause"
                  }`}
                ></i>
              </div>
            </div>
          )}

          {/* Heart Explosion Double-Tap Overlay */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <i className="fa-solid fa-heart text-7xl text-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.8)] animate-[ob-heart-burst_0.9s_ease-out_forwards]"></i>
            </div>
          )}

          {/* RIGHT FLOATING COMPACT ACTION ICONS (Tighter size to give video maximum frame) */}
          {!isCleanView && (
            <div
              className="absolute right-2.5 bottom-16 sm:bottom-20 z-30 flex flex-col items-center gap-3.5"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {/* Like Action */}
              <button
                onClick={triggerLike}
                className="flex flex-col items-center gap-0.5 group cursor-pointer"
                title="Like"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 ${
                    isLiked
                      ? "bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-500/40 scale-105"
                      : "bg-black/45 border-white/25 text-white hover:bg-black/65 hover:scale-105"
                  }`}
                >
                  <i
                    className={`fa-solid fa-heart text-sm sm:text-base ${
                      isLiked ? "animate-[ob-pop_0.3s_ease-out]" : ""
                    }`}
                  ></i>
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow">
                  {formatViewCount(likeCount)}
                </span>
              </button>

              {/* Comments Action */}
              <button
                onClick={() => setIsCommentsOpen((prev) => !prev)}
                className="flex flex-col items-center gap-0.5 group cursor-pointer"
                title="Comments"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 ${
                    isCommentsOpen
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/40"
                      : "bg-black/45 border-white/25 text-white hover:bg-black/65 hover:scale-105"
                  }`}
                >
                  <i className="fa-solid fa-comment-dots text-sm sm:text-base"></i>
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow">
                  {commentsList.length}
                </span>
              </button>

              {/* Share Action */}
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-0.5 group cursor-pointer"
                title="Share"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-black/45 border border-white/25 text-white backdrop-blur-md hover:bg-black/65 hover:scale-105 transition-all">
                  <i className="fa-solid fa-paper-plane text-xs sm:text-sm -rotate-12"></i>
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow">
                  Share
                </span>
              </button>

              {/* Bookmark Action */}
              <button
                onClick={triggerBookmark}
                className="flex flex-col items-center gap-0.5 group cursor-pointer"
                title="Save"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 ${
                    isSaved
                      ? "bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/40 scale-105"
                      : "bg-black/45 border-white/25 text-white hover:bg-black/65 hover:scale-105"
                  }`}
                >
                  <i className="fa-solid fa-bookmark text-xs sm:text-sm"></i>
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow">
                  Save
                </span>
              </button>

              {/* CIRCULAR MUSIC ICON IN BOTTOM-RIGHT CORNER (Replaces long bar) */}
              <div
                className="relative mt-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAudioTooltip((prev) => !prev);
                }}
                title={currentReel.audioTrack || "Original Audio"}
              >
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-white/70 flex items-center justify-center shadow-lg ${
                    isPlaying ? "animate-spin-slow" : ""
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-slate-950 border border-white/40 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
                  </div>
                </div>

                {isPlaying && (
                  <div className="absolute -top-2.5 -left-1 text-indigo-400 text-[9px] animate-music-note pointer-events-none">
                    ♫
                  </div>
                )}

                {/* Floating Audio Track Name Tooltip */}
                {showAudioTooltip && (
                  <div className="absolute right-10 bottom-0 whitespace-nowrap bg-black/85 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full shadow-lg border border-white/15 animate-in fade-in">
                    🎵 {currentReel.audioTrack || "Original Audio"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOTTOM CREATOR & CAPTION OVERLAY */}
          {!isCleanView && (
            <div className="absolute bottom-0 inset-x-0 z-20 p-3.5 pb-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white pointer-events-none">
              {/* Creator Header Row */}
              <div className="flex items-center gap-2.5 mb-2 pointer-events-auto">
                <Link
                  to={`/profile/${authorProfile._id || ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="relative group shrink-0"
                >
                  <img
                    src={authorPhoto}
                    alt={authorName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500 shadow-md"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] text-white">
                    ✓
                  </div>
                </Link>
                <div className="flex items-center gap-2 min-w-0">
                  <Link
                    to={`/profile/${authorProfile._id || ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="font-bold text-xs sm:text-sm text-white hover:underline drop-shadow truncate"
                  >
                    @{authorName}
                  </Link>
                  <span className="text-white/60 text-xs">•</span>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all cursor-pointer border border-white/20 shrink-0"
                  >
                    Board
                  </button>
                </div>
              </div>

              {/* CAPTION AREA (1 Line by default, Elongates Upwards on Click with light blur) */}
              <div className="pointer-events-auto max-w-[84%]">
                {!captionExpanded ? (
                  /* Collapsed View: strictly 1 Line, NO hashtags */
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setCaptionExpanded(true);
                    }}
                    className="cursor-pointer group flex items-center gap-1.5"
                    title="Click to read full caption & tags"
                  >
                    <p className="text-xs text-white/90 font-normal truncate drop-shadow leading-snug">
                      {currentReel.caption || "Wave on OnBoard"}
                    </p>
                    {currentReel.caption?.length > 30 && (
                      <span className="text-[10px] font-bold text-indigo-300 group-hover:text-white shrink-0">
                        ...more
                      </span>
                    )}
                  </div>
                ) : (
                  /* Expanded View: Elongated upward with soft blur background */
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/15 shadow-2xl max-h-[45vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-2"
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/15 text-[10px]">
                      <span className="font-extrabold uppercase tracking-wider text-indigo-300">
                        Full Caption &amp; Tags
                      </span>
                      <button
                        onClick={() => setCaptionExpanded(false)}
                        className="text-white/70 hover:text-white font-bold cursor-pointer"
                      >
                        Collapse ▲
                      </button>
                    </div>

                    <p className="text-xs text-white leading-relaxed font-normal">
                      {currentReel.caption}
                    </p>

                    {/* Hashtags displayed ONLY in expanded mode */}
                    {currentReel.categoryTags && currentReel.categoryTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/15">
                        {currentReel.categoryTags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-semibold text-indigo-300 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thin Bottom Video Progress Bar */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-40">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* COMMENT DRAWER / SLIDE-OVER (White Theme) */}
        {isCommentsOpen && (
          <div
            className="absolute inset-x-0 bottom-0 h-2/3 bg-white/98 text-slate-900 backdrop-blur-xl z-50 rounded-t-3xl border-t border-slate-200 flex flex-col p-4 animate-in slide-in-from-bottom duration-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <span className="text-slate-800 text-sm font-extrabold flex items-center gap-2">
                <i className="fa-regular fa-comments text-indigo-600"></i>
                <span>Comments ({commentsList.length})</span>
              </span>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Comments Scrollable Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {commentsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                  <i className="fa-regular fa-comment-dots text-3xl mb-2 text-slate-300"></i>
                  <span>No comments yet. Start the conversation!</span>
                </div>
              ) : (
                commentsList.map((comm, idx) => (
                  <div key={idx} className="flex gap-2.5 text-xs text-slate-800">
                    <img
                      src={
                        comm.profile?.profilePhoto ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                      }
                      alt="Commenter"
                      className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">
                          {comm.profile?.userName || "User"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5 leading-relaxed">
                        {comm.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form
              onSubmit={handleAddComment}
              className="pt-2 border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs rounded-full px-3.5 py-2 focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs"
              >
                Post
              </button>
            </form>
          </div>
        )}

        {/* REPORT WAVE MODAL (Pre-filled Allegations) */}
        {isReportOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">
                    🚩
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">Report Wave</h3>
                    <p className="text-[10px] text-slate-400">Select reason for moderation</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="flex-1 overflow-y-auto space-y-2">
                <div className="space-y-1.5">
                  {PRESET_ALLEGATIONS.map((allegation) => (
                    <label
                      key={allegation.id}
                      onClick={() => setSelectedAllegation(allegation.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                        selectedAllegation === allegation.id
                          ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 font-semibold"
                          : "border-slate-100 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="allegation"
                        checked={selectedAllegation === allegation.id}
                        onChange={() => setSelectedAllegation(allegation.id)}
                        className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="text-[11px] leading-tight">{allegation.label}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide details to assist our crew review..."
                    className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
                  >
                    {isSubmittingReport ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Side Desktop Navigation Controls (Clean White Theme, Dynamic Serial Number) */}
      <div className="hidden lg:flex flex-col items-center gap-2.5 absolute right-12 top-1/2 -translate-y-1/2 z-50">
        <button
          onClick={goToPrevReel}
          disabled={currentIndex === 0}
          className="w-11 h-11 rounded-full bg-white/90 hover:bg-white disabled:opacity-30 text-slate-800 flex items-center justify-center backdrop-blur-md border border-slate-200 shadow-xl transition-all cursor-pointer hover:scale-105"
          aria-label="Previous Wave"
          title="Previous Wave (Up Arrow)"
        >
          <i className="fa-solid fa-chevron-up text-base"></i>
        </button>

        <div className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md text-xs font-black text-indigo-600 min-w-10 text-center select-none">
          #{currentIndex + 1}
        </div>

        <button
          onClick={goToNextReel}
          className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center backdrop-blur-md border border-slate-200 shadow-xl transition-all cursor-pointer hover:scale-105"
          aria-label="Next Wave"
          title="Next Wave (Down Arrow)"
        >
          <i className="fa-solid fa-chevron-down text-base"></i>
        </button>
      </div>
    </div>
  );
};

export default ReelPlayerModal;
