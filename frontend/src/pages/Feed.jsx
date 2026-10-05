import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import CreatePost from "./CreatePost";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Sidebar from "../components/Sidebar";
import UserSearchDropdown from "../components/UserSearchDropdown";
import MemberBadge from "../components/MemberBadge";
import ReportModal from "../components/ReportModal";
import ShareModal from "../components/ShareModal";
import CrewCurrents from "../components/CrewCurrents";
import { scrollToTop } from "../utils/scrollToTop";
import Profile1 from "../assets/profile.jpg";
import { downloadImage } from "../utils/downloadImage";
import { overlayCard } from "../context/OverlayCardContext";
import { useSidebar } from "../context/SidebarContext";
import pulse from "../utils/pulseEngine";

const EMOJI_REACTIONS = [
  { emoji: "❤️", label: "Love" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💀", label: "Dead" },
  { emoji: "🫡", label: "Respect" },
  { emoji: "⚡", label: "Hype" },
  { emoji: "😭", label: "Real" },
];

const formatTimeAgo = (dateString) => {
  if (!dateString) return "just now";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const renderFormattedCaption = (caption) => {
  if (!caption) return null;
  const tokens = caption.split(/(\s+)/);
  return tokens.map((token, idx) => {
    if (token.startsWith("#") && token.length > 1) {
      return (
        <span
          key={idx}
          className="text-indigo-600 font-semibold hover:underline cursor-pointer transition-colors"
        >
          {token}
        </span>
      );
    }
    return <span key={idx}>{token}</span>;
  });
};

const ExpandableCaption = ({ caption }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!caption) return null;

  return (
    <div
      onClick={() => setIsExpanded((prev) => !prev)}
      className="cursor-pointer select-none group/caption transition-all duration-300 ease-out"
      title={isExpanded ? "Click to collapse" : "Click to view full caption"}
    >
      <div
        className={`transition-all duration-300 ease-out overflow-hidden ${
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-6 opacity-95"
        }`}
      >
        <p
          className={`text-sm sm:text-[15px] text-slate-800 leading-relaxed font-normal transition-all duration-200 ${
            isExpanded ? "whitespace-normal break-words" : "truncate"
          }`}
        >
          {renderFormattedCaption(caption)}
        </p>
      </div>

      {caption.length > 45 && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors mt-0.5">
          {isExpanded ? (
            <>
              Less <i className="fa-solid fa-chevron-up text-[9px]"></i>
            </>
          ) : (
            <>
              ...more <i className="fa-solid fa-chevron-down text-[9px]"></i>
            </>
          )}
        </span>
      )}
    </div>
  );
};

