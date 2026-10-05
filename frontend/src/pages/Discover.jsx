import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ReelPlayerModal from "../components/ReelPlayerModal";
import ExplorePostModal from "../components/ExplorePostModal";
import InterestCustomizerModal from "../components/InterestCustomizerModal";
import SquadDetailModal from "../components/SquadDetailModal";
import { scrollToTop } from "../utils/scrollToTop";
import { overlayCard } from "../context/OverlayCardContext";
import { useSidebar } from "../context/SidebarContext";

const CATEGORIES = [
  { id: "all", label: "All Trending", icon: "🔥" },
  { id: "reels_only", label: "Top Waves", icon: "🌊" },
  { id: "tech", label: "Tech & Dev", icon: "💻" },
  { id: "comedy", label: "Comedy & Memes", icon: "😂" },
  { id: "travel", label: "Travel & Wander", icon: "✈️" },
  { id: "fitness", label: "Fitness & Gym", icon: "🏋️" },
  { id: "art", label: "Art & Design", icon: "🎨" },
  { id: "food", label: "Foodie & Cafe", icon: "🍔" },
  { id: "music", label: "Music & Beats", icon: "🎧" },
  { id: "gaming", label: "Gaming & Esports", icon: "🎮" },
  { id: "fashion", label: "Fashion & Style", icon: "👗" },
  { id: "nature", label: "Nature & Peace", icon: "🌿" },
  { id: "lifestyle", label: "Lifestyle", icon: "✨" },
];

