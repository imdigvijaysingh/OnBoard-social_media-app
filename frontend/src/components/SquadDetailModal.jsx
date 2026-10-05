import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SquadDetailModal = ({ isOpen, squadId, onClose, onSquadUpdated }) => {
  const navigate = useNavigate();
  const [squad, setSquad] = useState(null);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "members" | "invite" | "settings"
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState(null);

  // Group chat state
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef(null);

  // Invite state
  const [myCrew, setMyCrew] = useState([]);
  const [selectedInviteIds, setSelectedInviteIds] = useState([]);
  const [loadingCrew, setLoadingCrew] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Captain settings state
  const [editName, setEditName] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editPrivacy, setEditPrivacy] = useState("public");
  const [editWhoCanChat, setEditWhoCanChat] = useState("all_members");
  const [editWhoCanInvite, setEditWhoCanInvite] = useState("all_members");
  const [savingSettings, setSavingSettings] = useState(false);

  // Role action loading
  const [roleActionId, setRoleActionId] = useState(null);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSquadDetails = async () => {
    if (!squadId) return;
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:3000/api/squads/${squadId}`, {
        withCredentials: true,
      });
      const data = res.data.squad;
      setSquad(data);

      // Populate settings fields
      setEditName(data.name || "");
      setEditTagline(data.tagline || "");
      setEditDesc(data.description || "");
      setEditTags((data.categoryTags || []).join(", "));
      setEditPrivacy(data.privacy || "public");
      setEditWhoCanChat(data.settings?.whoCanChat || "all_members");
      setEditWhoCanInvite(data.settings?.whoCanInvite || "all_members");
    } catch (err) {
      console.error("Error fetching squad details:", err);
      setErrorMsg("Failed to load squad details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!squadId) return;
    try {
      const res = await axios.get(`http://localhost:3000/api/squads/${squadId}/messages`, {
        withCredentials: true,
      });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Error loading squad messages:", err);
    }
  };

  const fetchMyCrewForInvite = async () => {
    try {
      setLoadingCrew(true);
      const res = await axios.get("http://localhost:3000/api/profile/me/crew-members", {
        withCredentials: true,
      });
      const allCrew = res.data.crew || [];
      // Filter out members who are already in this squad
      const existingUserIds = new Set(
        (squad?.members || []).map((m) => m.userId?.toString())
      );
      const invitable = allCrew.filter((c) => !existingUserIds.has(c.userId?.toString()));
      setMyCrew(invitable);
    } catch (err) {
      console.error("Error loading crew for invite:", err);
    } finally {
      setLoadingCrew(false);
    }
  };

  useEffect(() => {
    if (isOpen && squadId) {
      fetchSquadDetails();
      fetchMessages();
    }
  }, [isOpen, squadId]);

  // Polling for group chat
  useEffect(() => {
    if (!isOpen || activeTab !== "chat" || !squadId) return;
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, squadId]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // When switching to invite tab, load crew
  useEffect(() => {
    if (activeTab === "invite" && squad) {
      fetchMyCrewForInvite();
    }
  }, [activeTab, squad]);

  const handleJoinSquad = async () => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/squads/${squadId}/join`,
        {},
        { withCredentials: true }
      );
      setSquad(res.data.squad);
      showToast("Welcome aboard the squad!");
      if (onSquadUpdated) onSquadUpdated();
    } catch (err) {
      console.error("Join squad error:", err);
      showToast(err.response?.data?.message || "Could not join squad", "error");
    }
  };

  const handleLeaveSquad = async () => {
    if (!window.confirm("Are you sure you want to leave this squad?")) return;
    try {
      await axios.post(
        `http://localhost:3000/api/squads/${squadId}/leave`,
        {},
        { withCredentials: true }
      );
      showToast("You left the squad");
      if (onSquadUpdated) onSquadUpdated();
      onClose();
    } catch (err) {
      console.error("Leave squad error:", err);
      showToast(err.response?.data?.message || "Failed to leave squad", "error");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const res = await axios.post(
        `http://localhost:3000/api/squads/${squadId}/messages`,
        { text: chatInput.trim() },
        { withCredentials: true }
      );
      setMessages((prev) => [...prev, res.data.message]);
      setChatInput("");
    } catch (err) {
      console.error("Send message error:", err);
      showToast(err.response?.data?.message || "Message not sent", "error");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleUpdateRole = async (targetUserId, newRole) => {
    setRoleActionId(targetUserId);
    try {
      const res = await axios.put(
        `http://localhost:3000/api/squads/${squadId}/members/role`,
        { targetUserId, newRole },
        { withCredentials: true }
      );
      setSquad(res.data.squad);
      showToast(res.data.message);
      if (onSquadUpdated) onSquadUpdated();
    } catch (err) {
      console.error("Update role error:", err);
      showToast(err.response?.data?.message || "Failed to change role", "error");
    } finally {
      setRoleActionId(null);
    }
  };

  const handleRemoveMember = async (targetUserId, targetName) => {
    if (!window.confirm(`Unboard @${targetName} from the squad?`)) return;
    setRoleActionId(targetUserId);
    try {
      const res = await axios.delete(
        `http://localhost:3000/api/squads/${squadId}/members/${targetUserId}`,
        { withCredentials: true }
      );
      setSquad(res.data.squad);
      showToast(res.data.message);
      if (onSquadUpdated) onSquadUpdated();
    } catch (err) {
      console.error("Remove member error:", err);
      showToast(err.response?.data?.message || "Failed to remove member", "error");
    } finally {
      setRoleActionId(null);
    }
  };

  const handleDirectMessage = async (targetUserId) => {
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
      console.error("Direct message error:", err);
      showToast("Could not open chat.", "error");
    }
  };

  const handleToggleInviteUser = (userId) => {
    if (selectedInviteIds.includes(userId)) {
      setSelectedInviteIds(selectedInviteIds.filter((id) => id !== userId));
    } else {
      setSelectedInviteIds([...selectedInviteIds, userId]);
    }
  };

  const handleSendInvites = async () => {
    if (selectedInviteIds.length === 0) return;
    setInviting(true);
    try {
      const res = await axios.post(
        `http://localhost:3000/api/squads/${squadId}/invite`,
        { userIds: selectedInviteIds },
        { withCredentials: true }
      );
      setSquad(res.data.squad);
      showToast(res.data.message);
      setSelectedInviteIds([]);
      setActiveTab("members");
      if (onSquadUpdated) onSquadUpdated();
    } catch (err) {
      console.error("Invite error:", err);
      showToast(err.response?.data?.message || "Failed to invite members", "error");
    } finally {
      setInviting(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const tagsArray = editTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await axios.put(
        `http://localhost:3000/api/squads/${squadId}/settings`,
        {
          name: editName.trim(),
          tagline: editTagline.trim(),
          description: editDesc.trim(),
          categoryTags: tagsArray,
          privacy: editPrivacy,
          whoCanChat: editWhoCanChat,
          whoCanInvite: editWhoCanInvite,
        },
        { withCredentials: true }
      );

      setSquad(res.data.squad);
      showToast("Squad settings updated successfully!");
      if (onSquadUpdated) onSquadUpdated();
    } catch (err) {
      console.error("Settings update error:", err);
      showToast(err.response?.data?.message || "Failed to update settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
            toast.type === "error"
              ? "bg-rose-500 text-white shadow-rose-500/25"
              : "bg-slate-900 text-white border border-slate-700/60 shadow-indigo-500/20"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col h-[90vh] max-h-[750px] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <i className="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-500"></i>
            <span className="text-xs text-slate-500 font-medium">Summoning Squad Deck...</span>
          </div>
        ) : !squad ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-bold text-slate-700">Squad not found or access restricted.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Squad Hero Banner */}
            <div className="relative h-32 sm:h-36 shrink-0 bg-slate-900 overflow-hidden">
              <img
                src={squad.banner || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80"}
                alt={squad.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-black/30"></div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-colors"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>

              {/* Squad Header Info */}
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={squad.avatar || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80"}
                    alt={squad.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white object-cover shadow-lg bg-white shrink-0"
                  />
                  <div className="min-w-0 text-white drop-shadow-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-extrabold truncate">{squad.name}</h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md font-semibold">
                        {squad.privacy === "invite_only" ? "🔒 Invite-Only" : "🌐 Public"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 truncate">
                      @{squad.handle} • {squad.membersCount} Member{squad.membersCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {/* Join / Leave / Captain status */}
                <div className="shrink-0 flex items-center gap-2">
                  {!squad.isMember ? (
                    <button
                      onClick={handleJoinSquad}
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 transition-all"
                    >
                      Join Squad
                    </button>
                  ) : squad.isCaptain ? (
                    <span className="px-3 py-1 text-[11px] font-extrabold rounded-xl bg-amber-400 text-amber-950 flex items-center gap-1 shadow-xs">
                      👑 Captain
                    </span>
                  ) : (
                    <button
                      onClick={handleLeaveSquad}
                      className="px-3 py-1 text-xs font-semibold rounded-xl bg-white/20 hover:bg-rose-500/80 text-white backdrop-blur-md transition-all"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-1 overflow-x-auto py-2">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === "chat"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <i className="fa-solid fa-comments"></i>
                  <span>Group Chat</span>
                </button>

                <button
                  onClick={() => setActiveTab("members")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === "members"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <i className="fa-solid fa-users"></i>
                  <span>Crew ({squad.membersCount})</span>
                </button>

                {squad.canInvite && (
                  <button
                    onClick={() => setActiveTab("invite")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                      activeTab === "invite"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <i className="fa-solid fa-user-plus"></i>
                    <span>Invite</span>
                  </button>
                )}

                {squad.isCaptain && (
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                      activeTab === "settings"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <i className="fa-solid fa-gear"></i>
                    <span>Captain's Bridge</span>
                  </button>
                )}
              </div>

              {/* Tagline Preview */}
              {squad.tagline && (
                <span className="hidden md:inline-block text-[11px] text-slate-400 italic truncate max-w-xs">
                  "{squad.tagline}"
                </span>
              )}
            </div>

            {/* TAB 1: GROUP CHAT */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50/40">
                {/* Notice if captains only broadcast */}
                {squad.settings?.whoCanChat === "captains_only" && (
                  <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200/60 text-amber-800 text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>📢</span>
                      <span>
                        <strong>Captain Broadcast Mode:</strong> Only Captains & Co-Captains can post announcements here.
                      </span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                      View Only for Crew
                    </span>
                  </div>
                )}

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl mb-2">
                        💬
                      </div>
                      <p className="text-xs font-bold text-slate-700">No messages in squad chat yet</p>
                      <p className="text-[11px] text-slate-400">
                        {squad.canChat ? "Say hello to kick off the voyage!" : "Wait for the captain to post an update."}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const roleBadgeColor =
                        msg.sender?.role === "captain"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : msg.sender?.role === "co_captain"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                          : "bg-slate-100 text-slate-600";

                      return (
                        <div
                          key={msg._id}
                          className={`flex items-start gap-2.5 max-w-[85%] ${
                            msg.isMine ? "ml-auto flex-row-reverse" : ""
                          }`}
                        >
                          <img
                            src={msg.sender?.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt={msg.sender?.userName}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                          />
                          <div className={`space-y-0.5 ${msg.isMine ? "items-end text-right" : ""}`}>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="font-bold text-slate-700">
                                {msg.sender?.fullName || msg.sender?.userName}
                              </span>
                              {msg.sender?.role === "captain" && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md font-extrabold bg-amber-100 text-amber-800 border border-amber-300/60">
                                  👑 Captain
                                </span>
                              )}
                              {msg.sender?.role === "co_captain" && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                  ⭐ Co-Captain
                                </span>
                              )}
                              <span className="text-slate-400">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <div
                              className={`p-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                                msg.isMine
                                  ? "bg-indigo-600 text-white rounded-tr-none"
                                  : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Bar */}
                {squad.canChat ? (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Message ${squad.name}...`}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || sendingMsg}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {sendingMsg ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-paper-plane"></i>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
                    {!squad.isMember
                      ? "Join this squad to participate in the conversation."
                      : "Broadcast chat mode: only Captains & Co-Captains can post messages."}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MEMBERS ROSTER & ROLES */}
            {activeTab === "members" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
                <div className="pb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Squad Crew ({squad.membersCount})
                  </span>
                  {squad.canInvite && (
                    <button
                      onClick={() => setActiveTab("invite")}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-user-plus text-[11px]"></i>
                      <span>Invite Crew</span>
                    </button>
                  )}
                </div>

                {squad.members.map((member) => {
                  const isActionLoading = roleActionId === member.userId;
                  const isCap = member.role === "captain";
                  const isCoCap = member.role === "co_captain";

                  return (
                    <div
                      key={member.userId}
                      className="pt-2.5 pb-2 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-all"
                    >
                      {/* Member Info */}
                      <div
                        onClick={() => {
                          onClose();
                          navigate(`/user/${member.userName}`);
                        }}
                        className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                      >
                        <img
                          src={member.profilePhoto}
                          alt={member.userName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {member.fullName || member.userName}
                            </span>
                            {isCap && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                👑 Captain
                              </span>
                            )}
                            {isCoCap && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                ⭐ Co-Captain
                              </span>
                            )}
                            {!isCap && !isCoCap && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md font-medium bg-slate-100 text-slate-600">
                                Crew
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            @{member.userName}
                          </span>
                        </div>
                      </div>

                      {/* Actions: DM & Captain management */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* DM button */}
                        <button
                          onClick={() => handleDirectMessage(member.userId)}
                          title="Direct Message"
                          className="p-1.5 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <i className="fa-solid fa-comment-dots"></i>
                        </button>

                        {/* Captain Role Controls */}
                        {squad.isCaptain && !isCap && (
                          <div className="flex items-center gap-1">
                            {isCoCap ? (
                              <button
                                onClick={() => handleUpdateRole(member.userId, "crew")}
                                disabled={isActionLoading}
                                title="Demote to Regular Crew"
                                className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                              >
                                Demote
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateRole(member.userId, "co_captain")}
                                disabled={isActionLoading}
                                title="Promote to Co-Captain (Sub-Captain)"
                                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all border border-indigo-200"
                              >
                                + Co-Captain
                              </button>
                            )}

                            <button
                              onClick={() => handleRemoveMember(member.userId, member.userName)}
                              disabled={isActionLoading}
                              title="Unboard from Squad"
                              className="p-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-user-minus"></i>
                            </button>
                          </div>
                        )}

                        {/* Co-Captain Controls */}
                        {squad.isCoCaptain && !isCap && !isCoCap && (
                          <button
                            onClick={() => handleRemoveMember(member.userId, member.userName)}
                            disabled={isActionLoading}
                            title="Unboard from Squad"
                            className="p-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <i className="fa-solid fa-user-minus"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: INVITE CREW */}
            {activeTab === "invite" && (
              <div className="flex-1 flex flex-col p-4 min-h-0">
                <div className="mb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Invite Your Crew Onboard
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select connections from your crew to join this squad.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                  {loadingCrew ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <i className="fa-solid fa-circle-notch fa-spin text-xl text-indigo-500"></i>
                      <span className="text-xs">Loading your crew...</span>
                    </div>
                  ) : myCrew.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      <p className="font-semibold text-slate-600">All of your crew members are already in this squad!</p>
                      <p className="mt-1 text-[11px]">Or you haven't boarded any crew yet.</p>
                    </div>
                  ) : (
                    myCrew.map((c) => {
                      const isSelected = selectedInviteIds.includes(c.userId);
                      return (
                        <div
                          key={c.userId}
                          onClick={() => handleToggleInviteUser(c.userId)}
                          className={`py-2 px-2.5 flex items-center justify-between rounded-xl cursor-pointer transition-all ${
                            isSelected ? "bg-indigo-50/80 border border-indigo-200" : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={c.profilePhoto}
                              alt={c.userName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">
                                {c.name || c.userName}
                              </span>
                              <span className="text-[10px] text-slate-400">@{c.userName}</span>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white font-bold"
                                : "border border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <i className="fa-solid fa-check text-[10px]"></i>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-3 pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    {selectedInviteIds.length} member{selectedInviteIds.length === 1 ? "" : "s"} selected
                  </span>
                  <button
                    onClick={handleSendInvites}
                    disabled={selectedInviteIds.length === 0 || inviting}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {inviting ? "Sending..." : "Onboard Selected to Squad"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: CAPTAIN'S BRIDGE (SETTINGS & CONTROLS) */}
            {activeTab === "settings" && squad.isCaptain && (
              <form onSubmit={handleSaveSettings} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5">
                  <span className="text-lg">👑</span>
                  <div className="text-xs text-amber-900">
                    <span className="font-extrabold block">Captain's Command Deck</span>
                    <span className="text-[11px] text-amber-700">
                      As Captain, you control community rules, permissions, broadcast modes, and interest recommendation tags.
                    </span>
                  </div>
                </div>

                {/* Name & Tagline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Squad Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={editTagline}
                      onChange={(e) => setEditTagline(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Squad Description & Rules
                  </label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Recommendation Tags */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-0.5">
                    Interest Tags (Comma separated)
                  </label>
                  <p className="text-[10px] text-slate-400 mb-1">
                    Accounts with matching interests will see this squad in their recommendations feed!
                  </p>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g. fitness, lifting, gym, diet"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Permissions controls */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    🛡️ Permissions & Broadcast Modes
                  </span>

                  {/* Who can chat */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">Group Chat Permission</span>
                      <span className="text-[11px] text-slate-400">
                        {editWhoCanChat === "all_members"
                          ? "All squad members can send messages"
                          : "Captains & Co-Captains only broadcast"}
                      </span>
                    </div>
                    <div className="flex p-0.5 bg-slate-200 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setEditWhoCanChat("all_members")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          editWhoCanChat === "all_members" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        All Members
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditWhoCanChat("captains_only")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          editWhoCanChat === "captains_only" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        Captains Only
                      </button>
                    </div>
                  </div>

                  {/* Who can invite */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">Invite Permission</span>
                      <span className="text-[11px] text-slate-400">
                        {editWhoCanInvite === "all_members"
                          ? "Any member can invite new crew"
                          : "Captains & Co-Captains only"}
                      </span>
                    </div>
                    <div className="flex p-0.5 bg-slate-200 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setEditWhoCanInvite("all_members")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          editWhoCanInvite === "all_members" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        All Members
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditWhoCanInvite("captains_only")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          editWhoCanInvite === "captains_only" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        Captains Only
                      </button>
                    </div>
                  </div>

                  {/* Privacy */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">Visibility</span>
                      <span className="text-[11px] text-slate-400">
                        {editPrivacy === "public" ? "Discoverable in explore & recommendations" : "Invite-only squad"}
                      </span>
                    </div>
                    <div className="flex p-0.5 bg-slate-200 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setEditPrivacy("public")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          editPrivacy === "public" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPrivacy("invite_only")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          editPrivacy === "invite_only" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        Invite-Only
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {savingSettings ? "Updating Deck..." : "Save Squad Rules"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SquadDetailModal;
