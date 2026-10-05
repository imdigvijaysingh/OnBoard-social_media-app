import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CelebrationOverlay, { CELEBRATION_TYPES } from "../components/CelebrationOverlay";
import ChapterModal from "../components/ChapterModal";
import CreateCategoryModal from "../components/CreateCategoryModal";
import ContactIdentityModal from "../components/ContactIdentityModal";
import YouAndPersonModal from "../components/YouAndPersonModal";
import SelectOrganizeBar from "../components/SelectOrganizeBar";
import LocationModal from "../components/LocationModal";
import LocationCard from "../components/LocationCard";
import LocationMapModal from "../components/LocationMapModal";
import ActiveLocationCenterModal from "../components/ActiveLocationCenterModal";
import WidgetModal from "../components/WidgetModal";
import ExperienceModal from "../components/ExperienceModal";
import MomentModal from "../components/MomentModal";
import MediaTimelineModal from "../components/MediaTimelineModal";
import PollCard from "../components/PollCard";
import ChecklistCard from "../components/ChecklistCard";
import MeetingPointCard from "../components/MeetingPointCard";
import QuestionCard from "../components/QuestionCard";
import ExperienceCard from "../components/ExperienceCard";
import { AdaptivePollingAdapter } from "../utils/TransportAdapter";
import { overlayCard } from "../context/OverlayCardContext";
import { useSidebar } from "../context/SidebarContext";
import pulse from "../utils/pulseEngine";
import "../styles/Chats.css";

const API_BASE = "http://localhost:3000/api/chat";

const CELEBRATION_KEYWORDS = [
  { match: /(happy\s*birthday|hbd|birthday)/i, type: "birthday", label: "Birthday Party" },
  { match: /(happy\s*anniversary|anniversary|milestone)/i, type: "anniversary", label: "Anniversary & Milestone" },
  { match: /(diwali|deepavali|shubh\s*diwali)/i, type: "diwali", label: "Diwali Sparkles" },
  { match: /(happy\s*holi|holi\s*hai)/i, type: "holi", label: "Holi Colors" },
  { match: /(eid\s*mubarak|happy\s*eid)/i, type: "eid", label: "Eid Mubarak" },
  { match: /(congratulations|congrats|proud\s*of\s*you)/i, type: "congrats", label: "Congratulations" },
];

