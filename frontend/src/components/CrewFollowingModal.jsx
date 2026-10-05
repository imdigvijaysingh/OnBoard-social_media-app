import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CrewFollowingModal = ({
  isOpen,
  onClose,
  initialTab = "crew",
  targetIdentifier = "me",
  isOwnProfile = true,
  onCountChange,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [crewList, setCrewList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [messagingUserId, setMessagingUserId] = useState(null);
  const [messageToast, setMessageToast] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCrewData = async () => {
      setLoading(true);
      try {
        const idToFetch = targetIdentifier || "me";
        const res = await axios.get(
          `http://localhost:3000/api/profile/${idToFetch}/crew-members`,
          { withCredentials: true }
        );

        setCrewList(res.data.crew || []);
        setFollowingList(res.data.following || []);
      } catch (err) {
        console.error("Failed to load crew & following members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCrewData();
  }, [isOpen, targetIdentifier]);

  const showToast = (msg, type = "success") => {
    setMessageToast({ text: msg, type });
    setTimeout(() => setMessageToast(null), 3500);
  };

  // Toggle Board / Unboard (following someone)
  const handleToggleBoard = async (member) => {
    const targetUserId = member.userId;
    setActionLoadingId(targetUserId);

    try {
      const res = await axios.post(
        `http://localhost:3000/api/profile/${targetUserId}/board`,
        {},
        { withCredentials: true }
      );

      const isNowBoarded = res.data.isBoarded;

      // Update following list
      setFollowingList((prev) => {
        if (!isNowBoarded && isOwnProfile) {
          // If unboarding from own profile's following list, remove or mark unboarded
          return prev.map((item) =>
            item.userId === targetUserId ? { ...item, isBoarded: false } : item
          );
        }
        return prev.map((item) =>
          item.userId === targetUserId ? { ...item, isBoarded: isNowBoarded } : item
        );
      });

      // Update crew list (mutual status or isBoarded)
      setCrewList((prev) =>
        prev.map((item) =>
          item.userId === targetUserId
            ? { ...item, isBoarded: isNowBoarded, isMutual: isNowBoarded && item.isMutual }
            : item
        )
      );

      showToast(
        isNowBoarded ? `Boarded with @${member.userName}` : `Unboarded from @${member.userName}`
      );

      if (onCountChange) onCountChange();
    } catch (err) {
      console.error("Error toggling board status:", err);
      showToast("Action failed. Please try again.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove follower from user's Crew
  const handleRemoveFollower = async (member) => {
    const targetUserId = member.userId;
    setActionLoadingId(targetUserId);

    try {
      await axios.post(
        `http://localhost:3000/api/profile/remove-follower/${targetUserId}`,
        {},
        { withCredentials: true }
      );

      setCrewList((prev) => prev.filter((item) => item.userId !== targetUserId));
      showToast(`Removed @${member.userName} from your Crew`);

      if (onCountChange) onCountChange();
    } catch (err) {
      console.error("Error removing follower:", err);
      showToast("Failed to remove member.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Direct Message (DM)
  const handleDirectMessage = async (member) => {
    const targetUserId = member.userId;
    setMessagingUserId(targetUserId);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/chat/conversations/direct",
        { targetUserId },
        { withCredentials: true }
      );

      const convId = res.data.conversation?._id || res.data._id;
      onClose();
      if (convId) {
        navigate(`/chats?convId=${convId}`);
      } else {
        navigate("/chats");
      }
    } catch (err) {
      console.error("Error creating direct chat:", err);
      showToast("Could not open chat with user.", "error");
      setMessagingUserId(null);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === "crew" ? crewList : followingList;
  const filteredList = currentList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.userName?.toLowerCase().includes(query) ||
      item.name?.toLowerCase().includes(query) ||
      item.bio?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Toast banner */}
      {messageToast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
            messageToast.type === "error"
              ? "bg-rose-500/95 text-white shadow-rose-500/25"
              : "bg-slate-900/90 text-white border border-slate-700/60 shadow-indigo-500/20"
          }`}
        >
          {messageToast.text}
        </div>
      )}

      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold shadow-xs">
                ⚓
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  Connections & Crew
                </h2>
                <p className="text-[11px] text-slate-400">
                  Manage members onboard and who you're following
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-slate-100/80 rounded-2xl gap-1">
            <button
              onClick={() => {
                setActiveTab("crew");
                setSearchQuery("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === "crew"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Crew (Followers)</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === "crew"
                    ? "bg-indigo-100 text-indigo-700 font-extrabold"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {crewList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("following");
                setSearchQuery("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === "following"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Following</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === "following"
                    ? "bg-indigo-100 text-indigo-700 font-extrabold"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {followingList.length}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === "crew" ? "crew members" : "following"}...`}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* Member Roster List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl text-indigo-500"></i>
              <span className="text-xs font-medium">Loading crew roster...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center text-xl mb-3 shadow-xs">
                {searchQuery ? "🔍" : activeTab === "crew" ? "⚓" : "🧭"}
              </div>
              <p className="text-sm font-bold text-slate-700">
                {searchQuery
                  ? "No matching crew found"
                  : activeTab === "crew"
                  ? "No crew members onboard yet"
                  : "Not following anyone yet"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {searchQuery
                  ? "Try searching with a different name or handle."
                  : activeTab === "crew"
                  ? "When users board your profile, they will be listed here."
                  : "Explore profiles and join new crews to see their latest waves."}
              </p>
            </div>
          ) : (
            filteredList.map((member) => {
              const isActionLoading = actionLoadingId === member.userId;
              const isMessaging = messagingUserId === member.userId;

              return (
                <div
                  key={member.userId || member.profileId}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-2xl transition-all group"
                >
                  {/* Left: Avatar & Identity */}
                  <div
                    onClick={() => {
                      onClose();
                      if (member.isSelf) {
                        navigate("/my-profile");
                      } else {
                        navigate(`/user/${member.userName}`);
                      }
                    }}
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={member.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt={member.userName}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-slate-200 shadow-xs"
                      />
                      {member.isOfficialVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[9px] shadow-xs border-2 border-white">
                          <i className="fa-solid fa-check"></i>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                          {member.name || member.userName}
                        </span>
                        {member.isSelf && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-semibold">
                            You
                          </span>
                        )}
                        {member.isMutual && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-1.5 py-0.2 rounded-md font-semibold">
                            Mutual
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        @{member.userName}
                      </div>
                      {member.bio && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!member.isSelf && (
                      <>
                        {/* DM / Message Button */}
                        <button
                          onClick={() => handleDirectMessage(member)}
                          disabled={isMessaging}
                          title="Send Direct Message"
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          {isMessaging ? (
                            <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                          ) : (
                            <i className="fa-solid fa-comment-dots text-xs"></i>
                          )}
                          <span className="hidden sm:inline">Message</span>
                        </button>

                        {/* Following Tab: Unboard button */}
                        {activeTab === "following" ? (
                          <button
                            onClick={() => handleToggleBoard(member)}
                            disabled={isActionLoading}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                              member.isBoarded !== false
                                ? "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            {isActionLoading ? (
                              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                            ) : member.isBoarded !== false ? (
                              "Unboard"
                            ) : (
                              "Board"
                            )}
                          </button>
                        ) : isOwnProfile ? (
                          /* Crew Tab: Remove from crew button if viewing own profile */
                          <button
                            onClick={() => handleRemoveFollower(member)}
                            disabled={isActionLoading}
                            title="Remove from your Crew"
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all shadow-2xs border border-rose-200/50"
                          >
                            {isActionLoading ? (
                              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                            ) : (
                              "Remove"
                            )}
                          </button>
                        ) : (
                          /* Viewing another profile's crew tab: Board / Unboard that person */
                          <button
                            onClick={() => handleToggleBoard(member)}
                            disabled={isActionLoading}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                              member.isBoarded
                                ? "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            {isActionLoading ? (
                              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                            ) : member.isBoarded ? (
                              "Unboard"
                            ) : (
                              "Board"
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {activeTab === "crew" ? "Members aboard this profile" : "Profiles followed"}
          </span>
          <button
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrewFollowingModal;
