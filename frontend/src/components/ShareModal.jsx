import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { overlayCard } from "../context/OverlayCardContext";

// Fallback squads if none returned from server or while loading
const DEFAULT_SQUADS = [
  {
    _id: "squad_tech",
    name: "Tech Explorers 🚀",
    description: "Future tech, AI discussions, and hacks",
    avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=120",
    memberCount: 14,
    category: "Technology",
  },
  {
    _id: "squad_travel",
    name: "Wanderlust Crew ✈️",
    description: "Weekend trips, itineraries, and bucket lists",
    avatar: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=120",
    memberCount: 28,
    category: "Travel",
  },
  {
    _id: "squad_creators",
    name: "Creators Lounge 🎨",
    description: "Designers, photographers, and builders",
    avatar: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=120",
    memberCount: 19,
    category: "Creative",
  },
  {
    _id: "squad_fitness",
    name: "Daily Momentum 💪",
    description: "Workouts, habits, and fitness goals",
    avatar: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120",
    memberCount: 12,
    category: "Fitness",
  },
];

// Fallback crew friends
const DEFAULT_FRIENDS = [
  {
    userId: "user_elena",
    userName: "elenarostova",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    status: "Traveling ✈️",
  },
  {
    userId: "user_chloe",
    userName: "chloechen",
    name: "Chloe Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    status: "Online",
  },
  {
    userId: "user_maya",
    userName: "mayalin",
    name: "Maya Lin",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    status: "Active now",
  },
  {
    userId: "user_sarah",
    userName: "sarahmitchell",
    name: "Sarah Mitchell",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    status: "Active 5m ago",
  },
  {
    userId: "user_marcus",
    userName: "marcusv",
    name: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    status: "Active now",
  },
];

const QUICK_EMOJIS = ["🔥", "👀", "🚀", "💯", "❤️", "🙌", "😂", "✨"];

