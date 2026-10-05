import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MemberBadge from "../components/MemberBadge";
import CommunityStandingBadge from "../components/CommunityStandingBadge";
import ReportModal from "../components/ReportModal";
import CrewFollowingModal from "../components/CrewFollowingModal";
import ChapterDetailModal from "../components/ChapterDetailModal";
import { downloadImage } from "../utils/downloadImage";
import { useSidebar } from "../context/SidebarContext";
import pulse from "../utils/pulseEngine";

const API_BASE = "http://localhost:3000/api";

const UserProfile = () => {
  const { isCollapsed } = useSidebar();
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [profileTab, setProfileTab] = useState("posts"); // "posts" | "chapters"
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [postComments, setPostComments] = useState({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingTarget, setReportingTarget] = useState(null);
  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [crewModalTab, setCrewModalTab] = useState("crew");

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}/profile/user/${id}`, {
        withCredentials: true,
      });
      setUser(res.data.user);
      if (res.data.user?.userId || id) {
        fetchUserChapters(res.data.user?.userId || id);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserChapters = async (targetUserId) => {
    try {
      const res = await axios.get(`${API_BASE}/chapters/user/${targetUserId}`, {
        withCredentials: true,
      });
      setChapters(res.data.chapters || []);
    } catch (err) {
      console.error("Failed to load user chapters:", err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  const handleToggleBoard = async () => {
    if (!user) return;
    const prevStatus = user.boardStatus || "none";
    const desiredAction =
      prevStatus === "requested"
        ? "cancel"
        : prevStatus === "boarded"
        ? "unboard"
        : "request";
    const optimisticStatus = desiredAction === "request" ? "requested" : "none";

    if (optimisticStatus === "requested") {
      pulse.boardRequested({ targetName: `@${user.userName}` });
    } else {
      pulse.boardRejected();
    }

    setUser((prev) => ({
      ...prev,
      boardStatus: optimisticStatus,
      isLocked: prev.isPrivate && optimisticStatus !== "boarded" && !prev.isSelf,
    }));

    try {
      setIsActionLoading(true);
      const res = await axios.post(
        `${API_BASE}/profile/${user.userId}/board`,
        { action: desiredAction },
        { withCredentials: true }
      );
      const newStatus = res.data.status;
      if (newStatus === "boarded") {
        pulse.boardAccepted({ targetName: `@${user.userName}` });
      }
      const finalStatus =
        newStatus === "cancelled" || newStatus === "unboarded"
          ? "none"
          : newStatus;

      setUser((prev) => ({
        ...prev,
        boardStatus: finalStatus,
        isLocked: prev.isPrivate && finalStatus !== "boarded" && !prev.isSelf,
      }));

      // Re-fetch profile if newly boarded so locked posts unlock automatically
      if (finalStatus === "boarded") {
        fetchUserProfile();
      }
    } catch (err) {
      console.error("Board toggle failed:", err);
      setUser((prev) => ({
        ...prev,
        boardStatus: prevStatus,
        isLocked: prev.isPrivate && prevStatus !== "boarded" && !prev.isSelf,
      }));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSavePost = async (postId) => {
    try {
      const res = await axios.post(
        `${API_BASE}/posts/${postId}/bookmark`,
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

  const handleLikePost = async (postId) => {
    try {
      pulse.like();
      const res = await axios.post(
        `${API_BASE}/posts/${postId}/like`,
        {},
        { withCredentials: true }
      );
      const updatedPost = res.data.post;
      setUser((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p._id === postId ? updatedPost : p)),
      }));
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(updatedPost);
      }
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await axios.post(
        `${API_BASE}/posts/${postId}/comment`,
        { text: text.trim() },
        { withCredentials: true }
      );
      const updatedPost = res.data.post;
      setUser((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p._id === postId ? updatedPost : p)),
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(updatedPost);
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      <main className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
      }`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden text-slate-700 text-lg p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            {user && (
              <>
                <span className="font-bold text-slate-800">@{user.userName}</span>
                <span className="text-slate-300">•</span>
                {user.isPrivate ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                    <i className="fa-solid fa-lock text-[9px]"></i> Private
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                    <i className="fa-solid fa-globe text-[9px]"></i> Public
                  </span>
                )}
              </>
            )}
          </div>
        </header>

        {/* Content View */}
        <div className="p-3 sm:p-5 max-w-3xl mx-auto w-full flex-1 flex flex-col">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Loading crew profile...</p>
            </div>
          ) : !user ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-xs my-auto flex flex-col items-center">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-xl mb-3">
                <i className="fa-solid fa-user-slash"></i>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Profile Not Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
                This member may have changed their username or their account is unavailable.
              </p>
              <Link
                to="/search"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-xs transition-all"
              >
                Explore Other Crew Members
              </Link>
            </div>
          ) : (
            <>
              {/* ── COMPACT MODERN SOCIAL PROFILE HERO CARD ── */}
              {/* ── COMPACT MODERN SOCIAL PROFILE HERO CARD ── */}
              <div className={`bg-white rounded-2xl border shadow-xs p-4 sm:p-6 mb-5 transition-all ${
                user.cabinTheme === "gold"
                  ? "border-amber-300 ring-2 ring-amber-400/25 shadow-amber-500/10 shadow-lg"
                  : user.cabinTheme === "violet"
                  ? "border-purple-300 ring-2 ring-purple-400/25 shadow-purple-500/10 shadow-lg"
                  : user.cabinTheme === "cyan"
                  ? "border-cyan-300 ring-2 ring-cyan-400/25 shadow-cyan-500/10 shadow-lg"
                  : user.cabinTheme === "rose"
                  ? "border-rose-300 ring-2 ring-rose-400/25 shadow-rose-500/10 shadow-lg"
                  : user.cabinTheme === "emerald"
                  ? "border-emerald-300 ring-2 ring-emerald-400/25 shadow-emerald-500/10 shadow-lg"
                  : "border-slate-200/80"
              }`}>
                {/* Top Row: Avatar + Info + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={user.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt={user.userName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-indigo-600/10 shadow-xs bg-white"
                      />
                      {user.boardStatus === "boarded" && (
                        <span
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white shadow-xs"
                          title="Connected Crew Member"
                        >
                          <i className="fa-solid fa-check"></i>
                        </span>
                      )}
                    </div>

                    {/* Name & Handle */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                          {user.name}
                        </h2>
                        <MemberBadge tier={user.membershipTier} size="md" showLabel={true} />
                        {user.isOfficialVerified && (
                          <span
                            className="inline-flex items-center text-indigo-600 text-sm"
                            title="Official Verified Tick"
                          >
                            <i className="fa-solid fa-circle-check"></i>
                          </span>
                        )}
                        <CommunityStandingBadge standing={user.communityStanding} trustScore={user.trustScore} />
                        {user.isPrivate && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200"
                            title="Private Profile"
                          >
                            <i className="fa-solid fa-lock text-[8px] text-slate-400"></i>
                            <span>Private</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <p className="text-xs sm:text-sm font-medium text-indigo-600 truncate">
                          @{user.userName}
                        </p>
                        {user.vipFlair && (
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full shadow-xs">
                            ✨ {user.vipFlair}
                          </span>
                        )}
                      </div>

                      {user.mutualCount > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <i className="fa-solid fa-user-group text-[8px]"></i>
                            {user.mutualCount} mutual crew
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {user.isSelf ? (
                      <Link
                        to="/my-profile"
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-all border border-indigo-200 flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                        <span>Edit Profile</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/chats"
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-200 flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-comments text-[11px] text-slate-500"></i>
                          <span>Message</span>
                        </Link>

                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={handleToggleBoard}
                          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            user.boardStatus === "boarded"
                              ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200"
                              : user.boardStatus === "requested"
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                              : user.boardStatus === "incoming_request"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                          }`}
                        >
                          {isActionLoading ? (
                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          ) : user.boardStatus === "boarded" ? (
                            <>
                              <i className="fa-solid fa-check text-[10px]"></i>
                              <span>OnBoarded</span>
                            </>
                          ) : user.boardStatus === "requested" ? (
                            <>
                              <i className="fa-solid fa-clock text-[10px]"></i>
                              <span>Requested</span>
                            </>
                          ) : user.boardStatus === "incoming_request" ? (
                            <>
                              <i className="fa-solid fa-user-check text-[10px]"></i>
                              <span>Accept</span>
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-user-plus text-[10px]"></i>
                              <span>Board Crew</span>
                            </>
                          )}
                        </button>

                        {/* Report to Safety Crew Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setReportingTarget({
                              targetType: "user",
                              targetId: user.userId || user.profileId,
                              targetName: `@${user.userName} (${user.name})`,
                            });
                            setIsReportModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs font-semibold rounded-xl transition-all border border-slate-200 hover:border-rose-200 flex items-center gap-1 cursor-pointer"
                          title="Report to Safety Crew"
                        >
                          <i className="fa-solid fa-flag text-[10px]"></i>
                          <span>Report</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Middle: Bio */}
                <div className="pt-3">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {user.bio || "Member of the OnBoard community ✨"}
                  </p>

                  {/* Badges (Pronouns, Gender, Birthday, Public Contact) */}
                  {(user.pronouns || user.gender || user.dob || user.contactEmail || user.contactPhone) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-500">
                      {user.pronouns && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium text-slate-600">
                          <i className="fa-solid fa-sparkles text-indigo-500 text-[9px]"></i>
                          <span>{user.pronouns}</span>
                        </span>
                      )}
                      {user.gender && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium text-slate-600 capitalize">
                          <i className="fa-solid fa-user text-slate-400 text-[9px]"></i>
                          <span>{user.gender}</span>
                        </span>
                      )}
                      {user.dob && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-full font-medium">
                          <i className="fa-solid fa-cake-candles text-amber-600 text-[9px]"></i>
                          <span>{user.dob}</span>
                        </span>
                      )}
                      {user.contactEmail && (
                        <a
                          href={`mailto:${user.contactEmail}`}
                          className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:underline px-2.5 py-0.5 rounded-full font-medium"
                        >
                          <i className="fa-solid fa-envelope text-[9px]"></i>
                          <span>{user.contactEmail}</span>
                        </a>
                      )}
                      {user.contactPhone && (
                        <a
                          href={`tel:${user.contactPhone}`}
                          className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:underline px-2.5 py-0.5 rounded-full font-medium"
                        >
                          <i className="fa-solid fa-phone text-[9px]"></i>
                          <span>{user.contactPhone}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Compact Stats Bar */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-around sm:justify-start sm:gap-8 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-sm">{user.postCount || 0}</span>
                    <span className="text-slate-500 text-[11px]">Posts</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCrewModalTab("crew");
                      setCrewModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors group text-left"
                    title="View this member's Crew"
                  >
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 text-sm transition-colors">{user.friendsCount || 0}</span>
                    <span className="text-slate-500 group-hover:text-indigo-600 text-[11px] transition-colors">Crew</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCrewModalTab("following");
                      setCrewModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors group text-left"
                    title="View connections & mutual members"
                  >
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 text-sm transition-colors">{user.mutualCount || 0}</span>
                    <span className="text-slate-500 group-hover:text-indigo-600 text-[11px] transition-colors">Mutual</span>
                  </button>
                </div>
              </div>

              {/* ── POSTS & CHAPTERS GALLERY / PRIVACY LOCK ── */}
              <div>
                {/* Case 1: Account is Private & User is Locked out */}
                {user.isLocked ? (
                  <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/80 shadow-xs flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center text-2xl mb-4 shadow-inner">
                      <i className="fa-solid fa-lock text-slate-500"></i>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                      This Account is Private
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                      Connect with @{user.userName} to see their photos and posts.
                    </p>

                    {user.boardStatus === "none" && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={handleToggleBoard}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <i className="fa-solid fa-user-plus"></i>
                        <span>Board @{user.userName}</span>
                      </button>
                    )}

                    {user.boardStatus === "requested" && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                        <i className="fa-solid fa-clock"></i>
                        <span>Request Pending Approval</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Tab Selector: Posts vs Chapters */}
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-6">
                        <button
                          type="button"
                          onClick={() => setProfileTab("posts")}
                          className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${
                            profileTab === "posts"
                              ? "text-indigo-600 border-indigo-600 font-extrabold"
                              : "text-slate-400 border-transparent hover:text-slate-600"
                          }`}
                        >
                          <i className="fa-solid fa-images text-sm"></i>
                          <span>Posts ({user.posts?.length || 0})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileTab("chapters")}
                          className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${
                            profileTab === "chapters"
                              ? "text-indigo-600 border-indigo-600 font-extrabold"
                              : "text-slate-400 border-transparent hover:text-slate-600"
                          }`}
                        >
                          <i className="fa-solid fa-book-bookmark text-sm"></i>
                          <span>Chapters ({chapters.length})</span>
                        </button>
                      </div>
                    </div>

                    {profileTab === "chapters" ? (
                      chapters.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {chapters.map((chap) => (
                            <div
                              key={chap._id}
                              onClick={() => setSelectedChapter(chap)}
                              className="group relative min-h-[200px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-end p-5"
                            >
                              {chap.coverImage ? (
                                <img
                                  src={chap.coverImage}
                                  alt={chap.title}
                                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-900 opacity-90"></div>
                              )}
                              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                                <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center justify-center text-base shadow-sm">
                                  {chap.emoji || "📖"}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-black/40 backdrop-blur-md text-white rounded-full border border-white/20">
                                  {chap.posts?.length || 0} Photos
                                </span>
                              </div>
                              <div className="relative z-10">
                                {chap.timeframe && (
                                  <span className="inline-block text-[10px] font-bold text-indigo-200 mb-1">
                                    🗓️ {chap.timeframe}
                                  </span>
                                )}
                                <h4 className="text-base font-extrabold text-white leading-tight drop-shadow-sm group-hover:text-indigo-200 transition-colors">
                                  {chap.title}
                                </h4>
                                {chap.description && (
                                  <p className="text-xs text-slate-300 line-clamp-1 mt-0.5 font-normal">
                                    {chap.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs flex flex-col items-center">
                          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mb-3">
                            <i className="fa-solid fa-book-bookmark"></i>
                          </div>
                          <h4 className="text-base font-bold text-slate-800 mb-1">No Chapters Yet</h4>
                          <p className="text-xs text-slate-500 max-w-sm">
                            @{user.userName} hasn't shared any life chapters yet.
                          </p>
                        </div>
                      )
                    ) : user.posts?.length === 0 ? (
                      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs flex flex-col items-center">
                        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mb-3">
                          <i className="fa-regular fa-image"></i>
                        </div>
                        <h4 className="text-base font-bold text-slate-800 mb-1">No Posts Yet</h4>
                        <p className="text-xs text-slate-500 max-w-sm">
                          When @{user.userName} shares photos or stories, they will appear here in their cabin feed.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {user.posts.map((post) => (
                          <div
                            key={post._id}
                            onClick={() => setSelectedPost(post)}
                            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 cursor-pointer group shadow-xs border border-slate-200/60"
                          >
                            <img
                              src={post.image}
                              alt={post.caption || "Post"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white text-xs font-bold backdrop-blur-[2px]">
                              <span className="flex items-center gap-1.5">
                                <i className="fa-solid fa-heart text-rose-500"></i>
                                {post.likes?.length || 0}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <i className="fa-solid fa-comment text-white"></i>
                                {post.comments?.length || 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── POST LIGHTBOX MODAL ── */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Image */}
            <div className="md:w-3/5 bg-black flex items-center justify-center">
              <img
                src={selectedPost.image}
                alt={selectedPost.caption || "Post"}
                className="max-h-[60vh] md:max-h-[85vh] w-full object-contain"
              />
            </div>

            {/* Right: Details & Comments */}
            <div className="md:w-2/5 flex flex-col h-full bg-white">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={user?.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={user?.userName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{user?.name}</h4>
                    <p className="text-[10px] text-indigo-600 font-semibold">@{user?.userName}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Caption & Comments List */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
                {selectedPost.caption && (
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-slate-800 leading-relaxed">{selectedPost.caption}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(selectedPost.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Comments ({selectedPost.comments?.length || 0})
                  </span>

                  {selectedPost.comments?.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No comments yet. Say something!</p>
                  ) : (
                    selectedPost.comments?.map((c, i) => (
                      <div key={i} className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="font-bold text-slate-800 mr-1.5">{c.author || "Crew"}:</span>
                        <span className="text-slate-700">{c.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleLikePost(selectedPost._id)}
                      className="text-slate-700 hover:text-rose-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <i className="fa-solid fa-heart text-sm text-rose-500"></i>
                      <span>{selectedPost.likes?.length || 0} likes</span>
                    </button>

                    {selectedPost.image && (
                      <button
                        type="button"
                        onClick={() => downloadImage(selectedPost.image, `onboard-post-${selectedPost._id}.jpg`)}
                        className="text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                        title="Download Photo to Device"
                      >
                        <i className="fa-solid fa-arrow-down-to-bracket text-sm"></i>
                        <span>Download</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSavePost(selectedPost._id)}
                    className="text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                    title={savedPosts[selectedPost._id] ? "Saved to your bookmarks" : "Save to bookmarks"}
                  >
                    <i
                      className={
                        savedPosts[selectedPost._id]
                          ? "fa-solid fa-bookmark text-indigo-600 text-sm"
                          : "fa-regular fa-bookmark text-sm text-slate-500"
                      }
                    ></i>
                    <span className={savedPosts[selectedPost._id] ? "text-indigo-600 font-bold" : ""}>
                      {savedPosts[selectedPost._id] ? "Saved" : "Save"}
                    </span>
                  </button>
                </div>

                {/* Comment input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddComment(selectedPost._id);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={commentInputs[selectedPost._id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [selectedPost._id]: e.target.value }))
                    }
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 text-xs rounded-full border border-slate-200 bg-white focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportingTarget(null);
        }}
        targetType={reportingTarget?.targetType || "user"}
        targetId={reportingTarget?.targetId}
        targetName={reportingTarget?.targetName || "Member"}
      />

      {/* Crew & Following Overlay Modal */}
      <CrewFollowingModal
        isOpen={crewModalOpen}
        onClose={() => setCrewModalOpen(false)}
        initialTab={crewModalTab}
        targetIdentifier={user?.userId || id}
        isOwnProfile={false}
        onCountChange={() => fetchUserProfile()}
      />

      {/* Chapter Detail / Photo Album Modal */}
      <ChapterDetailModal
        isOpen={!!selectedChapter}
        chapter={selectedChapter}
        isOwner={user?.isSelf || false}
        onClose={() => setSelectedChapter(null)}
        userPosts={user?.posts || []}
        onSelectPost={(post) => {
          setSelectedChapter(null);
          setSelectedPost(post);
        }}
        onChapterDeleted={(chapId) => {
          setChapters((prev) => prev.filter((c) => c._id !== chapId));
          setSelectedChapter(null);
        }}
        onChapterUpdated={(updatedChap) => {
          setSelectedChapter(updatedChap);
          setChapters((prev) =>
            prev.map((c) => (c._id === updatedChap._id ? updatedChap : c))
          );
        }}
      />
    </div>
  );
};

export default UserProfile;