const AdaptivePostMedia = ({
  imageUrl,
  chapter,
  onDoubleTap,
  showHeartBurst,
  onExpand,
}) => {
  // Support limited clean aspect ratios requested: 1:1, 4:3, 16:9, 4:5
  const [aspectRatio, setAspectRatio] = useState("4 / 3");

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (!naturalWidth || !naturalHeight) return;
    const ratio = naturalWidth / naturalHeight;

    if (ratio >= 1.55) {
      setAspectRatio("16 / 9");
    } else if (ratio >= 1.15) {
      setAspectRatio("4 / 3");
    } else if (ratio >= 0.88) {
      setAspectRatio("1 / 1");
    } else {
      setAspectRatio("4 / 5");
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 group select-none shadow-inner border border-slate-200/50">
      <div 
        className="w-full max-h-[520px] flex items-center justify-center overflow-hidden"
        style={{ aspectRatio }}
      >
        <img
          src={imageUrl}
          alt="Post media"
          onLoad={handleImageLoad}
          onDoubleClick={onDoubleTap}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.015] cursor-pointer"
          title="Double-tap to like ❤️"
        />
      </div>

      {/* Top-Right Pill: Counter 1 / 1 */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-white/90 text-xs font-semibold border border-white/15 tracking-wider">
          1 / 1
        </span>
      </div>

      {/* Bottom-Right: Expand Lightbox Button */}
      <div className="absolute bottom-3 right-3 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/15 cursor-pointer shadow-md active:scale-90"
          title="View Fullscreen"
          aria-label="Expand image"
        >
          <i className="fa-solid fa-expand text-xs"></i>
        </button>
      </div>

      {/* Double tap heart burst */}
      {showHeartBurst && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <span className="text-7xl animate-ping drop-shadow-2xl">❤️</span>
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [commentSectionsOpen, setCommentSectionsOpen] = useState({});
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [boardedUsers, setBoardedUsers] = useState({});
  const [heartBurstPostId, setHeartBurstPostId] = useState(null);
  const [postOptionsOpen, setPostOptionsOpen] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingTarget, setReportingTarget] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingPost, setSharingPost] = useState(null);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedLightboxImage(null);
      }
    };
    if (selectedLightboxImage) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedLightboxImage]);

  useEffect(() => {
    if (isCreatePostOpen || postToDelete) {
      scrollToTop();
    }
  }, [isCreatePostOpen, postToDelete]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCommentSection = (postId) => {
    setCommentSectionsOpen((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const togglePostOptions = (postId) => {
    setPostOptionsOpen((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
      await axios.delete(`http://localhost:3000/api/posts/${postToDelete}`, {
        withCredentials: true,
      });
      setPosts((prev) => prev.filter((post) => post._id !== postToDelete));
      setPostToDelete(null);
    } catch (err) {
      console.error("Failed to delete post", err);
      overlayCard.error("Failed to delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/posts", { withCredentials: true })
      .then((res) => {
        setPosts(res.data.posts || []);
      })
      .catch((err) => {
        console.error("Failed to fetch posts", err);
      });

    axios
      .get("http://localhost:3000/api/profile/get-me", { withCredentials: true })
      .then((res) => {
        setProfile(res.data.user);
        const initialBoarded = {};
        if (res.data.user.boards) {
          res.data.user.boards.forEach((id) => {
            const key = typeof id === "object" ? id?._id || id : id;
            if (key) initialBoarded[key.toString()] = "boarded";
          });
        }
        setBoardedUsers((prev) => ({ ...prev, ...initialBoarded }));

        if (res.data.user.savedPosts) {
          const initialSaved = {};
          res.data.user.savedPosts.forEach((id) => {
            const key = typeof id === "object" ? id._id || id : id;
            initialSaved[key] = true;
          });
          setSavedPosts(initialSaved);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch profile", err);
      });

    axios
      .get("http://localhost:3000/api/profile/suggestions", { withCredentials: true })
      .then((res) => {
        const list = res.data.suggestions || [];
        setSuggestions(list);
        const statusMap = {};
        list.forEach((s) => {
          if (s.userId && s.boardStatus) {
            statusMap[s.userId.toString()] = s.boardStatus;
          }
        });
        setBoardedUsers((prev) => ({ ...prev, ...statusMap }));
      })
      .catch((err) => {
        console.error("Failed to fetch suggestions", err);
      });
  }, []);

  const likePost = async (postId) => {
    try {
      pulse.like();
      const res = await axios.post(
        `http://localhost:3000/api/posts/${postId}/like`,
        {},
        { withCredentials: true }
      );
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data.post : p)));
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  const handleOpenShare = (post) => {
    setSharingPost(post);
    setIsShareModalOpen(true);
  };

  const handleShareSuccess = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          const shares = p.shares || [];
          return { ...p, shares: [...shares, "shared"] };
        }
        return p;
      })
    );
  };

  const handleCommentChange = (postId, text) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const submitComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    try {
      const res = await axios.post(
        `http://localhost:3000/api/posts/${postId}/comment`,
        { text },
        { withCredentials: true }
      );
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data.post : p)));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Failed to submit comment", err);
    }
  };

  const savePost = async (postId) => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/posts/${postId}/bookmark`,
        {},
        { withCredentials: true }
      );
      setSavedPosts((prev) => ({
        ...prev,
        [postId]: res.data.isSaved,
      }));
    } catch (err) {
      console.error("Failed to bookmark post", err);
    }
  };

  const toggleBoardUser = async (userId) => {
    if (!userId) return;
    const prevStatus = boardedUsers[userId] || "none";
    const desiredAction =
      prevStatus === "requested"
        ? "cancel"
        : prevStatus === "boarded"
        ? "unboard"
        : "request";

    const optimisticStatus = desiredAction === "request" ? "requested" : "none";

    if (optimisticStatus === "requested") {
      pulse.boardRequested();
    } else {
      pulse.boardRejected();
    }

    // Instant optimistic update so the user immediately sees "Requested"
    setBoardedUsers((prev) => ({
      ...prev,
      [userId]: optimisticStatus,
    }));

    try {
      const res = await axios.post(
        `http://localhost:3000/api/profile/${userId}/board`,
        { action: desiredAction },
        { withCredentials: true }
      );
      const serverStatus = res.data.status;
      if (serverStatus === "boarded") {
        pulse.boardAccepted();
      }
      const finalStatus =
        serverStatus === "cancelled" || serverStatus === "unboarded"
          ? "none"
          : serverStatus;

      setBoardedUsers((prev) => ({
        ...prev,
        [userId]: finalStatus,
      }));
    } catch (err) {
      console.error("Failed to board user", err);
      // Revert if error
      setBoardedUsers((prev) => ({
        ...prev,
        [userId]: prevStatus,
      }));
    }
  };

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: "Good morning", icon: "☀️", sub: "Start your day with the crew" };
    if (hour >= 12 && hour < 17) return { text: "Afternoon flow", icon: "⚡", sub: "Catch up on what's dropping" };
    if (hour >= 17 && hour < 22) return { text: "Evening vibes", icon: "🌆", sub: "Relax and vibe with friends" };
    return { text: "Late night mode", icon: "🌙", sub: "Night owl conversations" };
  };

  const greeting = getDynamicGreeting();

  // Mockup Interactive States
  const [activeFeedTab, setActiveFeedTab] = useState("For You");
  const [likedMockPost, setLikedMockPost] = useState(false);
  const [mockPostLikes, setMockPostLikes] = useState(24);
  const [mockPostSaved, setMockPostSaved] = useState(false);

  const toggleMockPostLike = () => {
    pulse.pop();
    setLikedMockPost((prev) => !prev);
    setMockPostLikes((prev) => (likedMockPost ? prev - 1 : prev + 1));
  };

  const toggleMockPostSave = () => {
    pulse.tap();
    setMockPostSaved((prev) => !prev);
  };

  const crewsList = [
    {
      name: "Close Friends",
      members: "12 members",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&auto=format&fit=crop&q=80",
    },
    {
      name: "College Crew",
      members: "24 members",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&auto=format&fit=crop&q=80",
    },
    {
      name: "Goa Trip ✈️",
      members: "8 members",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80",
    },
    {
      name: "Studio Crew",
      members: "6 members",
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80",
    },
    {
      name: "Cricket Match 🏏",
      members: "18 members",
      image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&auto=format&fit=crop&q=80",
    },
  ];

  const handleImageDoubleTap = (postId) => {
    setHeartBurstPostId(postId);
    setTimeout(() => setHeartBurstPostId(null), 900);
    const post = posts.find((p) => p._id === postId);
    const currentUserId = profile?.user?._id || profile?.user || profile?._id;
    const isLiked = post?.likes?.some(
      (id) => (typeof id === "object" ? id?._id : id) === currentUserId
    );
    if (!isLiked) {
      likePost(postId);
    }
  };

  const handleAddCommentEmoji = (postId, emoji) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: (prev[postId] || "") + emoji,
    }));
  };

  return (
    <>
      <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-50 flex">
        {/* LEFT SIDEBAR - Rigid & Fixed */}
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

        <div className={`flex-1 min-w-0 h-full flex flex-col overflow-hidden transition-all duration-300 ${
          isCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
        }`}>
          {/* Top Navbar */}
          <header className="shrink-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
              <button
                type="button"
                className="lg:hidden text-slate-700 text-lg p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={toggleSidebar}
                aria-label="Toggle Sidebar"
              >
                <i className="fa-solid fa-bars"></i>
              </button>
              
              {/* Desktop / Tablet Live Search Dropdown */}
              <div className="hidden sm:block flex-1">
                <UserSearchDropdown
                  onBoardStatusChange={(userId, status) => {
                    setBoardedUsers((prev) => ({ ...prev, [userId]: status }));
                  }}
                />
              </div>

              {/* Mobile Quick Search Button */}
              <button
                type="button"
                onClick={() => navigate("/search")}
                className="sm:hidden text-slate-700 hover:text-indigo-600 text-sm p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Search Crew"
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Sun / Theme / Weather Toggle */}
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-sm shadow-2xs"
                title="Toggle Theme"
              >
                <i className="fa-regular fa-sun text-sm"></i>
              </button>

              {/* + Create Button matching mockup */}
              <button
                type="button"
                className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                onClick={() => {
                  scrollToTop();
                  setIsCreatePostOpen(true);
                }}
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Create</span>
              </button>

              <Link
                to="/my-profile"
                onClick={scrollToTop}
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/20 transition-all"
              >
                <img
                  src={profile?.profilePhoto || Profile1}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-indigo-200 shadow-xs"
                />
              </Link>
            </div>
          </header>

          {/* Main Dashboard Layout - Two Independent Scroll Sections */}
          <div className="flex-1 min-h-0 w-full flex gap-8 overflow-hidden px-4 sm:px-8">
            {/* Section 1: Feed Center Column (Independent Scroll) */}
            <div className="flex-1 min-w-0 h-full flex justify-center">
              <main className="feed-column max-w-2xl w-full h-full overflow-y-auto py-6 space-y-6 scrollbar-none overscroll-contain">
              
              {/* 1. Hero Banner Card with Mindset Quote, Weather Widget, and Bottom Composer Bar */}
              <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-100/80 bg-slate-900 min-h-[220px] sm:min-h-[240px] flex flex-col justify-between p-5 sm:p-6 group">
                <img
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1400&auto=format&fit=crop&q=80"
                  alt="Scenic Summit"
                  className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                {/* Top Row: Handwritten Quote & Floating Weather Widget */}
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="max-w-[280px]">
                    <h2 className="text-white text-2xl sm:text-3xl font-serif italic font-normal tracking-wide drop-shadow-md leading-tight">
                      More People<br />Brighter Journeys.
                    </h2>
                  </div>

                  {/* Weather Widget */}
                  <div className="bg-slate-900/60 hover:bg-slate-900/75 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 px-4 text-white shadow-xl flex items-center gap-3 transition-all cursor-pointer">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[11px] text-white/80 justify-end">
                        <i className="fa-solid fa-location-dot text-[10px]"></i>
                        <span>Meerut</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-base">☀️</span>
                        <span className="text-sm font-black">26°C</span>
                        <span className="text-[10px] text-white/75">Partly cloudy &gt;</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Floating Composer Bar */}
                <div
                  onClick={() => setIsCreatePostOpen(true)}
                  className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 px-4 shadow-xl border border-white/70 flex items-center justify-between gap-3 cursor-pointer hover:bg-white transition-all group/composer mt-6"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={profile?.profilePhoto || Profile1}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-xs text-slate-400 group-hover/composer:text-slate-600 transition-colors font-medium truncate">
                      What's on your mind, {profile?.firstName || "Digvijay"}?
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-sm shrink-0">
                    <span className="hover:text-indigo-600 transition-colors p-1" title="Photo"><i className="fa-regular fa-image"></i></span>
                    <span className="hover:text-indigo-600 transition-colors p-1" title="Video"><i className="fa-solid fa-video"></i></span>
                    <span className="hover:text-indigo-600 transition-colors p-1" title="Experience"><i className="fa-regular fa-calendar"></i></span>
                    <span className="hover:text-indigo-600 transition-colors p-1" title="Location"><i className="fa-solid fa-location-dot"></i></span>
                  </div>
                </div>
              </div>

              {/* 2. Quick Action Pills Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreatePostOpen(true)}
                  className="flex items-center gap-2 p-2.5 px-3 rounded-2xl bg-purple-50/80 hover:bg-purple-100/90 text-purple-700 text-xs font-bold transition-all border border-purple-100 cursor-pointer shadow-2xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px] shrink-0">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </span>
                  <span className="truncate">Create Post</span>
                </button>

                <Link
                  to="/dual-deck"
                  className="flex items-center gap-2 p-2.5 px-3 rounded-2xl bg-sky-50/80 hover:bg-sky-100/90 text-sky-700 text-xs font-bold transition-all border border-sky-100 cursor-pointer shadow-2xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center text-[10px] shrink-0">
                    <i className="fa-solid fa-table-columns"></i>
                  </span>
                  <span className="truncate">Dual Deck</span>
                </Link>

                <Link
                  to="/squads"
                  className="flex items-center gap-2 p-2.5 px-3 rounded-2xl bg-amber-50/80 hover:bg-amber-100/90 text-amber-700 text-xs font-bold transition-all border border-amber-100 cursor-pointer shadow-2xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-[10px] shrink-0">
                    <i className="fa-solid fa-anchor"></i>
                  </span>
                  <span className="truncate">Squads</span>
                </Link>

                <Link
                  to="/search"
                  className="flex items-center gap-2 p-2.5 px-3 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-700 text-xs font-bold transition-all border border-emerald-100 cursor-pointer shadow-2xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0">
                    <i className="fa-solid fa-user-plus"></i>
                  </span>
                  <span className="truncate">Search Crew</span>
                </Link>

                <Link
                  to="/chats"
                  className="flex items-center gap-2 p-2.5 px-3 rounded-2xl bg-fuchsia-50/80 hover:bg-fuchsia-100/90 text-fuchsia-700 text-xs font-bold transition-all border border-fuchsia-100 cursor-pointer shadow-2xs col-span-2 sm:col-span-1"
                >
                  <span className="w-6 h-6 rounded-lg bg-fuchsia-500 text-white flex items-center justify-center text-[10px] shrink-0">
                    <i className="fa-solid fa-comments"></i>
                  </span>
                  <span className="truncate">Chats</span>
                </Link>
              </div>

              {/* 3. Your Crews Horizontal Strip */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-bold text-slate-900">Your Crews</h3>
                  <Link to="/search" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                    See All <i className="fa-solid fa-chevron-right text-[10px]"></i>
                  </Link>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none relative">
                  {/* Add Story Card */}
                  <div
                    onClick={() => setIsCreatePostOpen(true)}
                    className="flex flex-col items-center gap-2 p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 w-24 shrink-0 cursor-pointer transition-all group text-center"
                  >
                    <div className="relative">
                      <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 group-hover:scale-105 transition-transform">
                        <img
                          src={profile?.profilePhoto || Profile1}
                          alt="Your avatar"
                          className="w-full h-full rounded-full object-cover border-2 border-white"
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs">
                        <i className="fa-solid fa-plus"></i>
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 leading-tight">Add Story</span>
                  </div>

                  {/* Crew Cards */}
                  {crewsList.map((crew, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate("/squads")}
                      className="flex flex-col gap-1.5 p-2 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 w-28 shrink-0 cursor-pointer transition-all group"
                    >
                      <div className="w-full h-16 rounded-xl overflow-hidden relative">
                        <img
                          src={crew.image}
                          alt={crew.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">{crew.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{crew.members}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Feed Filter Tabs */}
              <div className="bg-white rounded-2xl p-1.5 shadow-2xs border border-slate-100 flex items-center gap-1 overflow-x-auto scrollbar-none">
                {["For You", "Crews", "Following", "Squads", "Nearby"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveFeedTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      activeFeedTab === tab
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* 5. Featured Goa Trip Post from Mockup */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                      alt="Maya Sharma"
                      className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">Maya Sharma</span>
                        <span className="text-xs text-slate-400 font-medium">in</span>
                        <span className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Goa Trip 🌴</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">2h ago • Panaji, Goa</span>
                    </div>
                  </div>

                  <button type="button" className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <i className="fa-solid fa-ellipsis text-sm"></i>
                  </button>
                </div>

                {/* Caption */}
                <p className="text-sm text-slate-800 leading-relaxed font-normal">
                  Sunset hits different with the right people. 🌅 Grateful for these moments. 💙
                </p>

                {/* Collage Grid matching the mockup */}
                <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden max-h-[360px]">
                  <div className="col-span-2 h-[340px]">
                    <img
                      src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80"
                      alt="Goa Sunset"
                      className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                    />
                  </div>
                  <div className="grid grid-rows-3 gap-2 h-[340px]">
                    <div className="h-[108px] rounded-xl overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&auto=format&fit=crop&q=80"
                        alt="Palms"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="h-[108px] rounded-xl overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=400&auto=format&fit=crop&q=80"
                        alt="Coconut Drink"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="h-[108px] rounded-xl overflow-hidden relative group cursor-pointer">
                      <img
                        src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&auto=format&fit=crop&q=80"
                        alt="Beach Fire"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center text-white font-black text-base group-hover:bg-slate-950/70 transition-colors">
                        +3
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engagement Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={toggleMockPostLike}
                      className={`flex items-center gap-1.5 font-bold text-xs transition-transform cursor-pointer ${
                        likedMockPost ? "text-rose-500 scale-105" : "text-slate-500 hover:text-rose-500"
                      }`}
                    >
                      <i className={`text-sm ${likedMockPost ? "fa-solid fa-heart" : "fa-regular fa-heart"}`}></i>
                      <span>{mockPostLikes}</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <i className="fa-regular fa-comment text-sm"></i>
                      <span>6</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-retweet text-sm"></i>
                      <span>2</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleMockPostSave}
                      className={`transition-colors cursor-pointer ${
                        mockPostSaved ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
                      }`}
                    >
                      <i className={`text-sm ${mockPostSaved ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark"}`}></i>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-2">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80" className="w-5 h-5 rounded-full border-2 border-white object-cover" alt="" />
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80" className="w-5 h-5 rounded-full border-2 border-white object-cover" alt="" />
                        <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80" className="w-5 h-5 rounded-full border-2 border-white object-cover" alt="" />
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">You and 23 others</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feed Stream */}
              <div>
                {posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((post) => {
                      const currentUserId = profile?.user?._id || profile?.user || profile?._id || profile?.userId;
                      const isLiked = post.likes?.some(
                        (id) => (typeof id === "object" ? id?._id : id) === currentUserId
                      );
                      const isOwner = profile && (
                        post.user === profile.userId ||
                        post.user === profile._id ||
                        post.user?._id === profile.userId
                      );
                      const authorName = post.profile?.userName || post.user?.userName || "Anonymous";
                      const authorPhoto = post.profile?.profilePhoto || Profile1;
                      const authorRole = post.profile?.vipFlair
                        ? `✨ ${post.profile.vipFlair}`
                        : (post.profile?.membershipTier || "Crew Member");
                      const timeAgo = formatTimeAgo(post.createdAt);
                      const isVerified = Boolean(post.profile?.isOfficialVerified);

                      return (
                        <article
                          key={post._id}
                          className="bg-white rounded-[32px] p-5 sm:p-6 shadow-sm border border-slate-100/90 space-y-4 transition-all duration-300 ease-out hover:shadow-md hover:border-slate-200/80"
                        >
                          {/* 1. Header: Avatar with gradient aura, Name, Subtitle, 3-dots */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Avatar with aura border ring & green status dot */}
                              <div className="relative">
                                <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-sm">
                                  <img
                                    src={authorPhoto}
                                    alt={authorName}
                                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white"
                                  />
                                </div>
                                <span
                                  className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-2xs"
                                  title="Online in Crew"
                                ></span>
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Link
                                    to={`/user/${post.user}`}
                                    className="text-sm sm:text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors leading-tight"
                                  >
                                    {authorName}
                                  </Link>
                                  {isVerified && (
                                    <span
                                      className="inline-flex items-center text-indigo-600 text-sm"
                                      title="Official Verified Tick"
                                    >
                                      <i className="fa-solid fa-circle-check"></i>
                                    </span>
                                  )}
                                  {post.profile?.membershipTier && post.profile?.membershipTier !== "free" && (
                                    <MemberBadge tier={post.profile?.membershipTier} size="xs" />
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                                  <span>{authorRole}</span>
                                  <span>•</span>
                                  <span>{timeAgo}</span>
                                  <span>•</span>
                                  <i className="fa-solid fa-globe text-[11px] text-slate-400" title="Public to Crew"></i>
                                </div>
                              </div>
                            </div>

                            {/* 3-Dots Menu Button */}
                            <div className="relative">
                              <button
                                type="button"
                                className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                onClick={() => togglePostOptions(post._id)}
                                aria-label="Post options"
                              >
                                <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                              </button>

                              {postOptionsOpen[post._id] && (
                                <div className="absolute right-0 top-11 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                                  {post.image && (
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                                      onClick={() => {
                                        downloadImage(post.image, `onboard-post-${post._id}.jpg`);
                                        togglePostOptions(post._id);
                                      }}
                                    >
                                      <i className="fa-solid fa-arrow-down-to-bracket text-[11px] text-slate-500"></i> Download Photo
                                    </button>
                                  )}
                                  {isOwner && (
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                                      onClick={() => {
                                        scrollToTop();
                                        setPostToDelete(post._id);
                                        togglePostOptions(post._id);
                                      }}
                                    >
                                      <i className="fa-solid fa-trash text-[11px]"></i> Delete Post
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                                    onClick={() => {
                                      handleOpenShare(post);
                                      togglePostOptions(post._id);
                                    }}
                                  >
                                    <i className="fa-solid fa-share text-[11px] text-slate-500"></i> Share
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                                    onClick={() => {
                                      setReportingTarget({
                                        targetType: "post",
                                        targetId: post._id,
                                        targetName: `Post by @${authorName}`,
                                      });
                                      setIsReportModalOpen(true);
                                      togglePostOptions(post._id);
                                    }}
                                  >
                                    <i className="fa-solid fa-flag text-[11px]"></i> Report Post
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 2. Caption with single-line truncate and smooth click-to-expand */}
                          {post.caption && <ExpandableCaption caption={post.caption} />}

                          {/* 3. Adaptive Inset Media Photo */}
                          {post.image && (
                            <AdaptivePostMedia
                              imageUrl={post.image}
                              chapter={post.chapter}
                              onDoubleTap={() => handleImageDoubleTap(post._id)}
                              showHeartBurst={heartBurstPostId === post._id}
                              onExpand={() =>
                                setSelectedLightboxImage({
                                  url: post.image,
                                  caption: post.caption,
                                  author: authorName,
                                })
                              }
                            />
                          )}

                          {/* 4. Engagement Summary Row */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center -space-x-1.5">
                                <img
                                  src={authorPhoto}
                                  alt="Liker"
                                  className="w-5 h-5 rounded-full object-cover border-2 border-white shadow-2xs"
                                />
                                <img
                                  src={Profile1}
                                  alt="Liker"
                                  className="w-5 h-5 rounded-full object-cover border-2 border-white shadow-2xs"
                                />
                                <img
                                  src={profile?.profilePhoto || Profile1}
                                  alt="Liker"
                                  className="w-5 h-5 rounded-full object-cover border-2 border-white shadow-2xs"
                                />
                              </div>
                              <span className="text-xs text-slate-600 font-medium">
                                {isLiked ? (
                                  <>
                                    You and{" "}
                                    <strong className="text-slate-900 font-bold">
                                      {Math.max(0, (post.likes?.length || 1) - 1)} others
                                    </strong>{" "}
                                    liked this
                                  </>
                                ) : (
                                  <>
                                    <strong className="text-slate-900 font-bold">
                                      {post.likes?.length || 0} crew members
                                    </strong>{" "}
                                    liked this
                                  </>
                                )}
                              </span>
                            </div>

                          </div>

                          {/* 5. Bottom Action Bar with Pill Buttons */}
                          <div className="flex items-center justify-between pt-1">
                            {/* Left Pills */}
                            <div className="flex items-center gap-2 sm:gap-2.5">
                              {/* Like Pill */}
                              <button
                                type="button"
                                onClick={() => likePost(post._id)}
                                className={`px-3.5 sm:px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                  isLiked
                                    ? "bg-rose-50 border border-rose-200/90 text-rose-600 shadow-sm shadow-rose-100"
                                    : "bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-700"
                                }`}
                                title={isLiked ? "Unlike" : "Like"}
                              >
                                <i
                                  className={
                                    isLiked
                                      ? "fa-solid fa-heart text-rose-500 text-sm scale-110"
                                      : "fa-regular fa-heart text-slate-500 text-sm"
                                  }
                                ></i>
                                <span>{post.likes?.length || 0}</span>
                              </button>

                              {/* Comment Pill */}
                              <button
                                type="button"
                                onClick={() => toggleCommentSection(post._id)}
                                className={`px-3 sm:px-3.5 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-2 ${
                                  commentSectionsOpen[post._id]
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                    : "bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-700"
                                }`}
                                title="View & add comments"
                              >
                                <i className="fa-regular fa-comment text-slate-600 text-sm"></i>
                                <span>{post.comments?.length || 0}</span>
                              </button>

                              {/* Repost / Share Pill */}
                              <button
                                type="button"
                                onClick={() => handleOpenShare(post)}
                                className="px-3 sm:px-3.5 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-700 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer active:scale-95"
                                title="Share / Repost"
                              >
                                <i className="fa-solid fa-repeat text-slate-600 text-sm"></i>
                                <span>{post.shares?.length || 0}</span>
                              </button>
                            </div>

                            {/* Right Buttons: Bookmark & Share */}
                            <div className="flex items-center gap-2">
                              {/* Bookmark */}
                              <button
                                type="button"
                                onClick={() => savePost(post._id)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                                  savedPosts[post._id]
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm"
                                    : "bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-600"
                                }`}
                                title={savedPosts[post._id] ? "Saved to bookmarks" : "Save bookmark"}
                              >
                                <i
                                  className={
                                    savedPosts[post._id]
                                      ? "fa-solid fa-bookmark text-sm text-indigo-600"
                                      : "fa-regular fa-bookmark text-sm"
                                  }
                                ></i>
                              </button>

                              {/* Share */}
                              <button
                                type="button"
                                onClick={() => handleOpenShare(post)}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all cursor-pointer active:scale-95"
                                title="Share Post"
                              >
                                <i className="fa-solid fa-share text-sm"></i>
                              </button>
                            </div>
                          </div>

                          {/* 6. Expandable Inline Comments with Silky Accordion Animation */}
                          <div
                            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                              commentSectionsOpen[post._id]
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0 pointer-events-none"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="pt-3.5 border-t border-slate-100 space-y-3">
                                {post.comments && post.comments.length > 0 && (
                                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                                    {post.comments.map((c, i) => (
                                      <div key={i} className="text-xs bg-slate-50/80 p-3 rounded-2xl border border-slate-100 shadow-2xs">
                                        <strong className="text-slate-900 font-bold">
                                          {c.profile?.userName || "User"}
                                        </strong>
                                        : <span className="text-slate-700">{c.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Quick Emojis */}
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-[11px] font-bold text-slate-400">React:</span>
                                  <div className="flex gap-1">
                                    {EMOJI_REACTIONS.map((r) => (
                                      <button
                                        key={r.emoji}
                                        type="button"
                                        className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:scale-110 flex items-center justify-center text-xs transition-all cursor-pointer shadow-2xs"
                                        title={r.label}
                                        onClick={() => handleAddCommentEmoji(post._id, r.emoji)}
                                      >
                                        {r.emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Comment Input */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all text-slate-800"
                                    value={commentInputs[post._id] || ""}
                                    onChange={(e) => handleCommentChange(post._id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") submitComment(post._id);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm active:scale-95"
                                    onClick={() => submitComment(post._id)}
                                  >
                                    <i className="fa-regular fa-paper-plane text-xs"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 max-w-md mx-auto my-8">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto mb-3">
                      <i className="fa-solid fa-compass"></i>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Your Crew Feed is Quiet</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Board new members from the suggestions list on the right to see their posts here!
                    </p>
                  </div>
                )}
              </div>
            </main>
            </div>

            {/* Section 2: Right Dashboard Column (Independent Scroll) */}
            <aside className="suggestions-column hidden xl:flex flex-col w-80 shrink-0 h-full overflow-y-auto py-6 space-y-5 scrollbar-none overscroll-contain">
              {/* Card 1: Upcoming Squads */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Upcoming Squads</h3>
                  <Link to="/squads" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                    See All <i className="fa-solid fa-chevron-right text-[9px]"></i>
                  </Link>
                </div>

                <div className="space-y-3.5">
                  {/* Item 1: Goa Trip */}
                  <div className="flex items-center justify-between gap-2.5 group cursor-pointer" onClick={() => navigate("/squads")}>
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=150&auto=format&fit=crop&q=80"
                        alt="Goa Trip"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                          Goa Trip 🌴
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">12 - 16 Dec, 2026</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-50 text-pink-500 shrink-0 whitespace-nowrap">
                      3 days left
                    </span>
                  </div>

                  {/* Item 2: Studio Session */}
                  <div className="flex items-center justify-between gap-2.5 group cursor-pointer" onClick={() => navigate("/squads")}>
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=150&auto=format&fit=crop&q=80"
                        alt="Studio Session"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                          Studio Session 🎙️
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">Tomorrow • 4:00 PM</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 shrink-0 whitespace-nowrap">
                      Tomorrow
                    </span>
                  </div>

                  {/* Item 3: Cricket Match */}
                  <div className="space-y-2 group cursor-pointer" onClick={() => navigate("/squads")}>
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80"
                          alt="Cricket Match"
                          className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                            Cricket Match 🏏
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">25 Dec • 6:00 PM</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 shrink-0 whitespace-nowrap">
                        12 days left
                      </span>
                    </div>

                    {/* Member Avatar Stack */}
                    <div className="flex items-center pl-13">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <img
                          className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover"
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                          alt="Avatar 1"
                        />
                        <img
                          className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover"
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                          alt="Avatar 2"
                        />
                        <img
                          className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover"
                          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                          alt="Avatar 3"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 ml-1.5">+12</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Happening in Your World */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Happening in Your World</h3>
                  <button type="button" className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer">
                    <i className="fa-solid fa-ellipsis text-xs"></i>
                  </button>
                </div>

                <div className="space-y-3.5">
                  {/* Nearby Crew Mates */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-location-arrow text-xs"></i>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">2 crew mates are nearby</span>
                      <span className="text-[11px] text-slate-400 block truncate">at Goa Beach, Panaji</span>
                    </div>
                  </div>

                  {/* Active Squad Chat */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-tower-broadcast text-xs"></i>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">Active Squad Chat</span>
                        <span className="text-[11px] text-slate-400 block truncate">Goa Travelers • 18 members</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/chats")}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      Join
                    </button>
                  </div>

                  {/* New Boarding Request */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-user-plus text-xs"></i>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">New crew request</span>
                        <span className="text-[11px] text-slate-400 block truncate">Design Squad • 3.2K members</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/chats")}
                      className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Suggested for You */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Suggested for You</h3>
                  <Link to="/search" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                    See All <i className="fa-solid fa-chevron-right text-[9px]"></i>
                  </Link>
                </div>

                <div className="space-y-3.5">
                  {/* Mockup Suggested Crew 1 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src="https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=150&auto=format&fit=crop&q=80"
                        alt="Travel Photographers"
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">Travel Photographers</span>
                        <span className="text-[11px] text-slate-400 block truncate">Public Crew • 8.1K members</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/search")}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      Join
                    </button>
                  </div>

                  {/* Mockup Suggested Crew 2 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150&auto=format&fit=crop&q=80"
                        alt="Backpackers Club"
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">Backpackers Club</span>
                        <span className="text-[11px] text-slate-400 block truncate">Public Crew • 14.5K members</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/search")}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      Join
                    </button>
                  </div>

                  {/* Live Suggestions from Backend */}
                  {suggestions.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={s.profilePhoto || Profile1}
                          alt={s.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                            {s.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">@{s.userName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                          boardedUsers[s.userId] === "boarded"
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : boardedUsers[s.userId] === "requested"
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300"
                            : "bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600"
                        }`}
                        onClick={() => toggleBoardUser(s.userId)}
                      >
                        {boardedUsers[s.userId] === "boarded" ? (
                          <>
                            <i className="fa-solid fa-check text-[9px]"></i>
                            <span>Boarded</span>
                          </>
                        ) : boardedUsers[s.userId] === "requested" ? (
                          <>
                            <i className="fa-regular fa-clock text-[9px]"></i>
                            <span>Sent</span>
                          </>
                        ) : (
                          "Board"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="text-xs text-slate-400 space-y-1.5 px-2 pb-6 shrink-0">
                <p>&copy; {new Date().getFullYear()} OnBoard. All rights reserved.</p>
                <p>
                  Crafted for{" "}
                  <Link to="/developer" className="text-indigo-600 font-semibold hover:underline">
                    Digvijay Singh
                  </Link>
                </p>
                <div className="flex gap-2 text-[11px] text-slate-500 pt-1">
                  <Link to="/privacy-policy" className="hover:text-indigo-600">Privacy Policy</Link>
                  <span>•</span>
                  <Link to="/blogs" className="hover:text-indigo-600">Blog</Link>
                  <span>•</span>
                  <Link to="/developer" className="hover:text-indigo-600">Developer</Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Create Post Modal Overlay */}
        {isCreatePostOpen && (
          <CreatePost onClose={() => setIsCreatePostOpen(false)} />
        )}

        {/* Report to Safety Modal */}
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setReportingTarget(null);
          }}
          targetType={reportingTarget?.targetType || "post"}
          targetId={reportingTarget?.targetId}
          targetName={reportingTarget?.targetName || "Post"}
        />

        {/* Share Post Modal Overlay */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSharingPost(null);
          }}
          post={sharingPost}
          onShareSuccess={handleShareSuccess}
        />

        <DeleteConfirmModal
          isOpen={!!postToDelete}
          onClose={() => setPostToDelete(null)}
          onConfirm={confirmDeletePost}
          isDeleting={isDeletingPost}
        />

        {/* Fullscreen Image Lightbox Modal */}
        {selectedLightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedLightboxImage(null)}
          >
            <button
              type="button"
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition-colors cursor-pointer border border-white/20"
              onClick={() => setSelectedLightboxImage(null)}
              title="Close (Esc)"
              aria-label="Close fullscreen"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div
              className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedLightboxImage.url}
                alt="Fullscreen preview"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              {selectedLightboxImage.caption && (
                <p className="mt-4 text-sm text-slate-200 text-center max-w-lg font-medium px-4">
                  {selectedLightboxImage.caption}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Feed;