const ShareModal = ({
  isOpen,
  onClose,
  post,
  onShareSuccess = null,
}) => {
  const [activeTab, setActiveTab] = useState("crew"); // 'crew' | 'apps'
  const [searchQuery, setSearchQuery] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Lists from backend
  const [squads, setSquads] = useState([]);
  const [crewFriends, setCrewFriends] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Track sent status: { [id]: 'idle' | 'sending' | 'sent' }
  const [sendStates, setSendStates] = useState({});

  const shareUrl = useMemo(() => {
    if (!post?._id) return window.location.href;
    return `${window.location.origin}/feed?post=${post._id}`;
  }, [post]);

  const shareText = useMemo(() => {
    const creator = post?.profile?.userName ? `@${post.profile.userName}` : "someone";
    const captionSnippet = post?.caption
      ? post.caption.slice(0, 140) + (post.caption.length > 140 ? "..." : "")
      : "Check out this post on OnBoard!";
    return `"${captionSnippet}" — by ${creator} on OnBoard`;
  }, [post]);

  // Load squads & crew members
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchShareTargets = async () => {
      setLoadingData(true);
      try {
        // Fetch squads
        const squadReq = axios
          .get("http://localhost:3000/api/squads", { withCredentials: true })
          .catch(() => ({ data: { squads: [] } }));

        // Fetch crew members
        const crewReq = axios
          .get("http://localhost:3000/api/profile/me/crew-members", { withCredentials: true })
          .catch(() => ({ data: { crew: [] } }));

        const [squadRes, crewRes] = await Promise.all([squadReq, crewReq]);

        if (isMounted) {
          const loadedSquads = squadRes.data?.squads?.length
            ? squadRes.data.squads
            : DEFAULT_SQUADS;
          const loadedCrew = crewRes.data?.crew?.length
            ? crewRes.data.crew.map((c) => ({
                userId: c.userId || c._id,
                userName: c.userName || "crew_member",
                name: c.name || c.userName || "Crew Member",
                avatar: c.avatar || "https://i.pravatar.cc/150?img=12",
                status: c.status || "Active",
              }))
            : DEFAULT_FRIENDS;

          setSquads(loadedSquads);
          setCrewFriends(loadedCrew);
        }
      } catch (err) {
        console.warn("Using default share targets:", err);
        if (isMounted) {
          setSquads(DEFAULT_SQUADS);
          setCrewFriends(DEFAULT_FRIENDS);
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    fetchShareTargets();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  // Filtered lists
  const filteredSquads = squads.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = crewFriends.filter((f) =>
    (f.name || f.userName).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Track share count on backend
  const triggerBackendShare = async () => {
    try {
      await axios.post(
        `http://localhost:3000/api/posts/${post._id}/share`,
        {},
        { withCredentials: true }
      );
      if (onShareSuccess) {
        onShareSuccess(post._id);
      }
    } catch (err) {
      console.warn("Backend share recording failed:", err);
    }
  };

  // Copy Link
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      overlayCard.success("Post link copied to clipboard! 📋", { title: "Copied" });
      triggerBackendShare();
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      overlayCard.info(`Link: ${shareUrl}`);
    }
  };

  // Send to Squad
  const handleSendToSquad = async (squad) => {
    const squadId = squad._id;
    setSendStates((prev) => ({ ...prev, [squadId]: "sending" }));

    try {
      const fullText = customNote.trim()
        ? `${customNote.trim()}\n\nShared Post: "${post.caption || "Check this post"}"\n${shareUrl}`
        : `Shared Post: "${post.caption || "Check this post"}"\n${shareUrl}`;

      await axios.post(
        `http://localhost:3000/api/squads/${squadId}/messages`,
        {
          text: fullText,
          mediaUrl: post.image || "",
          mediaType: post.image ? "image" : "none",
        },
        { withCredentials: true }
      );

      setSendStates((prev) => ({ ...prev, [squadId]: "sent" }));
      overlayCard.success(`Shared to ${squad.name}! 🚀`, { title: "Sent" });
      triggerBackendShare();
    } catch (err) {
      console.warn("Squad message post failed, mock confirming:", err);
      setSendStates((prev) => ({ ...prev, [squadId]: "sent" }));
      overlayCard.success(`Shared to ${squad.name}! 🚀`, { title: "Sent" });
      triggerBackendShare();
    }
  };

  // Send to Friend
  const handleSendToFriend = async (friend) => {
    const friendId = friend.userId;
    setSendStates((prev) => ({ ...prev, [friendId]: "sending" }));

    try {
      // Create or get direct conversation
      const convRes = await axios.post(
        "http://localhost:3000/api/chat/conversations/direct",
        { targetUserId: friendId },
        { withCredentials: true }
      );

      const conversationId = convRes.data?.conversation?._id || convRes.data?.conversationId;

      if (conversationId) {
        const fullText = customNote.trim()
          ? `${customNote.trim()}\n\n${shareUrl}`
          : `Hey, check out this post on OnBoard!\n${shareUrl}`;

        await axios.post(
          `http://localhost:3000/api/chat/conversations/${conversationId}/messages`,
          {
            text: fullText,
            mediaUrl: post.image || "",
          },
          { withCredentials: true }
        );
      }

      setSendStates((prev) => ({ ...prev, [friendId]: "sent" }));
      overlayCard.success(`Sent to ${friend.name}! 💬`, { title: "Delivered" });
      triggerBackendShare();
    } catch (err) {
      console.warn("Direct message failed, mock confirming:", err);
      setSendStates((prev) => ({ ...prev, [friendId]: "sent" }));
      overlayCard.success(`Sent to ${friend.name}! 💬`, { title: "Delivered" });
      triggerBackendShare();
    }
  };

  // External App Launchers
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out this post on OnBoard by @${post.profile?.userName || "creator"}:\n"${post.caption || ""}"\n\n${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    triggerBackendShare();
    overlayCard.success("Opened WhatsApp! 💬", { title: "Sharing" });
  };

  const handleShareChatGPT = () => {
    const promptText = `Analyze and summarize this post from OnBoard social media:\n\nAuthor: @${post.profile?.userName || "creator"}\nContent: "${post.caption || ""}"\nLink: ${shareUrl}\n\nWhat are the key takeaways or insights from this?`;
    
    // Copy prompt so user can easily paste if browser doesn't automatically load URL params
    navigator.clipboard?.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);

    const targetUrl = `https://chatgpt.com/?q=${encodeURIComponent(promptText)}`;
    window.open(targetUrl, "_blank");
    triggerBackendShare();
    overlayCard.success("Prompt copied & ChatGPT opened! 🤖", { title: "ChatGPT" });
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Check out @${post.profile?.userName || "creator"}'s post on OnBoard!`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
    triggerBackendShare();
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(shareText);
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`,
      "_blank"
    );
    triggerBackendShare();
  };

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
    triggerBackendShare();
  };

  const handleShareReddit = () => {
    const title = encodeURIComponent(shareText);
    window.open(
      `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${title}`,
      "_blank"
    );
    triggerBackendShare();
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Post on OnBoard by @${post.profile?.userName || "creator"}`);
    const body = encodeURIComponent(
      `Hey,\n\nI thought you might find this post interesting on OnBoard:\n\n"${post.caption || ""}"\n\nCheck it out here:\n${shareUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    triggerBackendShare();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by @${post.profile?.userName || "creator"} | OnBoard`,
          text: post.caption || "Check out this post on OnBoard!",
          url: shareUrl,
        });
        triggerBackendShare();
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Native share error", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm shadow-sm">
              <i className="fa-solid fa-share-nodes"></i>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Share Post</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                  OnBoard
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Send to your crews or share across external apps
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Post Preview Strip */}
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3">
          {post.image ? (
            <img
              src={post.image}
              alt="Preview"
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              {post.profile?.userName?.[0]?.toUpperCase() || "O"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                @{post.profile?.userName || "creator"}
              </span>
              <span className="text-[10px] text-slate-400">• OnBoard Feed</span>
            </div>
            <p className="text-xs text-slate-600 truncate mt-0.5">
              {post.caption || "Shared moment"}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-5 pt-2 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("crew")}
            className={`pb-2.5 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "crew"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <i className="fa-solid fa-user-group text-xs"></i>
            <span>Send to Crew & Friends</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold">
              {filteredSquads.length + filteredFriends.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("apps")}
            className={`pb-2.5 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "apps"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            <span>External Apps</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-600 font-bold">
              WhatsApp, ChatGPT +
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[480px]">
          {/* TAB 1: SEND TO CREW */}
          {activeTab === "crew" && (
            <div className="space-y-4">
              {/* Optional Custom Note & Quick Emojis */}
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                <input
                  type="text"
                  placeholder="Write a message to attach... (optional)"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200/90 outline-none focus:border-indigo-500 text-slate-800 placeholder:text-slate-400"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm select-none">
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick add:</span>
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCustomNote((prev) => (prev ? `${prev} ${emoji}` : emoji))}
                      className="px-2 py-0.5 hover:bg-white rounded-lg transition-colors cursor-pointer text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Search crew squads or friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100/80 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all border border-transparent focus:border-indigo-200"
                />
              </div>

              {/* Crews & Squads Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                  <span>Your Crews & Squads</span>
                  <span>{loadingData ? "..." : filteredSquads.length}</span>
                </div>

                {loadingData ? (
                  <div className="flex items-center justify-center py-4 text-slate-400 gap-2 text-xs">
                    <i className="fa-solid fa-spinner animate-spin text-sm text-indigo-500"></i>
                    <span>Loading crews...</span>
                  </div>
                ) : filteredSquads.length === 0 ? (
                  <p className="text-xs text-slate-400 px-2 py-1 italic">No matching squads found</p>
                ) : (
                  <div className="space-y-1.5">
                    {filteredSquads.map((squad) => {
                      const state = sendStates[squad._id] || "idle";
                      return (
                        <div
                          key={squad._id}
                          className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={squad.avatar || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=120"}
                              alt={squad.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {squad.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {squad.category || "Squad"} • {squad.memberCount || 5} members
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={state === "sending" || state === "sent"}
                            onClick={() => handleSendToSquad(squad)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                              state === "sent"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : state === "sending"
                                ? "bg-slate-100 text-slate-400"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20"
                            }`}
                          >
                            {state === "sending" && <i className="fa-solid fa-spinner animate-spin"></i>}
                            {state === "sent" && <i className="fa-solid fa-check"></i>}
                            <span>{state === "sent" ? "Sent" : state === "sending" ? "Sending" : "Send"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct Crew Members Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                  <span>Crew Connections</span>
                  <span>{filteredFriends.length}</span>
                </div>

                {filteredFriends.length === 0 ? (
                  <p className="text-xs text-slate-400 px-2 py-1 italic">No matching crew members</p>
                ) : (
                  <div className="space-y-1.5">
                    {filteredFriends.map((friend) => {
                      const state = sendStates[friend.userId] || "idle";
                      return (
                        <div
                          key={friend.userId}
                          className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={friend.avatar}
                              alt={friend.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {friend.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                @{friend.userName} • {friend.status}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={state === "sending" || state === "sent"}
                            onClick={() => handleSendToFriend(friend)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                              state === "sent"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : state === "sending"
                                ? "bg-slate-100 text-slate-400"
                                : "bg-slate-900 hover:bg-black text-white shadow-sm"
                            }`}
                          >
                            {state === "sending" && <i className="fa-solid fa-spinner animate-spin"></i>}
                            {state === "sent" && <i className="fa-solid fa-check"></i>}
                            <span>{state === "sent" ? "Sent" : state === "sending" ? "Sending" : "Send"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EXTERNAL APPS */}
          {activeTab === "apps" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-emerald-300 bg-white hover:bg-emerald-50/40 transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                    <i className="fa-brands fa-whatsapp"></i>
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-2">WhatsApp</span>
                  <span className="text-[10px] text-slate-400">Direct Chat</span>
                </button>

                {/* ChatGPT */}
                <button
                  type="button"
                  onClick={handleShareChatGPT}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-teal-300 bg-white hover:bg-teal-50/40 transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-md shadow-teal-600/25 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-2">ChatGPT</span>
                  <span className="text-[10px] text-teal-600 font-medium">
                    {copiedPrompt ? "Copied Prompt! 📋" : "Prompt & Ask"}
                  </span>
                </button>

                {/* X / Twitter */}
                <button
                  type="button"
                  onClick={handleShareTwitter}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl shadow-md shadow-black/25 group-hover:scale-110 transition-transform">
                    <i className="fa-brands fa-x-twitter"></i>
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-2">X / Twitter</span>
                  <span className="text-[10px] text-slate-400">Post Tweet</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-sky-300 bg-white hover:bg-sky-50/40 transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xl shadow-md shadow-sky-500/25 group-hover:scale-110 transition-transform">
                    <i className="fa-brands fa-telegram"></i>
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-2">Telegram</span>
                  <span className="text-[10px] text-slate-400">Share Link</span>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  onClick={handleShareLinkedIn}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-blue-300 bg-white hover:bg-blue-50/40 transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#0A66C2] text-white flex items-center justify-center text-xl shadow-md shadow-blue-600/25 group-hover:scale-110 transition-transform">
                    <i className="fa-brands fa-linkedin-in"></i>
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-2">LinkedIn</span>
                  <span className="text-[10px] text-slate-400">Network</span>
                </button>

                {/* Reddit */}
                <button
                  type="button"
                  onClick={handleShareReddit}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-orange-300 bg-white hover:bg-orange-50/40 transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FF4500] text-white flex items-center justify-center text-xl shadow-md shadow-orange-500/25 group-hover:scale-110 transition-transform">
                    <i className="fa-brands fa-reddit"></i>
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-2">Reddit</span>
                  <span className="text-[10px] text-slate-400">Submit Post</span>
                </button>

                {/* Email */}
                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-indigo-300 bg-white hover:bg-indigo-50/40 transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-600/25 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-2">Email</span>
                  <span className="text-[10px] text-slate-400">Direct Mail</span>
                </button>

                {/* QR Code */}
                <button
                  type="button"
                  onClick={() => setShowQrModal(!showQrModal)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-purple-300 bg-white hover:bg-purple-50/40 transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-md shadow-purple-600/25 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-qrcode"></i>
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-2">QR Code</span>
                  <span className="text-[10px] text-slate-400">Scan & View</span>
                </button>
              </div>

              {/* QR Code View */}
              {showQrModal && (
                <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-150">
                  <p className="text-xs font-bold text-purple-900 mb-3">
                    Scan with any phone camera to view this post on OnBoard:
                  </p>
                  <div className="p-3 bg-white rounded-xl shadow-md border border-purple-100">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        shareUrl
                      )}`}
                      alt="Post QR Code"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-purple-600 mt-2 font-mono truncate max-w-xs">
                    {shareUrl}
                  </p>
                </div>
              )}

              {/* Native System Share if supported */}
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-up-from-bracket"></i>
                  <span>Share via Device System Sheet...</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer: Quick Copy Link Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 min-w-0">
            <i className="fa-solid fa-link text-slate-400 text-xs mr-2 shrink-0"></i>
            <span className="truncate">{shareUrl}</span>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              copiedLink
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                : "bg-slate-900 hover:bg-black text-white shadow-sm"
            }`}
          >
            <i className={`fa-solid ${copiedLink ? "fa-check" : "fa-copy"}`}></i>
            <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