const Discover = () => {
  const { isCollapsed } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialQuery = searchParams.get("q") || "";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState("all"); // 'all' | 'reels' | 'posts'
  const [sortBy, setSortBy] = useState("trending"); // 'trending' | 'top-views' | 'recent'

  const [topReels, setTopReels] = useState([]);
  const [similarInterestsPosts, setSimilarInterestsPosts] = useState([]);
  const [exploreGrid, setExploreGrid] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [activeReelIndex, setActiveReelIndex] = useState(null);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [activePhotoPost, setActivePhotoPost] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [recommendedSquads, setRecommendedSquads] = useState([]);
  const [selectedSquadId, setSelectedSquadId] = useState(null);
  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);

  // Hover preview video reference
  const hoveredVideoRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Sync category & query with URL params
  useEffect(() => {
    const cat = searchParams.get("category") || "all";
    const q = searchParams.get("q") || "";
    setSelectedCategory(cat);
    setSearchQuery(q);
  }, [searchParams]);

  // Fetch Discover Content
  const fetchDiscoverContent = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all" && selectedCategory !== "reels_only") {
        params.append("category", selectedCategory);
      }
      if (viewMode === "reels" || selectedCategory === "reels_only") {
        params.append("type", "reels");
      } else if (viewMode === "posts") {
        params.append("type", "posts");
      }
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }
      if (sortBy) {
        params.append("sort", sortBy);
      }

      const res = await axios.get(
        `http://localhost:3000/api/posts/discover?${params.toString()}`,
        { withCredentials: true }
      );

      setTopReels(res.data.topReels || []);
      setSimilarInterestsPosts(res.data.similarInterestsPosts || []);
      setExploreGrid(res.data.exploreGrid || []);
      setUserInterests(res.data.userInterests || []);
      setTrendingTags(res.data.trendingTags || []);
      if (res.data.currentUserProfile) {
        setCurrentProfile(res.data.currentUserProfile);
      }
    } catch (err) {
      console.error("Failed to load discover content:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoverContent();
  }, [selectedCategory, viewMode, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscoverContent();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchRecommendedSquads = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/squads?filter=recommended", {
        withCredentials: true,
      });
      setRecommendedSquads(res.data.squads || []);
    } catch (err) {
      console.error("Error fetching recommended squads:", err);
    }
  };

  useEffect(() => {
    fetchRecommendedSquads();
  }, [selectedCategory]);

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    if (catId === "reels_only") {
      setViewMode("reels");
    } else if (viewMode === "reels" && catId !== "reels_only") {
      setViewMode("all");
    }
    const nextParams = new URLSearchParams(searchParams);
    if (catId === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", catId);
    }
    setSearchParams(nextParams);
    scrollToTop();
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const nextParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      nextParams.set("q", val);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("q");
    setSearchParams(nextParams);
  };

  // Open Reels modal with list of all reels
  const openReelModalAt = (reelId) => {
    // Collect all unique reels across topReels and exploreGrid
    const allReelsMap = new Map();
    topReels.forEach((r) => allReelsMap.set(r._id.toString(), r));
    exploreGrid.forEach((item) => {
      if (item.isReel || item.mediaType === "reel" || item.videoUrl) {
        allReelsMap.set(item._id.toString(), item);
      }
    });

    const reelsList = Array.from(allReelsMap.values());
    const index = reelsList.findIndex((r) => r._id.toString() === reelId.toString());

    if (index !== -1) {
      setActiveReelIndex(index);
    } else {
      // If not in reels list, prepend it
      const target = exploreGrid.find((p) => p._id.toString() === reelId.toString());
      if (target) {
        reelsList.unshift(target);
        setActiveReelIndex(0);
      }
    }
    setIsReelModalOpen(true);
  };

  // Open Photo Post Modal
  const openPhotoPostModal = (post) => {
    setActivePhotoPost(post);
    setIsPhotoModalOpen(true);
  };

  // Handle Post Click (decides Reel or Photo)
  const handleItemClick = (item) => {
    if (item.isReel || item.mediaType === "reel" || (item.videoUrl && item.videoUrl.length > 0)) {
      openReelModalAt(item._id);
    } else {
      openPhotoPostModal(item);
    }
  };

  // Record view on item interaction
  const handleRecordView = async (postId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/posts/${postId}/view`,
        {},
        { withCredentials: true }
      );
    } catch {
      // Silently catch view recording errors
    }
  };

  // Toggle Like from modal or grid
  const handleToggleLike = async (postId) => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/posts/${postId}/like`,
        {},
        { withCredentials: true }
      );
      const updated = res.data.post;

      // Update state in exploreGrid and topReels
      setExploreGrid((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, ...updated, isLiked: !p.isLiked } : p))
      );
      setTopReels((prev) =>
        prev.map((r) => (r._id === postId ? { ...r, ...updated, isLiked: !r.isLiked } : r))
      );
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (postId) => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/posts/${postId}/bookmark`,
        {},
        { withCredentials: true }
      );
      setExploreGrid((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, isSaved: res.data.isSaved } : p))
      );
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    }
  };

  // Format large numbers for views
  const formatViews = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  // Build full list of reels for ReelPlayerModal
  const allReelsForModal = (() => {
    const map = new Map();
    topReels.forEach((r) => map.set(r._id.toString(), r));
    exploreGrid.forEach((item) => {
      if (item.isReel || item.mediaType === "reel" || (item.videoUrl && item.videoUrl.length > 0)) {
        map.set(item._id.toString(), item);
      }
    });
    return Array.from(map.values());
  })();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Docked Sidebar on Desktop, Drawer on Mobile */}
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      <main className={`flex-1 min-w-0 min-h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
      }`}>
        {/* Sticky Glassmorphic Top Bar */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-3 flex flex-col gap-2.5 shadow-xs w-full min-w-0">
          <div className="flex items-center justify-between gap-3 w-full">
            {/* Left Title & Mobile Hamburger */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                className="lg:hidden text-slate-700 text-lg p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={toggleSidebar}
                aria-label="Toggle Sidebar"
              >
                <i className="fa-solid fa-bars"></i>
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                  <i className="fa-solid fa-compass text-base animate-pulse"></i>
                </div>
                <div>
                  <h1 className="text-xl font-black bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent tracking-tight">
                    Discover
                  </h1>
                </div>
              </div>
            </div>

            {/* Middle Search Input */}
            <div className="flex-1 max-w-md relative hidden sm:block min-w-0">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search waves, creator tags, #coding, #travel..."
                className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 text-xs font-medium pl-9 pr-9 py-2.5 rounded-2xl border border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Clear Search"
                >
                  <i className="fa-solid fa-circle-xmark text-xs"></i>
                </button>
              )}
            </div>

            {/* Right Action: Taste Horizons & View Mode Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Taste Profile Horizon Button */}
              <button
                type="button"
                onClick={() => setIsInterestModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer border border-indigo-200/60 shadow-xs"
                title="Customize recommendation algorithm"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                <span className="hidden sm:inline">My Taste</span>
              </button>

              {/* View Mode Toggle: All / Waves / Photos */}
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-0.5 sm:gap-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setViewMode("all")}
                  className={`p-1.5 px-2 sm:px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "all"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Explore Grid"
                >
                  <i className="fa-solid fa-table-cells sm:mr-1"></i>
                  <span className="hidden xl:inline">Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("reels")}
                  className={`p-1.5 px-2 sm:px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "reels"
                      ? "bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Waves Only"
                >
                  <i className="fa-solid fa-water sm:mr-1 text-[10px]"></i>
                  <span className="hidden xl:inline">Waves</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("posts")}
                  className={`p-1.5 px-2 sm:px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "posts"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Photos Only"
                >
                  <i className="fa-regular fa-image sm:mr-1"></i>
                  <span className="hidden xl:inline">Photos</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar Input */}
          <div className="relative sm:hidden w-full">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search waves, tags, creators..."
              className="w-full bg-slate-100 text-slate-800 text-xs pl-8 pr-8 py-2 rounded-xl border border-transparent focus:border-indigo-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                <i className="fa-solid fa-circle-xmark text-xs"></i>
              </button>
            )}
          </div>

          {/* Category / Interest Pills Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar w-full max-w-full min-w-0">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                    isActive
                      ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/70"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Discover Content Feed */}
        <div className="flex-1 px-4 sm:px-6 py-6 w-full space-y-8 min-w-0">
          
          {/* SECTION 1: 🔥 Top Viewed Reels Shelf (Instagram Reels Highlight Carousel) */}
          {(viewMode === "all" || viewMode === "reels") && !searchQuery.trim() && topReels.length > 0 && (
            <section className="space-y-3.5 w-full max-w-full min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  {/* <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span> */}
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 truncate">
                    {/* <span>Top Viewed Waves</span> */}
                    <span className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
                      Trending Now
                    </span>
                  </h2>
                </div>
              </div>

              {/* Horizontal Reels Carousel — breaks out of parent padding for edge-to-edge scroll */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar w-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                {topReels.map((reel, idx) => {
                  const author = reel.profile || {};
                  return (
                    <div
                      key={reel._id}
                      onClick={() => openReelModalAt(reel._id)}
                      className="group relative shrink-0 w-44 sm:w-52 aspect-[9/16] rounded-3xl overflow-hidden bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer snap-start border border-slate-800 hover:-translate-y-1"
                    >
                      {/* Video or Thumbnail */}
                      <img
                        src={reel.thumbnailUrl || reel.image}
                        alt="Wave thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 group-hover:from-black/95 transition-colors"></div>

                      {/* Top Rank Badge & Views Counter */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-md flex items-center gap-1 ${
                          idx === 0 
                            ? "bg-gradient-to-r from-amber-400 to-orange-500" 
                            : idx === 1 
                            ? "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-900" 
                            : "bg-black/50 backdrop-blur-md border border-white/20"
                        }`}>
                          <i className="fa-solid fa-fire text-[9px]"></i> #{idx + 1}
                        </span>
{/* 
                        <span className="text-[11px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 shadow-xs">
                          <i className="fa-solid fa-play text-[9px] text-pink-400"></i>
                          {formatViews(reel.viewsCount)}
                        </span> */}
                      </div>

                      {/* Center Play Icon on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-lg shadow-xl scale-90 group-hover:scale-100 transition-transform">
                          <i className="fa-solid fa-play pl-0.5"></i>
                        </div>
                      </div>

                      {/* Bottom Info Row */}
                      {/* <div className="absolute bottom-3 inset-x-3 z-10 text-white space-y-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={author.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"}
                            alt={author.userName || "Creator"}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-white/40"
                          />
                          <span className="font-bold text-xs truncate text-white/90">
                            @{author.userName || "creator"}
                          </span>
                        </div>

                        <p className="text-[11px] text-white/80 line-clamp-2 leading-snug font-medium">
                          {reel.caption}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-white/60 pt-1 border-t border-white/10">
                          <span className="flex items-center gap-1 truncate max-w-[110px]">
                            <i className="fa-solid fa-music text-[9px] text-indigo-400"></i>
                            <span className="truncate">{reel.audioTrack || "Original Audio"}</span>
                          </span>
                          <span className="flex items-center gap-1 text-rose-300 font-bold">
                            <i className="fa-solid fa-heart text-[9px]"></i>
                            {formatViews(reel.likeCount || reel.likes?.length || 0)}
                          </span>
                        </div>
                      </div> */}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 1.5: ⚓ Recommended Squads & Communities (Interest-based recommendation feed) */}
          {recommendedSquads.length > 0 && !searchQuery.trim() && (
            <section className="space-y-3.5 w-full max-w-full min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 truncate">
                    <span>Recommended Squads</span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full shrink-0">
                      Similar Interests
                    </span>
                  </h2>
                </div>

                <Link
                  to="/squads"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
                >
                  <span>Explore all</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </div>

              {/* Horizontal Scroll Shelf */}
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                {recommendedSquads.slice(0, 6).map((squad) => (
                  <div
                    key={squad._id}
                    onClick={() => {
                      setSelectedSquadId(squad._id);
                      setIsSquadModalOpen(true);
                    }}
                    className="shrink-0 w-64 bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <img
                          src={squad.avatar || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80"}
                          alt={squad.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {squad.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            @{squad.handle}
                          </span>
                        </div>
                      </div>

                      {squad.tagline && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug mb-2.5">
                          {squad.tagline}
                        </p>
                      )}

                      {squad.categoryTags && squad.categoryTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {squad.categoryTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        {squad.membersCount} crew
                      </span>
                      <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        <span>Board</span>
                        <i className="fa-solid fa-chevron-right text-[9px]"></i>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: 🎯 Based on Your Interests Highlight Strip */}
          {userInterests.length > 0 && selectedCategory === "all" && !searchQuery.trim() && (
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <i className="fa-solid fa-wand-magic-sparkles"></i> Personalized For You
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                    Tuned to your taste:{" "}
                    <span className="text-pink-300">
                      {userInterests.slice(0, 3).map((t) => `#${t}`).join(" ")}
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200/80 max-w-xl">
                    Our zero-budget attention engine matches high-performing content with your horizon preferences.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsInterestModalOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-indigo-900 hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer"
                  >
                    Adjust Interests
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: 📱 Iconic Instagram Asymmetric Explore Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Explore Feed</span>
                {/* <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {exploreGrid.length} items
                </span> */}
              </h2>

              {/* Sorting Filter */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="trending">🔥 Trending Algorithmic</option>
                  <option value="top-views">👁️ Highest Views</option>
                  <option value="recent">⏱️ Most Recent</option>
                </select>
              </div>
            </div>

            {/* Empty State */}
            {!isLoading && exploreGrid.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/70 shadow-xs flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-2xl">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No discover items found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  We couldn't find any posts or waves matching "{searchQuery}". Try searching for another topic or clear the filter.
                </p>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Loading Shimmer Skeletons */}
            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl sm:rounded-3xl bg-slate-200 animate-pulse ${
                      i % 5 === 0 ? "row-span-2 aspect-[9/16]" : "aspect-square"
                    }`}
                  ></div>
                ))}
              </div>
            )}

            {/* The Grid: 3-column Asymmetric Explore Layout */}
            {!isLoading && exploreGrid.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3.5 auto-rows-[160px] sm:auto-rows-[220px] md:auto-rows-[260px] grid-flow-dense">
                {exploreGrid.map((item, idx) => {
                  const isReel = item.isReel || item.mediaType === "reel" || (item.videoUrl && item.videoUrl.length > 0);
                  
                  // Make every 6th item a tall 2-row card, or if it's explicitly a reel in standard grid
                  const isTallReelCard = isReel && (idx % 5 === 0 || idx % 7 === 0);

                  const author = item.profile || {};

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleItemClick(item)}
                      className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 shadow-xs hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-200/40 ${
                        isTallReelCard ? "row-span-2" : "row-span-1"
                      }`}
                    >
                      {/* Image / Thumbnail */}
                      <img
                        src={item.thumbnailUrl || item.image}
                        alt={item.caption || "Discover post"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Wave Media Icon Badge (Top Right) */}
                      {isReel && (
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
                          <i className="fa-solid fa-water text-[9px] text-pink-400"></i>
                          <span>Wave</span>
                        </div>
                      )}

                      {/* Views Badge (Top Left for Waves) */}
                      {isReel && item.viewsCount > 0 && (
                        <div className="absolute top-2.5 left-2.5 z-10 text-white text-[11px] font-semibold bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                          <i className="fa-regular fa-eye mr-1"></i>
                          {formatViews(item.viewsCount)}
                        </div>
                      )}

                      {/* Hover Overlay with Instagram style metrics */}
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4 text-white z-20">
                        {/* Top Author Tag */}
                        <div className="flex items-center gap-2">
                          <img
                            src={author.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"}
                            alt={author.userName || "User"}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-white/50"
                          />
                          <span className="text-xs font-bold truncate">
                            @{author.userName || "creator"}
                          </span>
                        </div>

                        {/* Center Hover Stats */}
                        <div className="flex items-center justify-center gap-5 text-sm font-bold">
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-heart text-rose-500"></i>
                            {formatViews(item.likeCount || item.likes?.length || 0)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-comment text-indigo-400"></i>
                            {item.commentCount || item.comments?.length || 0}
                          </span>
                        </div>

                        {/* Bottom Caption & Tags */}
                        <div>
                          <p className="text-xs line-clamp-1 text-white/90 font-medium">
                            {item.caption}
                          </p>
                          {item.categoryTags && item.categoryTags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-300 font-semibold truncate">
                              #{item.categoryTags[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION 4: 🏷️ Popular Category Tags Bar */}
          {trendingTags.length > 0 && (
            <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-hashtag text-indigo-600"></i>
                <span>Trending Tags on OnBoard</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => handleCategorySelect(item.tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer border border-slate-200/60 flex items-center gap-1.5"
                  >
                    <span>#{item.tag}</span>
                    <span className="text-[10px] bg-white text-slate-400 px-1.5 py-0.2 rounded-full font-bold">
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      {/* Full-Screen Instagram Reel Player Modal */}
      <ReelPlayerModal
        isOpen={isReelModalOpen}
        reels={allReelsForModal}
        initialIndex={activeReelIndex || 0}
        onClose={() => setIsReelModalOpen(false)}
        onLike={handleToggleLike}
        onBookmark={handleToggleBookmark}
        onRecordView={handleRecordView}
        currentUserId={currentProfile?.user?._id || currentProfile?.user}
      />

      {/* Explore Photo Post Modal */}
      <ExplorePostModal
        isOpen={isPhotoModalOpen}
        post={activePhotoPost}
        onClose={() => setIsPhotoModalOpen(false)}
        onLike={handleToggleLike}
        onBookmark={handleToggleBookmark}
        onRecordView={handleRecordView}
        currentUserId={currentProfile?.user?._id || currentProfile?.user}
      />

      {/* Taste Profile Customizer Modal */}
      <InterestCustomizerModal
        isOpen={isInterestModalOpen}
        currentInterests={userInterests}
        onClose={() => setIsInterestModalOpen(false)}
        onSave={(newInterests) => {
          setUserInterests(newInterests);
          fetchDiscoverContent();
        }}
      />

      {/* Squad Community Detail Modal */}
      <SquadDetailModal
        isOpen={isSquadModalOpen}
        squadId={selectedSquadId}
        onClose={() => {
          setIsSquadModalOpen(false);
          setSelectedSquadId(null);
        }}
        onSquadUpdated={() => fetchRecommendedSquads()}
      />
    </div>
  );
};

export default Discover;