const Chats = () => {
  const { isCollapsed } = useSidebar();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(() => searchParams.get("convId") || null);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const urlConvId = searchParams.get("convId");
    if (urlConvId && urlConvId !== activeConvId) {
      setActiveConvId(urlConvId);
    }
  }, [searchParams]);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Composer state
  const [inputText, setInputText] = useState("");
  const [replyMessage, setReplyMessage] = useState(null);
  const [selectedCelebration, setSelectedCelebration] = useState(null);
  const [activeCelebrationOverlay, setActiveCelebrationOverlay] = useState(null);
  const [suggestedCelebration, setSuggestedCelebration] = useState(null);
  const [showCelebrationPicker, setShowCelebrationPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Offline / Outbound queue
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Multi-select & Organization
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  // Modals state
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [targetContactUser, setTargetContactUser] = useState(null);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [availableCrew, setAvailableCrew] = useState([]);

  // Location System State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLocationMapOpen, setIsLocationMapOpen] = useState(false);
  const [activeMapData, setActiveMapData] = useState(null);
  const [isLocationCenterOpen, setIsLocationCenterOpen] = useState(false);
  const [activeOutboundCount, setActiveOutboundCount] = useState(0);

  // Reaction popover state
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);

  // Widget, Experience, Moment, Media, Search states
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [widgetModalType, setWidgetModalType] = useState("poll");
  const [widgetModalText, setWidgetModalText] = useState("");

  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [experienceInitialTitle, setExperienceInitialTitle] = useState("");
  const [experienceInitialLocation, setExperienceInitialLocation] = useState("");

  const [isMomentModalOpen, setIsMomentModalOpen] = useState(false);
  const [momentInitialTitle, setMomentInitialTitle] = useState("");

  const [isMediaTimelineOpen, setIsMediaTimelineOpen] = useState(false);

  // In-Conversation Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQueryText, setSearchQueryText] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Voice playback speeds: map of messageId -> speed (1, 1.5, 2)
  const [voicePlaybackSpeeds, setVoicePlaybackSpeeds] = useState({});

  // Custom Categories state
  const [conversationCategories, setConversationCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [categoryFilteredMessages, setCategoryFilteredMessages] = useState(null);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);

  const messagesEndRef = useRef(null);
  const messageStreamRef = useRef(null);
  const syncTimerRef = useRef(null);

  // Check active location shares count
  const refreshActiveSharesCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/location/active`, {
        withCredentials: true,
      });
      setActiveOutboundCount(res.data.outbound?.length || 0);
    } catch (err) {
      // silent
    }
  }, []);

  useEffect(() => {
    refreshActiveSharesCount();
  }, [refreshActiveSharesCount]);

  // Adaptive background location pusher for active live shares
  useEffect(() => {
    let intervalId = null;

    if (activeOutboundCount > 0 && navigator.geolocation) {
      intervalId = setInterval(() => {
        if (!document.hidden) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              axios.get(`${API_BASE}/location/active`, { withCredentials: true })
                .then((res) => {
                  const outbound = res.data.outbound || [];
                  setActiveOutboundCount(outbound.length);
                  outbound.forEach((share) => {
                    axios.patch(
                      `${API_BASE}/location/${share._id}/update`,
                      {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                      },
                      { withCredentials: true }
                    ).catch(() => {});
                  });
                })
                .catch(() => {});
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
          );
        }
      }, 25000); // 25s adaptive throttle
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeOutboundCount]);

  // 1. Fetch current user profile
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/profile/get-me", {
          withCredentials: true,
        });
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchMe();
  }, []);

  // 2. Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/conversations`, {
        withCredentials: true,
      });
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setIsLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 3. Adaptive Sync Strategy (TransportAdapter)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        // Tab visible -> immediate sync catchup
        fetchConversations();
        if (activeConvId) {
          fetchMessages(activeConvId, null, false);
        }
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      // Process offline queue
      flushOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Adaptive polling loop
    const scheduleNextSync = () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

      if (document.hidden) {
        // Tab backgrounded: pause polling
        return;
      }

      const pollInterval = activeConvId ? 2500 : 10000;

      syncTimerRef.current = setTimeout(async () => {
        if (!document.hidden) {
          if (activeConvId) {
            await fetchMessagesSilently(activeConvId);
          } else {
            await fetchConversations();
          }
        }
        scheduleNextSync();
      }, pollInterval);
    };

    scheduleNextSync();

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [activeConvId, fetchConversations]);

  // Fetch custom categories for active conversation
  const fetchConversationCategories = useCallback(async (convId) => {
    if (!convId) {
      setConversationCategories([]);
      return;
    }
    try {
      const res = await axios.get(
        `${API_BASE}/conversations/${convId}/chapters`,
        { withCredentials: true }
      );
      setConversationCategories(res.data.chapters || []);
    } catch (err) {
      console.error("Failed to fetch conversation categories", err);
    }
  }, []);

  useEffect(() => {
    if (activeConvId) {
      setActiveCategoryId(null);
      setCategoryFilteredMessages(null);
      fetchConversationCategories(activeConvId);
    }
  }, [activeConvId, fetchConversationCategories]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterByCategory = async (category) => {
    if (activeCategoryId === category._id) {
      setActiveCategoryId(null);
      setCategoryFilteredMessages(null);
      return;
    }

    setActiveCategoryId(category._id);
    try {
      const res = await axios.get(
        `${API_BASE}/chapters/${category._id}/messages`,
        { withCredentials: true }
      );
      setCategoryFilteredMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load category messages", err);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const confirmed = await overlayCard.confirm({
      title: "Delete Category?",
      message: "Delete this custom category? Messages will remain in the conversation.",
      confirmText: "Delete Category",
      isDanger: true,
    });
    if (!confirmed) return;
    try {
      await axios.delete(`${API_BASE}/chapters/${categoryId}`, { withCredentials: true });
      setActiveCategoryId(null);
      setCategoryFilteredMessages(null);
      if (activeConvId) fetchConversationCategories(activeConvId);
      overlayCard.success("Category deleted", { title: "Deleted" });
    } catch (err) {
      console.error("Failed to delete category", err);
      overlayCard.error("Failed to delete category");
    }
  };

  // 4. Fetch messages for active conversation
  const fetchMessages = async (convId, cursor = null, appendOlder = false) => {
    if (!convId) return;
    try {
      if (appendOlder) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingMessages(true);
      }

      const url = `${API_BASE}/conversations/${convId}/messages?limit=30${
        cursor ? `&cursor=${cursor}` : ""
      }`;
      const res = await axios.get(url, { withCredentials: true });

      const newMsgs = res.data.messages || [];
      setHasMoreMessages(res.data.hasMore);
      setNextCursor(res.data.nextCursor);

      if (appendOlder) {
        setMessages((prev) => [...newMsgs, ...prev]);
      } else {
        setMessages(newMsgs);
        scrollToBottom();
        // Mark conversation read
        axios.post(
          `${API_BASE}/conversations/${convId}/read`,
          {},
          { withCredentials: true }
        ).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMore(false);
    }
  };

  // Silent sync to avoid jitter
  const fetchMessagesSilently = async (convId) => {
    if (!convId || isLoadingMessages) return;
    try {
      const url = `${API_BASE}/conversations/${convId}/messages?limit=30`;
      const res = await axios.get(url, { withCredentials: true });
      const incoming = res.data.messages || [];

      // If active conversation has incoming messages from others, mark as read
      const hasUnreadFromOthers = incoming.some(
        (m) => m.senderId && m.senderId !== currentUser?.userId
      );
      if (hasUnreadFromOthers) {
        axios
          .post(`${API_BASE}/conversations/${convId}/read`, {}, { withCredentials: true })
          .catch(() => {});
      }

      setMessages((prev) => {
        // Detect newly arrived messages from other users
        const prevIds = new Set(prev.map((m) => m._id));
        const hasNewFromOthers = incoming.some(
          (m) => !prevIds.has(m._id) && m.senderId && m.senderId !== currentUser?.userId
        );
        if (hasNewFromOthers) {
          pulse.messageReceived();
        }

        // Find optimistic items that haven't been confirmed yet
        const pending = prev.filter((m) => m.isOptimistic && m.status === "sending");
        const map = new Map();

        // Index verified incoming messages
        incoming.forEach((m) => {
          map.set(m._id, m);
          if (m.clientMessageId) {
            map.set(m.clientMessageId, m);
          }
        });

        // Add pending optimistic messages that aren't acknowledged yet
        const unacked = pending.filter(
          (p) => !map.has(p.clientMessageId) && !map.has(p._id)
        );

        // Deduplicate incoming messages by _id
        const uniqueMessages = Array.from(new Set(incoming.map((m) => m._id)))
          .map((id) => map.get(id))
          .filter(Boolean);

        return [...uniqueMessages, ...unacked].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
    } catch {
      // Background sync silent fail
    }
  };

  // Real-time synchronization via AdaptivePollingAdapter
  useEffect(() => {
    if (!activeConvId) return;

    const transport = new AdaptivePollingAdapter({
      activeIntervalMs: 2500,
      idleIntervalMs: 10000,
      fetchFn: async () => {
        await fetchMessagesSilently(activeConvId);
        await fetchConversations();
      },
    });

    transport.start();

    return () => {
      transport.stop();
    };
  }, [activeConvId]);

  // In-conversation search handler
  const handlePerformSearch = useCallback(
    async (query, category) => {
      if (!activeConvId) return;
      try {
        setIsSearching(true);
        const res = await axios.get(
          `${API_BASE}/conversations/${activeConvId}/search`,
          {
            params: { query, category },
            withCredentials: true,
          }
        );
        setSearchResults(res.data.results || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    },
    [activeConvId]
  );

  useEffect(() => {
    if (isSearchOpen && activeConvId) {
      const delay = setTimeout(() => {
        handlePerformSearch(searchQueryText, searchCategory);
      }, 250);
      return () => clearTimeout(delay);
    }
  }, [
    isSearchOpen,
    searchQueryText,
    searchCategory,
    activeConvId,
    handlePerformSearch,
  ]);

  // Message-to-Object transformation ("Turn into...")
  const handleTurnInto = (type) => {
    const selectedMsgs = messages.filter((m) =>
      selectedMessageIds.includes(m._id)
    );
    const firstMsgText = selectedMsgs[0]?.text || "";

    if (type === "poll") {
      setWidgetModalType("poll");
      setWidgetModalText(firstMsgText);
      setIsWidgetModalOpen(true);
    } else if (type === "checklist") {
      setWidgetModalType("checklist");
      setWidgetModalText(firstMsgText || "Shared Checklist");
      setIsWidgetModalOpen(true);
    } else if (type === "meeting_point") {
      setWidgetModalType("meeting_point");
      setWidgetModalText(firstMsgText);
      setIsWidgetModalOpen(true);
    } else if (type === "question") {
      setWidgetModalType("question");
      setWidgetModalText(firstMsgText);
      setIsWidgetModalOpen(true);
    } else if (type === "experience") {
      setExperienceInitialTitle(firstMsgText || "Outing");
      setIsExperienceModalOpen(true);
    } else if (type === "chapter") {
      setIsChapterModalOpen(true);
    } else if (type === "moment") {
      setMomentInitialTitle(firstMsgText || "Memorable Moment");
      setIsMomentModalOpen(true);
    }
  };

  // 5. Select active conversation
  const handleSelectConversation = (conv) => {
    setActiveConvId(conv._id);
    setSelectedMessageIds([]);
    setIsSelectMode(false);
    setReplyMessage(null);
    setSelectedCelebration(null);
    fetchMessages(conv._id);

    // Setup target user for contact identity & relationship modal
    const otherMember = conv.participants?.find(
      (p) => p.userId !== currentUser?.userId
    );
    if (otherMember) {
      setTargetContactUser(otherMember);
    }
  };

  // 6. Keyword detection for celebration suggestion chip
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // Detect celebration keywords
    let matched = null;
    for (const rule of CELEBRATION_KEYWORDS) {
      if (rule.match.test(val)) {
        matched = rule;
        break;
      }
    }

    if (matched && !selectedCelebration) {
      setSuggestedCelebration(matched);
    } else {
      setSuggestedCelebration(null);
    }
  };

  // 7. Send message with idempotency & offline queue
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedCelebration) || !activeConvId) return;

    const clientMsgId = `msg_client_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const textToSend = inputText.trim();
    const celebrationToSend = selectedCelebration;

    // Optimistic message object
    const optimisticMessage = {
      _id: `temp_${clientMsgId}`,
      clientMessageId: clientMsgId,
      conversationId: activeConvId,
      senderId: currentUser?.userId,
      senderName: currentUser?.name || currentUser?.userName || "You",
      senderAvatar: currentUser?.profilePhoto || "",
      type: celebrationToSend ? "celebration" : "text",
      text: textToSend,
      celebrationType: celebrationToSend,
      reactions: [],
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      status: "sending",
      replyPreview: replyMessage
        ? {
            messageId: replyMessage._id,
            senderName: replyMessage.senderName,
            textPreview: replyMessage.text,
          }
        : null,
    };

    // Update UI immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    pulse.messageSent();
    setInputText("");
    setReplyMessage(null);
    setSelectedCelebration(null);
    setSuggestedCelebration(null);
    scrollToBottom();

    // Trigger local particle effect if celebration chosen
    if (celebrationToSend) {
      setActiveCelebrationOverlay(celebrationToSend);
    }

    // Attempt network dispatch
    try {
      setIsSending(true);
      const res = await axios.post(
        `${API_BASE}/conversations/${activeConvId}/messages`,
        {
          clientMessageId: clientMsgId,
          text: textToSend,
          type: celebrationToSend ? "celebration" : "text",
          celebrationType: celebrationToSend,
          replyTo: replyMessage?._id || null,
        },
        { withCredentials: true }
      );

      const serverMsg = res.data.message;

      // Replace optimistic message with verified server message
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMsgId
            ? { ...serverMsg, status: "sent" }
            : m
        )
      );

      fetchConversations();
    } catch (err) {
      console.warn("Message delivery failed or offline. Queuing...", err);
      // Mark as queued locally
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMsgId ? { ...m, status: "queued" } : m
        )
      );

      setOfflineQueue((prev) => [
        ...prev,
        {
          conversationId: activeConvId,
          clientMessageId: clientMsgId,
          text: textToSend,
          type: celebrationToSend ? "celebration" : "text",
          celebrationType: celebrationToSend,
          replyTo: replyMessage?._id || null,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Flush offline queue when reconnected
  const flushOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    const queue = [...offlineQueue];
    setOfflineQueue([]);

    for (const item of queue) {
      try {
        const res = await axios.post(
          `${API_BASE}/conversations/${item.conversationId}/messages`,
          item,
          { withCredentials: true }
        );
        const serverMsg = res.data.message;
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === item.clientMessageId
              ? { ...serverMsg, status: "sent" }
              : m
          )
        );
      } catch (err) {
        console.error("Queue retry failed for", item.clientMessageId);
      }
    }
    fetchConversations();
  };

  // 8. Toggle Emoji Reaction
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const res = await axios.post(
        `${API_BASE}/messages/${messageId}/reaction`,
        { emoji },
        { withCredentials: true }
      );

      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, reactions: res.data.reactions } : m
        )
      );
      setActiveReactionMsgId(null);
    } catch (err) {
      console.error("Failed to toggle reaction", err);
    }
  };

  // 9. Soft Delete Message
  const handleDeleteMessage = async (messageId, forEveryone = false) => {
    try {
      await axios.delete(`${API_BASE}/messages/${messageId}`, {
        data: { forEveryone },
        withCredentials: true,
      });

      if (forEveryone) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, isDeletedForEveryone: true, text: "This message was deleted" }
              : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  // 10. Multi-select handlers for "Select -> Organize"
  const toggleMessageSelect = (msgId) => {
    setSelectedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const handleCopySelected = () => {
    const selectedTexts = messages
      .filter((m) => selectedMessageIds.includes(m._id))
      .map((m) => `${m.senderName}: ${m.text}`)
      .join("\n");
    navigator.clipboard.writeText(selectedTexts);
    overlayCard.success(`Copied ${selectedMessageIds.length} messages to clipboard! 📋`, { title: "Copied" });
    setSelectedMessageIds([]);
    setIsSelectMode(false);
  };

  const handleDeleteSelected = async () => {
    const confirmed = await overlayCard.confirm({
      title: "Delete Messages?",
      message: `Delete ${selectedMessageIds.length} messages? This cannot be undone.`,
      confirmText: "Delete",
      isDanger: true,
    });
    if (!confirmed) return;
    for (const id of selectedMessageIds) {
      await handleDeleteMessage(id, false);
    }
    setSelectedMessageIds([]);
    setIsSelectMode(false);
  };

  // 11. Open new chat modal & fetch boarded friends
  const handleOpenNewChatModal = async () => {
    try {
      // 1. Fetch user's actual boarded crew members
      const res = await axios.get("http://localhost:3000/api/profile/crew", {
        withCredentials: true,
      });
      const crewList = res.data.crew || [];
      if (crewList.length > 0) {
        setAvailableCrew(crewList);
      } else {
        // Fallback: if no boarded crew, also check suggestions
        const sugRes = await axios.get("http://localhost:3000/api/profile/suggestions", {
          withCredentials: true,
        });
        setAvailableCrew(sugRes.data.suggestions || sugRes.data.profiles || []);
      }
      setNewChatModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch crew members for chat", err);
      try {
        const sugRes = await axios.get("http://localhost:3000/api/profile/suggestions", {
          withCredentials: true,
        });
        setAvailableCrew(sugRes.data.suggestions || sugRes.data.profiles || []);
      } catch {
        setAvailableCrew([]);
      }
      setNewChatModalOpen(true);
    }
  };

  const handleStartChatWithCrew = async (targetUserId) => {
    try {
      const res = await axios.post(
        `${API_BASE}/conversations/direct`,
        { targetUserId },
        { withCredentials: true }
      );
      setNewChatModalOpen(false);
      fetchConversations();
      setActiveConvId(res.data.conversation._id);
      fetchMessages(res.data.conversation._id);
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Active conversation object
  const activeConversation = conversations.find((c) => c._id === activeConvId);

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="onboard-chats-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Particle celebration overlay */}
      <CelebrationOverlay
        type={activeCelebrationOverlay}
        onComplete={() => setActiveCelebrationOverlay(null)}
      />

      <div className={`chats-main-wrapper ${isCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* Top brand header bar */}
        <header className="chats-top-bar">
          <div className="chats-header-left">
            <button
              className="chats-menu-toggle lg:hidden cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Toggle Sidebar"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="chats-brand">
              <span className="chats-flight-icon">✈️</span>
              <span className="chats-brand-title">OnBoard Cabin Chat</span>
              <span className="chats-status-pill">
                {isOnline ? "Live 🟢" : "Offline ⚠️"}
              </span>
            </div>
          </div>

          <div className="chats-header-right">
            <Link to="/feed" className="chats-back-feed-btn">
              <i className="fa-solid fa-arrow-left"></i> Feed
            </Link>
          </div>
        </header>

        {/* Chat application body */}
        <div className="chats-container">
          {/* Left Column: Conversations List */}
          <div
            className={`chats-sidebar-col ${
              activeConvId ? "hide-on-mobile" : ""
            }`}
          >
            <div className="conv-list-header">
              <div className="conv-search-box">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Search crew or chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className="conv-new-chat-btn"
                title="Start conversation with Crew"
                onClick={handleOpenNewChatModal}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>

            {/* Conversation list stream */}
            <div className="conv-scroll-list">
              {isLoadingConvs ? (
                <div className="conv-loading-state">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Connecting to cabin...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="conv-empty-list">
                  <span className="empty-emoji">💬</span>
                  <h4>No Chats Yet</h4>
                  <p>Start a conversation with boarded Crew members!</p>
                  <button
                    className="conv-start-first-btn"
                    onClick={handleOpenNewChatModal}
                  >
                    <i className="fa-solid fa-user-plus"></i> Board a Crew Member
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv._id === activeConvId;
                  return (
                    <div
                      key={conv._id}
                      className={`conv-list-item ${isActive ? "active" : ""}`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="conv-avatar-wrapper">
                        <img
                          src={
                            conv.avatar ||
                            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                          }
                          alt={conv.title}
                          className="conv-item-avatar"
                        />
                        <span className="conv-online-dot"></span>
                      </div>

                      <div className="conv-item-info">
                        <div className="conv-item-top">
                          <span className="conv-item-title">{conv.title}</span>
                          <span className="conv-item-time">
                            {conv.lastMessage?.timestamp
                              ? new Date(
                                  conv.lastMessage.timestamp
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <div className="conv-item-bottom">
                          <span className="conv-item-preview">
                            {conv.lastMessage?.isMine && (
                              <span
                                className={`conv-last-msg-status ${
                                  conv.lastMessage.isSeen ? "seen" : "sent"
                                }`}
                                title={conv.lastMessage.isSeen ? "Seen" : "Sent"}
                              >
                                {conv.lastMessage.isSeen ? "✓✓ " : "✓ "}
                              </span>
                            )}
                            {conv.lastMessage?.text || "Started conversation"}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="conv-unread-badge">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation Stream */}
          <div
            className={`chats-stream-col ${
              !activeConvId ? "hide-on-mobile" : ""
            }`}
          >
            {activeConversation ? (
              <>
                {/* Active Chat Header */}
                <div className="stream-header">
                  <div className="stream-header-left">
                    <button
                      className="stream-back-mobile-btn"
                      onClick={() => setActiveConvId(null)}
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div
                      className="stream-user-meta"
                      onClick={() => setIsRelationshipModalOpen(true)}
                    >
                      <img
                        src={
                          activeConversation.avatar ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt="Contact"
                        className="stream-header-avatar"
                      />
                      <div>
                        <div className="stream-header-name">
                          {activeConversation.title}
                          {/* <span className="stream-tag-chip">Crew Member</span> */}
                        </div>
                        {/* <span className="stream-header-status">
                          Around 🟢 • Tap for Relationship Space
                        </span> */}
                      </div>
                    </div>
                  </div>

                  <div className="stream-header-actions">
                    <button
                      className={`header-round-action-btn ${isSearchOpen ? "active" : ""}`}
                      title="Search in conversation"
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </button>

                    {activeOutboundCount > 0 && (
                      <button
                        className="header-live-badge-btn"
                        title="Active Location Sharing Center"
                        onClick={() => setIsLocationCenterOpen(true)}
                      >
                        <span className="live-dot-pulse"></span>
                        <span>Live ({activeOutboundCount})</span>
                      </button>
                    )}

                    <div className="stream-header-menu-container" ref={headerMenuRef}>
                      <button
                        className={`header-round-action-btn ${isHeaderMenuOpen ? "active" : ""}`}
                        title="Conversation Tools & Options"
                        onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>

                      {isHeaderMenuOpen && (
                        <div className="stream-header-dropdown-menu">
                          <button
                            type="button"
                            className="header-dropdown-item"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setIsMediaTimelineOpen(true);
                            }}
                          >
                            <span className="dropdown-item-icon">📸</span>
                            <span>Shared Media Timeline</span>
                          </button>
                          <button
                            type="button"
                            className="header-dropdown-item"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setIsRelationshipModalOpen(true);
                            }}
                          >
                            <span className="dropdown-item-icon">👥</span>
                            <span>Milestones & History</span>
                          </button>
                          <button
                            type="button"
                            className="header-dropdown-item"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setIsContactModalOpen(true);
                            }}
                          >
                            <span className="dropdown-item-icon">🏷</span>
                            <span>Set Contact Nickname</span>
                          </button>
                          <button
                            type="button"
                            className="header-dropdown-item"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setIsSelectMode(!isSelectMode);
                              if (isSelectMode) setSelectedMessageIds([]);
                            }}
                          >
                            <span className="dropdown-item-icon">✓</span>
                            <span>{isSelectMode ? "Exit Select Mode" : "Organize Messages"}</span>
                          </button>
                          <button
                            type="button"
                            className="header-dropdown-item"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setIsLocationCenterOpen(true);
                            }}
                          >
                            <span className="dropdown-item-icon">📍</span>
                            <span>Location Sharing Center</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Custom Categories Bar ── */}
                <div className="conversation-categories-bar">
                  <div className="categories-pills-list">
                    <button
                      type="button"
                      className={`category-pill ${!activeCategoryId ? "active" : ""}`}
                      onClick={() => {
                        setActiveCategoryId(null);
                        setCategoryFilteredMessages(null);
                      }}
                    >
                      <span className="cat-pill-icon">📁</span>
                      <span>All</span>
                    </button>

                    {conversationCategories.map((cat) => (
                      <button
                        key={cat._id}
                        type="button"
                        className={`category-pill ${activeCategoryId === cat._id ? "active" : ""}`}
                        onClick={() => handleFilterByCategory(cat)}
                      >
                        <span className="cat-pill-icon">{cat.coverImage || "🗂"}</span>
                        <span>{cat.name}</span>
                        {cat.messageCount > 0 && (
                          <span className="cat-count-badge">{cat.messageCount}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="add-custom-category-btn"
                    onClick={() => setIsCreateCategoryModalOpen(true)}
                    title="Create custom category"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Category</span>
                  </button>
                </div>

                {/* In-Conversation Search Drawer */}
                {isSearchOpen && (
                  <div className="chat-search-drawer">
                    <div className="chat-search-input-row">
                      <input
                        type="text"
                        placeholder="Search messages, links, locations, polls..."
                        value={searchQueryText}
                        onChange={(e) => setSearchQueryText(e.target.value)}
                        className="chat-search-input"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="chat-search-close-btn"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQueryText("");
                          setSearchResults([]);
                        }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    <div className="chat-search-pills-row">
                      {[
                        { id: "all", label: "All" },
                        { id: "messages", label: "💬 Messages" },
                        { id: "photos", label: "📸 Photos" },
                        { id: "videos", label: "🎥 Videos" },
                        { id: "voice", label: "🎙 Voice" },
                        { id: "links", label: "🔗 Links" },
                        { id: "locations", label: "📍 Locations" },
                        { id: "polls", label: "📊 Polls" },
                        { id: "chapters", label: "🗂 Chapters" },
                        { id: "moments", label: "✨ Moments" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`search-category-pill ${
                            searchCategory === cat.id ? "active" : ""
                          }`}
                          onClick={() => setSearchCategory(cat.id)}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {isSearching && (
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "#64748b",
                          padding: "6px",
                        }}
                      >
                        Searching cabin messages...
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="chat-search-results-box">
                        {searchResults.map((item) => (
                          <div
                            key={item._id}
                            className="chat-search-result-item"
                            onClick={() => {
                              const el = document.getElementById(
                                `msg-${item._id}`
                              );
                              if (el) {
                                el.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                                el.classList.add("msg-highlight-pulse");
                                setTimeout(
                                  () =>
                                    el.classList.remove("msg-highlight-pulse"),
                                  2500
                                );
                              }
                            }}
                          >
                            <div className="result-item-left">
                              <span className="result-item-sender">
                                {item.sender?.firstName ||
                                  item.name ||
                                  item.title ||
                                  "Item"}
                              </span>
                              <span className="result-item-text">
                                {item.text ||
                                  item.description ||
                                  item.notes ||
                                  "Match"}
                              </span>
                            </div>
                            <span className="result-item-date">
                              {new Date(item.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message stream area */}
                <div className="stream-messages-container" ref={messageStreamRef}>
                  {hasMoreMessages && (
                    <div className="load-more-row">
                      <button
                        className="load-more-btn"
                        onClick={() =>
                          fetchMessages(activeConvId, nextCursor, true)
                        }
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          "Load Earlier Moments"
                        )}
                      </button>
                    </div>
                  )}

                  {/* Active Category Filter Strip */}
                  {activeCategoryId && (
                    <div className="active-category-filter-strip">
                      <div className="active-cat-info">
                        <span className="active-cat-icon">
                          {conversationCategories.find((c) => c._id === activeCategoryId)?.coverImage || "📁"}
                        </span>
                        <span className="active-cat-label">
                          Category: <strong>{conversationCategories.find((c) => c._id === activeCategoryId)?.name}</strong>
                        </span>
                        <span className="active-cat-stats">
                          ({(categoryFilteredMessages || []).length} { (categoryFilteredMessages || []).length === 1 ? "message" : "messages"})
                        </span>
                      </div>
                      <div className="active-cat-actions">
                        <button
                          type="button"
                          className="cat-clear-btn"
                          onClick={() => {
                            setActiveCategoryId(null);
                            setCategoryFilteredMessages(null);
                          }}
                        >
                          <i className="fa-solid fa-xmark"></i> Show All
                        </button>
                        <button
                          type="button"
                          className="cat-delete-btn"
                          onClick={() => handleDeleteCategory(activeCategoryId)}
                          title="Delete this custom category"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {isLoadingMessages ? (
                    <div className="stream-loading-state">
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Loading conversation history...</span>
                    </div>
                  ) : (categoryFilteredMessages !== null ? categoryFilteredMessages : messages).length === 0 ? (
                    activeCategoryId ? (
                      <div className="stream-welcome-banner category-empty-banner">
                        <span className="welcome-plane">
                          {conversationCategories.find((c) => c._id === activeCategoryId)?.coverImage || "📁"}
                        </span>
                        <h3>No messages in "{conversationCategories.find((c) => c._id === activeCategoryId)?.name}" yet</h3>
                        <p>Select messages in this conversation and click "Assign to Category" to organize them here.</p>
                        <button
                          type="button"
                          className="category-empty-select-btn"
                          onClick={() => setIsSelectMode(true)}
                        >
                          <i className="fa-solid fa-check-double"></i> Select Messages to Add
                        </button>
                      </div>
                    ) : (
                      <div className="stream-welcome-banner">
                        <span className="welcome-plane">✈️</span>
                        <h3>Boarded & Connected</h3>
                        <p>
                          This is the beginning of your shared travel log with{" "}
                          <strong>{activeConversation.title}</strong>.
                        </p>
                        <p className="welcome-hint">
                          Say hello, drop a memory, or send a celebration vibe!
                        </p>
                      </div>
                    )
                  ) : (
                    (categoryFilteredMessages !== null ? categoryFilteredMessages : messages).map((msg, index) => {
                      const isMine =
                        msg.senderId === currentUser?.userId ||
                        msg.isOptimistic;
                      const isSelected = selectedMessageIds.includes(msg._id);

                      return (
                        <div
                          key={msg._id || msg.clientMessageId || index}
                          className={`message-bubble-row ${
                            isMine ? "mine" : "theirs"
                          } ${isSelected ? "selected-row" : ""}`}
                        >
                          {/* Selection Checkbox */}
                          {isSelectMode && (
                            <div
                              className="message-checkbox-col"
                              onClick={() => toggleMessageSelect(msg._id)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                              />
                            </div>
                          )}

                          <div className="bubble-wrapper">
                            {/* Reply preview snapshot */}
                            {msg.replyPreview && (
                              <div className="bubble-reply-snapshot">
                                <span className="reply-sender">
                                  {msg.replyPreview.senderName}
                                </span>
                                <span className="reply-text">
                                  {msg.replyPreview.textPreview}
                                </span>
                              </div>
                            )}

                            {/* Celebration Header if present */}
                            {msg.celebrationType && (
                              <div
                                className="bubble-celebration-pill"
                                onClick={() =>
                                  setActiveCelebrationOverlay(
                                    msg.celebrationType
                                  )
                                }
                              >
                                <span className="cel-badge-icon">
                                  {CELEBRATION_TYPES.find(
                                    (c) => c.id === msg.celebrationType
                                  )?.icon || "🎉"}
                                </span>
                                <span className="cel-badge-text">
                                  {CELEBRATION_TYPES.find(
                                    (c) => c.id === msg.celebrationType
                                  )?.label || "Celebration"}
                                </span>
                                <i className="fa-solid fa-play play-icon"></i>
                              </div>
                            )}

                            {/* Media Attachment (Photo, Video, Voice) */}
                            {msg.mediaUrl && (
                              <div className="bubble-media-wrapper">
                                {msg.type === "image" ||
                                msg.mediaType?.startsWith("image") ? (
                                  <img
                                    src={msg.mediaUrl}
                                    alt="attachment"
                                    className="bubble-media-img"
                                    onClick={() =>
                                      window.open(msg.mediaUrl, "_blank")
                                    }
                                  />
                                ) : msg.type === "video" ||
                                  msg.mediaType?.startsWith("video") ? (
                                  <video
                                    controls
                                    src={msg.mediaUrl}
                                    className="bubble-media-video"
                                  />
                                ) : msg.type === "voice" ||
                                  msg.mediaType?.startsWith("audio") ? (
                                  <div className="bubble-voice-player">
                                    <audio
                                      controls
                                      src={msg.mediaUrl}
                                      ref={(el) => {
                                        if (
                                          el &&
                                          voicePlaybackSpeeds[msg._id]
                                        ) {
                                          el.playbackRate =
                                            voicePlaybackSpeeds[msg._id];
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="voice-speed-pill-btn"
                                      onClick={() => {
                                        const currentSpeed =
                                          voicePlaybackSpeeds[msg._id] || 1;
                                        const nextSpeed =
                                          currentSpeed === 1
                                            ? 1.5
                                            : currentSpeed === 1.5
                                            ? 2
                                            : 1;
                                        setVoicePlaybackSpeeds((prev) => ({
                                          ...prev,
                                          [msg._id]: nextSpeed,
                                        }));
                                      }}
                                    >
                                      {voicePlaybackSpeeds[msg._id] || 1}x
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {/* Social Widget: Poll, Checklist, Meeting Point, Question */}
                            {msg.widget ? (
                              msg.widget.type === "poll" ? (
                                <PollCard
                                  widget={msg.widget}
                                  currentUserId={currentUser?.userId}
                                  onWidgetUpdated={() =>
                                    fetchMessagesSilently(activeConvId)
                                  }
                                />
                              ) : msg.widget.type === "checklist" ? (
                                <ChecklistCard
                                  widget={msg.widget}
                                  onWidgetUpdated={() =>
                                    fetchMessagesSilently(activeConvId)
                                  }
                                />
                              ) : msg.widget.type === "meeting_point" ? (
                                <MeetingPointCard
                                  widget={msg.widget}
                                  currentUserId={currentUser?.userId}
                                  onOpenMap={(locData) => {
                                    setActiveMapData(locData);
                                    setIsLocationMapOpen(true);
                                  }}
                                  onWidgetUpdated={() =>
                                    fetchMessagesSilently(activeConvId)
                                  }
                                />
                              ) : msg.widget.type === "question" ? (
                                <QuestionCard
                                  widget={msg.widget}
                                  onWidgetUpdated={() =>
                                    fetchMessagesSilently(activeConvId)
                                  }
                                />
                              ) : null
                            ) : msg.experience ? (
                              <ExperienceCard
                                experience={msg.experience}
                                currentUserId={currentUser?.userId}
                                onOpenMap={(locData) => {
                                  setActiveMapData(locData);
                                  setIsLocationMapOpen(true);
                                }}
                                onExperienceUpdated={() =>
                                  fetchMessagesSilently(activeConvId)
                                }
                              />
                            ) : msg.moment ? (
                              <div className="inchat-widget-card moment-card">
                                <div
                                  className="widget-card-badge"
                                  style={{
                                    background: "#ede9fe",
                                    color: "#5445ff",
                                  }}
                                >
                                  <span>✨</span>
                                  <span>
                                    MOMENT •{" "}
                                    {msg.moment.category?.toUpperCase()}
                                  </span>
                                </div>
                                <h4 className="widget-card-title">
                                  {msg.moment.title}
                                </h4>
                                {msg.moment.coverImage && (
                                  <img
                                    src={msg.moment.coverImage}
                                    alt="Moment cover"
                                    className="moment-cover-thumb"
                                  />
                                )}
                                {msg.moment.notes && (
                                  <p className="experience-desc">
                                    {msg.moment.notes}
                                  </p>
                                )}
                              </div>
                            ) : msg.type === "location" ||
                              msg.type === "live_location" ||
                              msg.locationShare ||
                              (msg.locationData &&
                                msg.locationData.latitude) ? (
                              <LocationCard
                                message={msg}
                                currentUserId={currentUser?.userId}
                                onOpenMap={(locData) => {
                                  setActiveMapData(locData);
                                  setIsLocationMapOpen(true);
                                }}
                                onLocationStopped={() => {
                                  fetchMessagesSilently(activeConvId);
                                  refreshActiveSharesCount();
                                }}
                              />
                            ) : (
                              <div className="bubble-text">{msg.text}</div>
                            )}

                            {/* Meta & Status footer */}
                            <div className="bubble-footer">
                              <span className="bubble-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>

                              {isMine && (
                                <span
                                  className={`bubble-status ${
                                    msg.status === "sending"
                                      ? "sending"
                                      : msg.status === "queued"
                                      ? "queued"
                                      : msg.isSeen
                                      ? "seen"
                                      : "sent"
                                  }`}
                                  title={
                                    msg.status === "sending"
                                      ? "Sending..."
                                      : msg.status === "queued"
                                      ? "Offline - Queued"
                                      : msg.isSeen
                                      ? "Seen by recipient"
                                      : "Sent"
                                  }
                                >
                                  {msg.status === "sending" && "↻ Sending..."}
                                  {msg.status === "queued" && "⚠️ Offline"}
                                  {(!msg.status || msg.status === "sent") &&
                                    (msg.isSeen ? (
                                      <>
                                        <svg
                                          className="status-check-icon seen-check"
                                          viewBox="0 0 16 11"
                                          width="15"
                                          height="11"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M1 5.5L4 8.5L10.5 1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M5 5.5L8 8.5L14.5 1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                        <span className="seen-label">Seen</span>
                                      </>
                                    ) : (
                                      <svg
                                        className="status-check-icon sent-check"
                                        viewBox="0 0 11 11"
                                        width="11"
                                        height="11"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M1.5 5.5L4.5 8.5L9.5 2"
                                          stroke="currentColor"
                                          strokeWidth="1.8"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    ))}
                                </span>
                              )}
                            </div>

                            {/* Emoji reactions container */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="bubble-reactions-tray">
                                {msg.reactions.map((r, i) => (
                                  <span
                                    key={i}
                                    className="reaction-badge"
                                    onClick={() =>
                                      handleToggleReaction(msg._id, r.emoji)
                                    }
                                  >
                                    {r.emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quick Message Actions */}
                          {!isSelectMode && (
                            <div
                              className={`bubble-quick-actions ${
                                activeReactionMsgId === msg._id ? "active" : ""
                              }`}
                            >
                              <button
                                className="quick-action-btn"
                                title="React"
                                onClick={() =>
                                  setActiveReactionMsgId(
                                    activeReactionMsgId === msg._id
                                      ? null
                                      : msg._id
                                  )
                                }
                              >
                                <i className="fa-regular fa-face-smile"></i>
                              </button>

                              <button
                                className="quick-action-btn"
                                title="Reply"
                                onClick={() => setReplyMessage(msg)}
                              >
                                <i className="fa-solid fa-reply"></i>
                              </button>

                              {activeReactionMsgId === msg._id && (
                                <div className="floating-reaction-picker">
                                  {["❤️", "🔥", "💀", "🫡", "⚡", "😭"].map(
                                    (emoji) => (
                                      <button
                                        key={emoji}
                                        className="picker-emoji-btn"
                                        onClick={() =>
                                          handleToggleReaction(msg._id, emoji)
                                        }
                                      >
                                        {emoji}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Floating "Select -> Organize" Action Dock */}
                <SelectOrganizeBar
                  selectedCount={selectedMessageIds.length}
                  onReply={() => {
                    const single = messages.find(
                      (m) => m._id === selectedMessageIds[0]
                    );
                    if (single) setReplyMessage(single);
                    setSelectedMessageIds([]);
                    setIsSelectMode(false);
                  }}
                  onPin={() => {
                    overlayCard.success("Message pinned to top of conversation! 📌", { title: "Pinned" });
                    setSelectedMessageIds([]);
                    setIsSelectMode(false);
                  }}
                  onCreateChapter={() => setIsChapterModalOpen(true)}
                  onTurnInto={handleTurnInto}
                  onCopy={handleCopySelected}
                  onDelete={handleDeleteSelected}
                  onClearSelection={() => {
                    setSelectedMessageIds([]);
                    setIsSelectMode(false);
                  }}
                />

                {/* Composer area */}
                <div className="stream-composer-area">
                  {/* Replying banner */}
                  {replyMessage && (
                    <div className="composer-reply-banner">
                      <div className="reply-banner-info">
                        <i className="fa-solid fa-reply"></i>
                        <span>
                          Replying to <strong>{replyMessage.senderName}</strong>:{" "}
                          {replyMessage.text}
                        </span>
                      </div>
                      <button
                        className="reply-banner-close"
                        onClick={() => setReplyMessage(null)}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  )}

                  {/* Contextual Celebration Suggestion Chip */}
                  {suggestedCelebration && !selectedCelebration && (
                    <div className="celebration-suggestion-chip">
                      <span className="suggestion-text">
                        {suggestedCelebration.type === "birthday" && "🎂"}
                        {suggestedCelebration.type === "diwali" && "🪔"}
                        {suggestedCelebration.type === "eid" && "🌙"}
                        {suggestedCelebration.type === "anniversary" && "🥂"}
                        {suggestedCelebration.type === "congrats" && "🎉"}{" "}
                        Looks like a celebration message! Add party effects?
                      </span>
                      <div className="suggestion-actions">
                        <button
                          className="suggestion-add-btn"
                          onClick={() => {
                            setSelectedCelebration(suggestedCelebration.type);
                            setSuggestedCelebration(null);
                          }}
                        >
                          Add Celebration
                        </button>
                        <button
                          className="suggestion-dismiss-btn"
                          onClick={() => setSuggestedCelebration(null)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active Celebration Indicator */}
                  {selectedCelebration && (
                    <div className="composer-selected-celebration-pill">
                      <span className="selected-cel-icon">
                        {CELEBRATION_TYPES.find(
                          (c) => c.id === selectedCelebration
                        )?.icon || "🎉"}
                      </span>
                      <span className="selected-cel-name">
                        Celebration Attached:{" "}
                        {
                          CELEBRATION_TYPES.find(
                            (c) => c.id === selectedCelebration
                          )?.label
                        }
                      </span>
                      <button
                        className="selected-cel-remove"
                        onClick={() => setSelectedCelebration(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Celebration Picker Drawer */}
                  {showCelebrationPicker && (
                    <div className="composer-celebration-picker">
                      <div className="picker-header">
                        <span>Select Celebration Animation</span>
                        <button onClick={() => setShowCelebrationPicker(false)}>
                          ✕
                        </button>
                      </div>
                      <div className="picker-grid">
                        {CELEBRATION_TYPES.map((c) => (
                          <button
                            key={c.id}
                            className="celebration-picker-card"
                            onClick={() => {
                              setSelectedCelebration(c.id);
                              setShowCelebrationPicker(false);
                            }}
                          >
                            <span className="picker-card-icon">{c.icon}</span>
                            <span className="picker-card-label">{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="composer-form">
                    <button
                      type="button"
                      className={`composer-btn celebration-toggle-btn ${
                        selectedCelebration ? "active" : ""
                      }`}
                      title="Add celebration animation (Birthday, Diwali, etc.)"
                      onClick={() =>
                        setShowCelebrationPicker(!showCelebrationPicker)
                      }
                    >
                      🎉
                    </button>

                    <button
                      type="button"
                      className="composer-btn location-toggle-btn"
                      title="Share Location (Snapshot or Live)"
                      onClick={() => setIsLocationModalOpen(true)}
                    >
                      📍
                    </button>

                    <button
                      type="button"
                      className="composer-btn widget-toggle-btn"
                      title="Create Social Widget (Poll, Checklist, Meeting Point, Question)"
                      onClick={() => setIsWidgetModalOpen(true)}
                    >
                      🧩
                    </button>

                    <button
                      type="button"
                      className="composer-btn experience-toggle-btn"
                      title="Plan an Outing or Experience"
                      onClick={() => setIsExperienceModalOpen(true)}
                    >
                      🌴
                    </button>

                    <input
                      type="text"
                      className="composer-input"
                      placeholder={`Message ${activeConversation.title}...`}
                      value={inputText}
                      onChange={handleInputChange}
                    />

                    <button
                      type="submit"
                      className="composer-send-btn"
                      disabled={isSending || (!inputText.trim() && !selectedCelebration)}
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="chats-none-selected-view">
                <div className="none-selected-card">
                  <span className="cabin-plane-icon">✈️</span>
                  <h2>OnBoard Social Cabin</h2>
                  <p>
                    Select a conversation from the left to start chatting,
                    organizing Chapters, or viewing your shared relationship
                    space.
                  </p>
                  <button
                    className="open-crew-modal-btn"
                    onClick={handleOpenNewChatModal}
                  >
                    <i className="fa-solid fa-user-plus"></i> Board a Crew Member
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Creation & Reader Modal */}
      <ChapterModal
        isOpen={isChapterModalOpen}
        onClose={() => {
          setIsChapterModalOpen(false);
          setSelectedMessageIds([]);
          setIsSelectMode(false);
        }}
        conversationId={activeConvId}
        selectedMessageIds={selectedMessageIds}
        onChapterCreated={() => {
          setSelectedMessageIds([]);
          setIsSelectMode(false);
        }}
      />

      {/* Personal Contact Identity Modal ("How I See You") */}
      <ContactIdentityModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        targetUser={targetContactUser}
        onSaved={(updated) => {
          // Update conversation list & active view immediately
          setConversations((prev) =>
            prev.map((c) => {
              if (c._id === activeConvId) {
                return {
                  ...c,
                  title: updated.privateNickname || c.title,
                  avatar: updated.privateAvatar || c.avatar,
                };
              }
              return c;
            })
          );
        }}
      />

      {/* Relationship Space Modal ("You + Person") */}
      <YouAndPersonModal
        isOpen={isRelationshipModalOpen}
        onClose={() => setIsRelationshipModalOpen(false)}
        targetUserId={targetContactUser?.userId}
        currentUserName={currentUser?.name || "You"}
        onOpenEditAlias={() => setIsContactModalOpen(true)}
      />

      {/* Start New Chat Modal */}
      {newChatModalOpen && (
        <div
          className="new-chat-backdrop"
          onClick={() => setNewChatModalOpen(false)}
        >
          <div
            className="new-chat-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="new-chat-header">
              <div className="new-chat-title">
                <span className="icon">✈️</span>
                <h3>Start Chat with Boarded Crew</h3>
              </div>
              <button
                className="close-btn"
                onClick={() => setNewChatModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="new-chat-list">
              {availableCrew.length === 0 ? (
                <div className="new-chat-empty">
                  <p>No available crew members found.</p>
                  <Link to="/feed" className="go-feed-link">
                    Board more travelers from Horizon
                  </Link>
                </div>
              ) : (
                availableCrew.map((crew) => {
                  const targetId = crew.userId || crew.user?._id || crew.user || crew._id;
                  return (
                    <div
                      key={targetId}
                      className="new-chat-item"
                      onClick={() => handleStartChatWithCrew(targetId)}
                    >
                      <img
                        src={
                          crew.profilePhoto ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt={crew.userName}
                        className="crew-avatar"
                      />
                      <div className="crew-info">
                        <span className="crew-name">
                          {crew.name || crew.userName}
                        </span>
                        <span className="crew-handle">@{crew.userName}</span>
                      </div>
                      <button className="crew-select-btn">
                        <i className="fa-solid fa-message"></i> Message
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Location Sharing Modal (Current vs Live Wizard) */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        conversationId={activeConvId}
        conversationMembers={activeConversation?.participants || []}
        currentUserId={currentUser?.userId}
        onLocationSent={(newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
          refreshActiveSharesCount();
          fetchConversations();
        }}
      />

      {/* Zero-Cost Interactive OpenStreetMap Modal */}
      <LocationMapModal
        isOpen={isLocationMapOpen}
        onClose={() => setIsLocationMapOpen(false)}
        locationData={activeMapData}
        onSaveToBoard={async (shareId) => {
          try {
            await axios.post(
              `http://localhost:3000/api/chat/location/${shareId}/save-to-board`,
              {},
              { withCredentials: true }
            );
            overlayCard.success("Location saved to your Board & Memories! ✨", { title: "Location Saved" });
          } catch (err) {
            console.error(err);
          }
        }}
      />

      {/* Active Location Sharing Center Dashboard */}
      <ActiveLocationCenterModal
        isOpen={isLocationCenterOpen}
        onClose={() => setIsLocationCenterOpen(false)}
        onOpenMap={(locData) => {
          setActiveMapData(locData);
          setIsLocationMapOpen(true);
        }}
        onSharesChanged={() => {
          refreshActiveSharesCount();
          if (activeConvId) fetchMessagesSilently(activeConvId);
        }}
      />

      {/* Interactive Social Widgets Modal (Poll, Checklist, Meeting Point, Question) */}
      <WidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => {
          setIsWidgetModalOpen(false);
          setWidgetModalText("");
        }}
        conversationId={activeConvId}
        initialType={widgetModalType}
        initialText={widgetModalText}
        onWidgetCreated={(newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
          fetchConversations();
        }}
      />

      {/* Experience Planning Modal */}
      <ExperienceModal
        isOpen={isExperienceModalOpen}
        onClose={() => {
          setIsExperienceModalOpen(false);
          setExperienceInitialTitle("");
        }}
        conversationId={activeConvId}
        initialTitle={experienceInitialTitle}
        initialLocation={experienceInitialLocation}
        onExperienceCreated={(newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
          fetchConversations();
        }}
      />

      {/* Living Moments Packaging Modal */}
      <MomentModal
        isOpen={isMomentModalOpen}
        onClose={() => {
          setIsMomentModalOpen(false);
          setMomentInitialTitle("");
        }}
        conversationId={activeConvId}
        selectedMessageIds={selectedMessageIds}
        initialTitle={momentInitialTitle}
        onMomentCreated={(newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
          setSelectedMessageIds([]);
          setIsSelectMode(false);
          fetchConversations();
        }}
      />

      {/* Chronological Shared Media Timeline Modal */}
      <MediaTimelineModal
        isOpen={isMediaTimelineOpen}
        onClose={() => setIsMediaTimelineOpen(false)}
        messages={messages}
        onCreateChapterFromMedia={(selectedIds) => {
          setSelectedMessageIds(selectedIds);
          setIsCreateCategoryModalOpen(true);
        }}
        onCreateMomentFromMedia={(selectedIds) => {
          setSelectedMessageIds(selectedIds);
          setIsMomentModalOpen(true);
        }}
      />

      {/* Floating Select & Organize Action Dock */}
      {isSelectMode && selectedMessageIds.length > 0 && (
        <SelectOrganizeBar
          selectedCount={selectedMessageIds.length}
          onReply={() => {
            const target = messages.find((m) => m._id === selectedMessageIds[0]);
            if (target) setReplyMessage(target);
            setSelectedMessageIds([]);
            setIsSelectMode(false);
          }}
          onPin={() => {
            overlayCard.success("Pinned to conversation! 📌", { title: "Pinned" });
            setSelectedMessageIds([]);
            setIsSelectMode(false);
          }}
          onCreateChapter={() => {
            setIsCreateCategoryModalOpen(true);
          }}
          onTurnInto={(type) => {
            if (type === "chapter") {
              setIsCreateCategoryModalOpen(true);
            } else if (type === "checklist") {
              setWidgetModalType("checklist");
              setIsWidgetModalOpen(true);
            } else if (type === "poll") {
              setWidgetModalType("poll");
              setIsWidgetModalOpen(true);
            } else if (type === "meeting_point") {
              setWidgetModalType("meeting_point");
              setIsWidgetModalOpen(true);
            } else if (type === "experience") {
              setIsExperienceModalOpen(true);
            } else if (type === "moment") {
              setIsMomentModalOpen(true);
            }
          }}
          onCopy={() => {
            const texts = messages
              .filter((m) => selectedMessageIds.includes(m._id))
              .map((m) => m.text)
              .join("\n");
            navigator.clipboard.writeText(texts);
            overlayCard.success("Copied to clipboard! 📋", { title: "Copied" });
            setSelectedMessageIds([]);
            setIsSelectMode(false);
          }}
          onDelete={async () => {
            const confirmed = await overlayCard.confirm({
              title: "Delete Messages?",
              message: `Delete ${selectedMessageIds.length} messages? This cannot be undone.`,
              confirmText: "Delete",
              isDanger: true,
            });
            if (confirmed) {
              selectedMessageIds.forEach((id) => handleDeleteMessage(id, false));
              setSelectedMessageIds([]);
              setIsSelectMode(false);
            }
          }}
          onClearSelection={() => {
            setSelectedMessageIds([]);
            setIsSelectMode(false);
          }}
        />
      )}

      {/* Create Custom Category Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        conversationId={activeConvId}
        existingCategories={conversationCategories}
        selectedMessageIds={selectedMessageIds}
        onCategoryCreated={(newCat) => {
          setConversationCategories((prev) => [newCat, ...prev]);
          setActiveCategoryId(newCat._id);
          if (selectedMessageIds.length > 0) {
            setCategoryFilteredMessages(
              messages.filter((m) => selectedMessageIds.includes(m._id))
            );
          }
          setSelectedMessageIds([]);
          setIsSelectMode(false);
          if (activeConvId) fetchConversationCategories(activeConvId);
        }}
        onCategoryUpdated={(catId) => {
          setActiveCategoryId(catId);
          handleFilterByCategory({ _id: catId });
          setSelectedMessageIds([]);
          setIsSelectMode(false);
          if (activeConvId) fetchConversationCategories(activeConvId);
        }}
      />
    </div>
  );
};

export default Chats;
