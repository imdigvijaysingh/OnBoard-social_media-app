import React, { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../context/SidebarContext";
import {
  MOCK_DECKS,
  MOCK_TIMELINE,
  MOCK_BUCKET_LIST,
  MOCK_SCRAPBOOK,
  MOCK_RITUALS,
  MOCK_NOTES,
  CHAT_THEMES,
  NOTIFICATION_SOUNDS,
  DAILY_PROMPTS,
  RELATIONSHIP_LABELS,
} from "../data/dualDeckData";
import "../styles/DualDeck.css";

const AVAILABLE_PARTNERS = [
  {
    id: "user_elena",
    firstName: "Elena",
    lastName: "Rostova",
    userName: "elenarostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Photographer & travel junkie ✈️",
  },
  {
    id: "user_chloe",
    firstName: "Chloe",
    lastName: "Chen",
    userName: "chloechen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    bio: "Coffee snob & digital creator ☕",
  },
  {
    id: "user_maya",
    firstName: "Maya",
    lastName: "Lin",
    userName: "mayalin",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    bio: "Art, poetry, and good vibes 🎨",
  },
  {
    id: "user_sarah",
    firstName: "Sarah",
    lastName: "Mitchell",
    userName: "sarahmitchell",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    bio: "Creative writer & sunset seeker 🌅",
  },
  {
    id: "user_marcus",
    firstName: "Marcus",
    lastName: "Vance",
    userName: "marcusv",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Building products & hiking peaks 🏔️",
  },
];

const DECK_THEMES = [
  {
    id: "lavender",
    name: "Lavender Dream",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
    accentColor: "#8b5cf6",
    bgPattern: "dots",
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    gradient: "linear-gradient(135deg, #06b6d4, #0ea5e9, #3b82f6)",
    accentColor: "#0ea5e9",
    bgPattern: "waves",
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    gradient: "linear-gradient(135deg, #f59e0b, #f97316, #ef4444)",
    accentColor: "#f97316",
    bgPattern: "dots",
  },
  {
    id: "rose",
    name: "Rose Garden",
    gradient: "linear-gradient(135deg, #ec4899, #f43f5e, #e11d48)",
    accentColor: "#f43f5e",
    bgPattern: "dots",
  },
  {
    id: "forest",
    name: "Forest Calm",
    gradient: "linear-gradient(135deg, #10b981, #059669, #047857)",
    accentColor: "#10b981",
    bgPattern: "dots",
  },
  {
    id: "midnight",
    name: "Midnight Stars",
    gradient: "linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)",
    accentColor: "#818cf8",
    bgPattern: "dots",
  },
];

const EMOJI_OPTIONS = ["💜", "🤝", "✨", "🚀", "🥂", "🌸", "⚡", "🏖️", "🎮", "💫", "☕", "🔥"];

const CreateDeckModal = ({
  isOpen,
  onClose,
  availablePartners,
  selectedPartner,
  onSelectPartner,
  partnerCustomName,
  onChangePartnerCustomName,
  deckName,
  onChangeDeckName,
  deckEmoji,
  onSelectEmoji,
  relationshipLabel,
  onSelectLabel,
  customLabel,
  onChangeCustomLabel,
  theme,
  onSelectTheme,
  startDate,
  onChangeStartDate,
  onCreate,
}) => {
  if (!isOpen) return null;
  return (
    <div className="dd-invite-overlay" onClick={onClose}>
      <div className="dd-invite-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🔗</span> Create a Dual Deck
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              A private, shared space between you and someone special.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: 4 }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* 1. Partner Selection */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
              1. Who are you creating this deck with?
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 10 }}>
              {availablePartners.map((p) => {
                const isSelected = !partnerCustomName.trim() && selectedPartner?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPartner(p);
                      onChangePartnerCustomName("");
                    }}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 14,
                      border: isSelected ? "2px solid #8b5cf6" : "1px solid #e2e8f0",
                      background: isSelected ? "#f5f3ff" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.15s",
                    }}
                  >
                    <img
                      src={p.avatar}
                      alt={p.firstName}
                      style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#6d28d9" : "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.firstName}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        @{p.userName}
                      </div>
                    </div>
                    {isSelected && (
                      <i className="fa-solid fa-circle-check" style={{ color: "#8b5cf6", fontSize: 12 }}></i>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Custom name input */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                placeholder="Or type a friend's name..."
                value={partnerCustomName}
                onChange={(e) => onChangePartnerCustomName(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: partnerCustomName.trim() ? "2px solid #8b5cf6" : "1px solid #e2e8f0",
                  background: partnerCustomName.trim() ? "#f5f3ff" : "#ffffff",
                  fontSize: 12,
                  outline: "none",
                }}
              />
              {partnerCustomName.trim() && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8b5cf6" }}>Custom friend</span>
              )}
            </div>
          </div>

          {/* 2. Deck Name & Emoji */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
              2. Deck Name & Emoji
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                {deckEmoji}
              </div>
              <input
                type="text"
                placeholder={`e.g., ${(partnerCustomName.trim() || selectedPartner?.firstName || "Our Space")} & You`}
                value={deckName}
                onChange={(e) => onChangeDeckName(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => onSelectEmoji(em)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: deckEmoji === em ? "2px solid #8b5cf6" : "1px solid #e2e8f0",
                    background: deckEmoji === em ? "#ede9fe" : "#ffffff",
                    fontSize: 15,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Relationship Label */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
              3. Relationship Label
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
              {RELATIONSHIP_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelectLabel(label)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    border: relationshipLabel === label ? "1.5px solid #8b5cf6" : "1px solid #e2e8f0",
                    background: relationshipLabel === label ? "#8b5cf6" : "#f8fafc",
                    color: relationshipLabel === label ? "white" : "#475569",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {relationshipLabel === "Custom" && (
              <input
                type="text"
                placeholder="Enter custom label (e.g. Travel Twin, Gym Bro)..."
                value={customLabel}
                onChange={(e) => onChangeCustomLabel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  marginTop: 4,
                  outline: "none",
                }}
              />
            )}
          </div>

          {/* 4. Theme & Anniversary Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                4. Space Theme
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {DECK_THEMES.map((th) => (
                  <div
                    key={th.id}
                    onClick={() => onSelectTheme(th)}
                    title={th.name}
                    style={{
                      height: 36,
                      borderRadius: 10,
                      background: th.gradient,
                      cursor: "pointer",
                      border: theme.id === th.id ? "3px solid #0f172a" : "2px solid transparent",
                      transform: theme.id === th.id ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.15s",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                5. Start / Anniversary Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onChangeStartDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  outline: "none",
                  color: "#334155",
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 6, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px 16px",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#64748b",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onCreate}
              style={{
                flex: 2,
                padding: "11px 16px",
                borderRadius: 12,
                border: "none",
                background: theme.gradient,
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <i className="fa-solid fa-sparkles"></i>
              Launch Dual Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TABS = [
  { id: "timeline", label: "Timeline", icon: "fa-solid fa-clock-rotate-left" },
  { id: "bucket", label: "Bucket List", icon: "fa-solid fa-list-check" },
  { id: "scrapbook", label: "Scrapbook", icon: "fa-solid fa-images" },
  { id: "passport", label: "Shared Passport", icon: "fa-solid fa-earth-americas" },
  { id: "rituals", label: "Rituals", icon: "fa-solid fa-repeat" },
  { id: "notes", label: "Love Notes", icon: "fa-solid fa-envelope-open-text" },
];

const DualDeck = () => {
  const { isCollapsed } = useSidebar();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Decks state
  const [localDecks, setLocalDecks] = useState(MOCK_DECKS);
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [activeTab, setActiveTab] = useState("timeline");

  // Create Deck Modal State
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [newDeckPartner, setNewDeckPartner] = useState(AVAILABLE_PARTNERS[0]);
  const [partnerCustomName, setPartnerCustomName] = useState("");
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckEmoji, setNewDeckEmoji] = useState("💜");
  const [newDeckLabel, setNewDeckLabel] = useState("Partner");
  const [newDeckCustomLabel, setNewDeckCustomLabel] = useState("");
  const [newDeckTheme, setNewDeckTheme] = useState(DECK_THEMES[0]);
  const [newDeckStartDate, setNewDeckStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Bucket list filters
  const [bucketCategoryFilter, setBucketCategoryFilter] = useState("All");

  // Scrapbook expanded chapter
  const [expandedChapter, setExpandedChapter] = useState(null);

  // Scrapbook modals & state
  const [isCreateChapterOpen, setIsCreateChapterOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [localScrapbook, setLocalScrapbook] = useState(() => {
    const cloned = {};
    Object.keys(MOCK_SCRAPBOOK).forEach((key) => {
      cloned[key] = MOCK_SCRAPBOOK[key].map((ch) => ({ ...ch, photos: [...ch.photos] }));
    });
    return cloned;
  });
  const [photoUploadPreviews, setPhotoUploadPreviews] = useState([]);
  const [isAddPhotosOpen, setIsAddPhotosOpen] = useState(false);
  const [addPhotosTarget, setAddPhotosTarget] = useState(null); // chapter id
  const [addPhotoPreviews, setAddPhotoPreviews] = useState([]);
  const scrapbookFileRef = React.useRef(null);
  const addPhotosFileRef = React.useRef(null);

  // Notes composer
  const [noteInput, setNoteInput] = useState("");

  // Chat customization modal
  const [isChatCustomizeOpen, setIsChatCustomizeOpen] = useState(false);
  const [chatTheme, setChatTheme] = useState("lavender-dream");
  const [chatSound, setChatSound] = useState("gentle-chime");

  // Add memory modal
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [newMemory, setNewMemory] = useState({ title: "", emoji: "✨", caption: "", date: "" });

  // Add bucket item modal
  const [isAddBucketOpen, setIsAddBucketOpen] = useState(false);
  const [newBucketItem, setNewBucketItem] = useState({ title: "", emoji: "🎯", category: "Fun" });

  // Local state for items (to enable toggling etc)
  const [localBucketList, setLocalBucketList] = useState(() => ({ ...MOCK_BUCKET_LIST }));
  const [localNotes, setLocalNotes] = useState(() => ({ ...MOCK_NOTES }));
  const [localTimeline, setLocalTimeline] = useState(() => ({ ...MOCK_TIMELINE }));

  const selectedDeck = localDecks.find((d) => d.id === selectedDeckId);

  const currentTimeline = useMemo(() => {
    return (localTimeline[selectedDeckId] || []).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [selectedDeckId, localTimeline]);

  const currentBucketList = useMemo(() => {
    const items = localBucketList[selectedDeckId] || [];
    if (bucketCategoryFilter === "All") return items;
    return items.filter((it) => it.category === bucketCategoryFilter);
  }, [selectedDeckId, localBucketList, bucketCategoryFilter]);

  const bucketCategories = useMemo(() => {
    const items = localBucketList[selectedDeckId] || [];
    const cats = ["All", ...new Set(items.map((it) => it.category))];
    return cats;
  }, [selectedDeckId, localBucketList]);

  const bucketProgress = useMemo(() => {
    const items = localBucketList[selectedDeckId] || [];
    const completed = items.filter((it) => it.isCompleted).length;
    return { completed, total: items.length, percent: items.length ? Math.round((completed / items.length) * 100) : 0 };
  }, [selectedDeckId, localBucketList]);

  const currentScrapbook = localScrapbook[selectedDeckId] || [];
  const currentRituals = MOCK_RITUALS[selectedDeckId] || [];
  const currentNotes = localNotes[selectedDeckId] || [];

  const dailyPrompt = useMemo(() => {
    const day = new Date().getDate();
    return DAILY_PROMPTS[day % DAILY_PROMPTS.length];
  }, []);

  // Locations extracted from timeline for passport tab
  const passportLocations = useMemo(() => {
    return (localTimeline[selectedDeckId] || [])
      .filter((e) => e.location)
      .map((e) => ({ name: e.location.name, date: e.date, emoji: e.emoji }));
  }, [selectedDeckId, localTimeline]);

  const handleToggleBucketItem = (itemId) => {
    setLocalBucketList((prev) => {
      const items = [...(prev[selectedDeckId] || [])];
      const idx = items.findIndex((it) => it.id === itemId);
      if (idx === -1) return prev;
      items[idx] = {
        ...items[idx],
        isCompleted: !items[idx].isCompleted,
        completedDate: items[idx].isCompleted ? null : new Date().toISOString().split("T")[0],
      };
      return { ...prev, [selectedDeckId]: items };
    });
  };

  // ─── Scrapbook Handlers ───
  const handleCreateChapter = () => {
    if (!newChapterTitle.trim()) return;
    // Convert previews to photo URLs (in real app, upload to server)
    const photos = photoUploadPreviews.map((p) => p.url);
    const chapter = {
      id: `ch_new_${Date.now()}`,
      title: newChapterTitle.trim(),
      coverPhoto: photos[0] || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400",
      mediaCount: photos.length,
      createdAt: new Date().toISOString().split("T")[0],
      photos,
    };
    setLocalScrapbook((prev) => ({
      ...prev,
      [selectedDeckId]: [...(prev[selectedDeckId] || []), chapter],
    }));
    setNewChapterTitle("");
    setPhotoUploadPreviews([]);
    setIsCreateChapterOpen(false);
  };

  const handleChapterFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoUploadPreviews((prev) => [...prev, { url: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemoveChapterPhoto = (idx) => {
    setPhotoUploadPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOpenAddPhotos = (chapterId) => {
    setAddPhotosTarget(chapterId);
    setAddPhotoPreviews([]);
    setIsAddPhotosOpen(true);
  };

  const handleAddPhotosFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAddPhotoPreviews((prev) => [...prev, { url: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemoveAddPhoto = (idx) => {
    setAddPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmAddPhotos = () => {
    if (!addPhotosTarget || addPhotoPreviews.length === 0) return;
    setLocalScrapbook((prev) => {
      const chapters = [...(prev[selectedDeckId] || [])];
      const idx = chapters.findIndex((ch) => ch.id === addPhotosTarget);
      if (idx === -1) return prev;
      const newPhotos = addPhotoPreviews.map((p) => p.url);
      chapters[idx] = {
        ...chapters[idx],
        photos: [...chapters[idx].photos, ...newPhotos],
        mediaCount: chapters[idx].mediaCount + newPhotos.length,
      };
      // Also update expandedChapter if it's the same
      if (expandedChapter && expandedChapter.id === addPhotosTarget) {
        setExpandedChapter(chapters[idx]);
      }
      return { ...prev, [selectedDeckId]: chapters };
    });
    setIsAddPhotosOpen(false);
    setAddPhotoPreviews([]);
    setAddPhotosTarget(null);
  };

  const handleSendNote = () => {
    if (!noteInput.trim()) return;
    const newNote = {
      id: `note_new_${Date.now()}`,
      from: "user_me",
      text: noteInput.trim(),
      sticker: "💜",
      createdAt: new Date().toISOString(),
      isRead: true,
    };
    setLocalNotes((prev) => ({
      ...prev,
      [selectedDeckId]: [...(prev[selectedDeckId] || []), newNote],
    }));
    setNoteInput("");
  };

  const handleAddMemory = () => {
    if (!newMemory.title.trim()) return;
    const entry = {
      id: `tl_new_${Date.now()}`,
      createdBy: "user_me",
      title: newMemory.title,
      emoji: newMemory.emoji || "✨",
      date: newMemory.date || new Date().toISOString().split("T")[0],
      photos: [],
      caption: newMemory.caption,
      location: null,
      reactions: {},
      isAutoGenerated: false,
    };
    setLocalTimeline((prev) => ({
      ...prev,
      [selectedDeckId]: [...(prev[selectedDeckId] || []), entry],
    }));
    setNewMemory({ title: "", emoji: "✨", caption: "", date: "" });
    setIsAddMemoryOpen(false);
  };

  const handleAddBucketItem = () => {
    if (!newBucketItem.title.trim()) return;
    const item = {
      id: `bl_new_${Date.now()}`,
      title: newBucketItem.title,
      emoji: newBucketItem.emoji || "🎯",
      category: newBucketItem.category || "Fun",
      isCompleted: false,
      completedDate: null,
      completedBy: null,
      addedBy: "user_me",
      isPinned: false,
      linkedTimelineId: null,
    };
    setLocalBucketList((prev) => ({
      ...prev,
      [selectedDeckId]: [...(prev[selectedDeckId] || []), item],
    }));
    setNewBucketItem({ title: "", emoji: "🎯", category: "Fun" });
    setIsAddBucketOpen(false);
  };

  const handleCreateDeck = () => {
    let partner = newDeckPartner;
    if (partnerCustomName.trim()) {
      partner = {
        id: `user_${Date.now()}`,
        firstName: partnerCustomName.trim(),
        lastName: "",
        userName: partnerCustomName.trim().toLowerCase().replace(/\s+/g, ""),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(partnerCustomName.trim())}`,
      };
    }

    if (!partner) return;

    const finalName = newDeckName.trim() || `${partner.firstName} & You ${newDeckEmoji}`;
    const finalLabel = newDeckLabel === "Custom" ? (newDeckCustomLabel.trim() || "Special") : newDeckLabel;
    const newDeckId = `deck_${Date.now()}`;
    const startD = newDeckStartDate || new Date().toISOString().split("T")[0];
    const diffDays = Math.max(1, Math.floor((new Date() - new Date(startD)) / (1000 * 60 * 60 * 24)));

    const createdDeck = {
      id: newDeckId,
      name: finalName,
      emoji: newDeckEmoji,
      createdAt: new Date().toISOString(),
      partner: partner,
      me: {
        id: "user_me",
        firstName: "You",
        lastName: "",
        userName: "me",
        avatar: "https://i.pravatar.cc/150?img=12",
      },
      stats: {
        daysTogether: diffDays,
        memories: 1,
        goalsCompleted: 0,
        totalGoals: 2,
        activeStreaks: 1,
        notesExchanged: 1,
      },
      theme: newDeckTheme,
      chatCustomization: {
        theme: newDeckTheme.id,
        wallpaper: null,
        notificationSound: "gentle-chime",
        bubbleColor: newDeckTheme.accentColor,
      },
      relationshipLabel: finalLabel,
      anniversaryDate: startD,
    };

    setLocalDecks((prev) => [createdDeck, ...prev]);

    // Starter timeline
    setLocalTimeline((prev) => ({
      ...prev,
      [newDeckId]: [
        {
          id: `tl_${Date.now()}`,
          createdBy: "user_me",
          title: "Created our Dual Deck 🚀",
          emoji: newDeckEmoji,
          date: startD,
          photos: [],
          caption: `Our private universe begins today with ${partner.firstName}! Let's make memories.`,
          location: { name: "New Chapter, OnBoard", coords: null },
          reactions: { user_me: "💜" },
          isAutoGenerated: true,
        },
      ],
    }));

    // Starter bucket list
    setLocalBucketList((prev) => ({
      ...prev,
      [newDeckId]: [
        {
          id: `bl_1_${Date.now()}`,
          title: "Take our first Dual Deck photo together",
          emoji: "📸",
          category: "Memories",
          isCompleted: false,
          completedDate: null,
          completedBy: null,
          addedBy: "user_me",
          isPinned: true,
          linkedTimelineId: null,
        },
        {
          id: `bl_2_${Date.now()}`,
          title: "Plan our next big hangout or road trip",
          emoji: "🗺️",
          category: "Travel",
          isCompleted: false,
          completedDate: null,
          completedBy: null,
          addedBy: "user_me",
          isPinned: false,
          linkedTimelineId: null,
        },
      ],
    }));

    // Starter love notes
    setLocalNotes((prev) => ({
      ...prev,
      [newDeckId]: [
        {
          id: `note_${Date.now()}`,
          from: "user_me",
          text: `Welcome to our Dual Deck, ${partner.firstName}! This is our private corner of the universe. ✨`,
          sticker: newDeckEmoji,
          createdAt: new Date().toISOString(),
          isRead: true,
        },
      ],
    }));

    // Starter scrapbook
    setLocalScrapbook((prev) => ({
      ...prev,
      [newDeckId]: [
        {
          id: `ch_${Date.now()}`,
          title: "Chapter 1: The Beginning ✨",
          photos: [],
        },
      ],
    }));

    // Open the new deck immediately
    setSelectedDeckId(newDeckId);
    setActiveTab("timeline");
    setIsCreateDeckOpen(false);

    // Reset form
    setNewDeckName("");
    setPartnerCustomName("");
    setNewDeckEmoji("💜");
    setNewDeckLabel("Partner");
    setNewDeckCustomLabel("");
  };

  const createDeckModalProps = {
    isOpen: isCreateDeckOpen,
    onClose: () => setIsCreateDeckOpen(false),
    availablePartners: AVAILABLE_PARTNERS,
    selectedPartner: newDeckPartner,
    onSelectPartner: setNewDeckPartner,
    partnerCustomName,
    onChangePartnerCustomName: setPartnerCustomName,
    deckName: newDeckName,
    onChangeDeckName: setNewDeckName,
    deckEmoji: newDeckEmoji,
    onSelectEmoji: setNewDeckEmoji,
    relationshipLabel: newDeckLabel,
    onSelectLabel: setNewDeckLabel,
    customLabel: newDeckCustomLabel,
    onChangeCustomLabel: setNewDeckCustomLabel,
    theme: newDeckTheme,
    onSelectTheme: setNewDeckTheme,
    startDate: newDeckStartDate,
    onChangeStartDate: setNewDeckStartDate,
    onCreate: handleCreateDeck,
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatNoteTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ─── DECK SELECTOR VIEW ───
  if (!selectedDeckId) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased overflow-x-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
        }`}>
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <i className="fa-solid fa-bars text-lg"></i>
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>🔗 Dual Deck</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 hidden sm:inline-block">
                    Relationship Space
                  </span>
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Private shared spaces with the people who matter most.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateDeckOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Create Deck</span>
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
            {/* Hero */}
            <div className="relative rounded-3xl overflow-hidden text-white p-6 sm:p-8 shadow-xl border border-purple-800/30" style={{background: "linear-gradient(135deg, #1e1b4b, #312e81, #5b21b6)"}}>
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-black mb-2">Your Shared Spaces</h2>
                <p className="text-sm text-purple-200 leading-relaxed">
                  A private, growing digital space for the relationships that matter. 
                  Share memories, track goals, keep rituals alive, and drop love notes — all in one place.
                </p>
              </div>
            </div>

            {/* Deck Cards */}
            {localDecks.length === 0 ? (
              <div className="dd-empty-state">
                <span className="dd-empty-state-icon">🔗</span>
                <p className="dd-empty-state-text">No Dual Decks yet</p>
                <p className="dd-empty-state-subtext">Create one with someone special to get started.</p>
                <button
                  onClick={() => setIsCreateDeckOpen(true)}
                  className="mt-4 px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Create Your First Deck</span>
                </button>
              </div>
            ) : (
              <div className="dd-deck-selector">
                {localDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="dd-deck-card"
                    onClick={() => { setSelectedDeckId(deck.id); setActiveTab("timeline"); }}
                    style={{ "--card-gradient": deck.theme.gradient }}
                  >
                    <div style={{ background: deck.theme.gradient, position: "absolute", top: 0, left: 0, right: 0, height: 4, borderRadius: "20px 20px 0 0" }}></div>
                    <div className="dd-deck-card-avatars">
                      <img src={deck.me.avatar} alt={deck.me.firstName} />
                      <div className="dd-deck-card-link-icon" style={{ background: deck.theme.accentColor }}>
                        <i className="fa-solid fa-link"></i>
                      </div>
                      <img src={deck.partner.avatar} alt={deck.partner.firstName} />
                    </div>
                    <div className="dd-deck-card-name">{deck.name}</div>
                    <span
                      className="dd-deck-card-label"
                      style={{ background: `${deck.theme.accentColor}15`, color: deck.theme.accentColor, border: `1px solid ${deck.theme.accentColor}30` }}
                    >
                      {deck.relationshipLabel}
                    </span>
                    <div className="dd-deck-card-stats">
                      <div className="dd-deck-card-stat">
                        <span className="dd-deck-card-stat-value">{deck.stats.daysTogether}</span>
                        <span className="dd-deck-card-stat-label">Days</span>
                      </div>
                      <div className="dd-deck-card-stat">
                        <span className="dd-deck-card-stat-value">{deck.stats.memories}</span>
                        <span className="dd-deck-card-stat-label">Memories</span>
                      </div>
                      <div className="dd-deck-card-stat">
                        <span className="dd-deck-card-stat-value">{deck.stats.activeStreaks}</span>
                        <span className="dd-deck-card-stat-label">Streaks</span>
                      </div>
                      <div className="dd-deck-card-stat">
                        <span className="dd-deck-card-stat-value">{deck.stats.notesExchanged}</span>
                        <span className="dd-deck-card-stat-label">Notes</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Create New Deck Dashed Card */}
                <div
                  className="dd-deck-card"
                  onClick={() => setIsCreateDeckOpen(true)}
                  style={{
                    border: "2px dashed #c7d2fe",
                    background: "rgba(238, 242, 255, 0.4)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "36px 20px",
                    cursor: "pointer",
                    minHeight: 220,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.background = "rgba(238, 242, 255, 0.8)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#c7d2fe";
                    e.currentTarget.style.background = "rgba(238, 242, 255, 0.4)";
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      marginBottom: 14,
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e1b4b", marginBottom: 6 }}>
                    Create New Deck
                  </h3>
                  <p style={{ fontSize: 12, color: "#64748b", maxWidth: 220, lineHeight: 1.4 }}>
                    Start a private shared universe with a partner, best friend, or sibling.
                  </p>
                </div>
              </div>
            )}
          </main>

          {/* Create Deck Modal */}
          <CreateDeckModal {...createDeckModalProps} />
        </div>
      </div>
    );
  }

  // ─── INDIVIDUAL DECK VIEW ───
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
      }`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <i className="fa-solid fa-bars text-lg"></i>
            </button>
            <button
              onClick={() => setSelectedDeckId(null)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Back to all decks"
            >
              <i className="fa-solid fa-arrow-left text-sm"></i>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{selectedDeck?.name || "Dual Deck"}</span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                with {selectedDeck?.partner.firstName} {selectedDeck?.partner.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* New Deck Button */}
            <button
              onClick={() => setIsCreateDeckOpen(true)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Create another Dual Deck"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span className="hidden sm:inline">New Deck</span>
            </button>
            {/* Chat Customization Button */}
            <button
              onClick={() => setIsChatCustomizeOpen(true)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Chat & theme customization"
            >
              <i className="fa-solid fa-palette text-sm"></i>
              <span className="hidden sm:inline">Customize</span>
            </button>
            {/* Settings */}
            <button
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Deck settings"
            >
              <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-5">
          {/* ─── Deck Header ─── */}
          {selectedDeck && (
            <div className="dd-header" style={{ background: selectedDeck.theme.gradient }}>
              <div className="dd-header-content">
                <div className="flex items-center gap-0">
                  <div className="dd-header-pair">
                    <img className="dd-header-avatar" src={selectedDeck.me.avatar} alt="You" />
                    <div className="dd-header-link-icon">
                      <i className="fa-solid fa-link"></i>
                    </div>
                    <img className="dd-header-avatar" src={selectedDeck.partner.avatar} alt={selectedDeck.partner.firstName} />
                  </div>
                  <div className="dd-header-info">
                    <div className="dd-header-name">{selectedDeck.name}</div>
                    <span className="dd-header-label">{selectedDeck.relationshipLabel}</span>
                  </div>
                </div>
                <div className="dd-header-stats">
                  <div className="dd-header-stat">
                    <div className="dd-header-stat-value">{selectedDeck.stats.daysTogether}</div>
                    <div className="dd-header-stat-label">Days Together</div>
                  </div>
                  <div className="dd-header-stat">
                    <div className="dd-header-stat-value">{selectedDeck.stats.memories}</div>
                    <div className="dd-header-stat-label">Memories</div>
                  </div>
                  <div className="dd-header-stat">
                    <div className="dd-header-stat-value">{selectedDeck.stats.goalsCompleted}/{selectedDeck.stats.totalGoals}</div>
                    <div className="dd-header-stat-label">Goals</div>
                  </div>
                  <div className="dd-header-stat">
                    <div className="dd-header-stat-value">{selectedDeck.stats.activeStreaks}</div>
                    <div className="dd-header-stat-label">Streaks</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab Navigation ─── */}
          <div className="dd-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`dd-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => { setActiveTab(tab.id); setExpandedChapter(null); }}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB CONTENT */}
          {/* ═══════════════════════════════════════════════════ */}

          {/* ─── TIMELINE TAB ─── */}
          {activeTab === "timeline" && (
            <div className="dd-timeline">
              {currentTimeline.length === 0 ? (
                <div className="dd-empty-state">
                  <span className="dd-empty-state-icon">🕰️</span>
                  <p className="dd-empty-state-text">Your story starts here</p>
                  <p className="dd-empty-state-subtext">Add your first memory to begin the timeline.</p>
                </div>
              ) : (
                currentTimeline.map((entry) => (
                  <div key={entry.id} className="dd-timeline-entry">
                    <div className={`dd-timeline-dot ${entry.isAutoGenerated ? "auto" : ""}`}></div>
                    <div className={`dd-timeline-card ${entry.isAutoGenerated ? "auto" : ""}`}>
                      <div className="dd-timeline-card-header">
                        <div className="dd-timeline-card-title">
                          <span>{entry.emoji}</span>
                          <span>{entry.title}</span>
                          {entry.isAutoGenerated && (
                            <span className="dd-timeline-auto-badge">
                              <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 9, marginRight: 3 }}></i>
                              Auto
                            </span>
                          )}
                        </div>
                        <span className="dd-timeline-card-date">{formatDate(entry.date)}</span>
                      </div>

                      {entry.photos && entry.photos.length > 0 && (
                        <div className="dd-timeline-card-photos">
                          {entry.photos.map((photo, i) => (
                            <img key={i} className="dd-timeline-card-photo" src={photo} alt="" />
                          ))}
                        </div>
                      )}

                      <div className="dd-timeline-card-caption">{entry.caption}</div>

                      {entry.location && (
                        <div className="dd-timeline-card-location">
                          <i className="fa-solid fa-location-dot"></i>
                          {entry.location.name}
                        </div>
                      )}

                      <div className="dd-timeline-card-reactions">
                        {Object.entries(entry.reactions || {}).map(([userId, emoji]) => (
                          <span key={userId} className="dd-timeline-reaction">
                            {emoji}
                          </span>
                        ))}
                        <span className="dd-timeline-reaction" style={{ color: "#94a3b8", fontSize: 12 }}>
                          <i className="fa-regular fa-face-smile" style={{ fontSize: 13 }}></i>
                          +
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── BUCKET LIST TAB ─── */}
          {activeTab === "bucket" && (
            <div>
              {/* Progress */}
              <div className="dd-bucket-progress">
                <div className="dd-bucket-progress-header">
                  <span className="dd-bucket-progress-label">🎯 Bucket List Progress</span>
                  <span className="dd-bucket-progress-count">{bucketProgress.completed}/{bucketProgress.total} completed</span>
                </div>
                <div className="dd-bucket-progress-bar">
                  <div className="dd-bucket-progress-fill" style={{ width: `${bucketProgress.percent}%` }}></div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="dd-bucket-categories">
                {bucketCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`dd-bucket-category-pill ${bucketCategoryFilter === cat ? "active" : ""}`}
                    onClick={() => setBucketCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items */}
              <div className="dd-bucket-list">
                {/* Pinned first, then uncompleted, then completed */}
                {[...currentBucketList]
                  .sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    if (!a.isCompleted && b.isCompleted) return -1;
                    if (a.isCompleted && !b.isCompleted) return 1;
                    return 0;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`dd-bucket-item ${item.isCompleted ? "completed" : ""} ${item.isPinned ? "pinned" : ""}`}
                      onClick={() => handleToggleBucketItem(item.id)}
                    >
                      <div className={`dd-bucket-checkbox ${item.isCompleted ? "checked" : ""}`}>
                        {item.isCompleted && <i className="fa-solid fa-check" style={{ fontSize: 11 }}></i>}
                      </div>
                      <span className="dd-bucket-item-emoji">{item.emoji}</span>
                      <span className="dd-bucket-item-title">{item.title}</span>
                      {item.isPinned && <span className="dd-bucket-item-pin">📌</span>}
                      {item.isCompleted && item.completedDate && (
                        <span className="dd-bucket-item-date">{formatDate(item.completedDate)}</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ─── SCRAPBOOK TAB ─── */}
          {activeTab === "scrapbook" && (
            <div>
              {expandedChapter ? (
                <div className="dd-scrapbook-expanded">
                  <div className="dd-scrapbook-expanded-header">
                    <h2 className="dd-scrapbook-expanded-title">{expandedChapter.title}</h2>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="dd-scrapbook-expanded-back"
                        onClick={() => handleOpenAddPhotos(expandedChapter.id)}
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", cursor: "pointer" }}
                      >
                        <i className="fa-solid fa-plus" style={{ fontSize: 11, marginRight: 6 }}></i>
                        Add Photos
                      </button>
                      <button className="dd-scrapbook-expanded-back" onClick={() => setExpandedChapter(null)}>
                        <i className="fa-solid fa-arrow-left" style={{ fontSize: 11, marginRight: 6 }}></i>
                        Back
                      </button>
                    </div>
                  </div>
                  <div className="dd-scrapbook-photo-grid">
                    {expandedChapter.photos.map((photo, i) => (
                      <img key={i} className="dd-scrapbook-photo" src={photo} alt="" />
                    ))}
                    {/* Add Photo Placeholder */}
                    <div
                      onClick={() => handleOpenAddPhotos(expandedChapter.id)}
                      className="dd-scrapbook-photo"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f1f5f9",
                        border: "2px dashed #cbd5e1",
                        cursor: "pointer",
                        gap: 6,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.background = "#eef2ff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f1f5f9"; }}
                    >
                      <i className="fa-solid fa-plus" style={{ fontSize: 20, color: "#94a3b8" }}></i>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Add Photos</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="dd-scrapbook-grid">
                  {currentScrapbook.map((chapter) => (
                    <div key={chapter.id} className="dd-scrapbook-chapter" onClick={() => setExpandedChapter(chapter)}>
                      <img className="dd-scrapbook-chapter-cover" src={chapter.coverPhoto} alt={chapter.title} />
                      <div className="dd-scrapbook-chapter-overlay">
                        <div className="dd-scrapbook-chapter-title">{chapter.title}</div>
                        <div className="dd-scrapbook-chapter-count">{chapter.mediaCount} photos</div>
                      </div>
                    </div>
                  ))}
                  {/* Add Chapter Card */}
                  <div
                    className="dd-scrapbook-chapter"
                    onClick={() => setIsCreateChapterOpen(true)}
                    style={{
                      background: "#f1f5f9",
                      border: "2px dashed #cbd5e1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      gap: 8,
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.background = "#eef2ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f1f5f9"; }}
                  >
                    <i className="fa-solid fa-plus" style={{ fontSize: 28, color: "#94a3b8" }}></i>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>New Chapter</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Add a photo album</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── SHARED PASSPORT TAB ─── */}
          {activeTab === "passport" && (
            <div>
              {/* Stats */}
              <div className="dd-passport-stats">
                <div className="dd-passport-stat">
                  <div className="dd-passport-stat-value">{passportLocations.length}</div>
                  <div className="dd-passport-stat-label">Places Visited</div>
                </div>
                <div className="dd-passport-stat">
                  <div className="dd-passport-stat-value">
                    {new Set(passportLocations.map((l) => l.name.split(",").pop()?.trim())).size}
                  </div>
                  <div className="dd-passport-stat-label">Regions</div>
                </div>
                <div className="dd-passport-stat">
                  <div className="dd-passport-stat-value">{currentTimeline.filter((e) => e.location).length}</div>
                  <div className="dd-passport-stat-label">Tagged Memories</div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="dd-passport-map-placeholder">
                <i className="fa-solid fa-map-location-dot" style={{ fontSize: 48, color: "#0ea5e9", marginBottom: 16 }}></i>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0c4a6e", marginBottom: 4 }}>Interactive Map Coming Soon</p>
                <p style={{ fontSize: 12, color: "#64748b" }}>Pin map with heat visualization of your shared adventures.</p>
              </div>

              {/* Place List */}
              {passportLocations.length > 0 && (
                <div className="dd-passport-places">
                  {passportLocations.map((loc, i) => (
                    <div key={i} className="dd-passport-place">
                      <div className="dd-passport-place-pin">
                        <i className="fa-solid fa-location-dot"></i>
                      </div>
                      <div>
                        <div className="dd-passport-place-name">{loc.emoji} {loc.name}</div>
                        <div className="dd-passport-place-date">{formatDate(loc.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── RITUALS TAB ─── */}
          {activeTab === "rituals" && (
            <div className="dd-rituals-grid">
              {currentRituals.length === 0 ? (
                <div className="dd-empty-state" style={{ gridColumn: "1 / -1" }}>
                  <span className="dd-empty-state-icon">🔄</span>
                  <p className="dd-empty-state-text">No rituals yet</p>
                  <p className="dd-empty-state-subtext">Create a shared routine and start building streaks.</p>
                </div>
              ) : (
                currentRituals.map((ritual) => (
                  <div key={ritual.id} className={`dd-ritual-card ${!ritual.isActive ? "inactive" : ""}`}>
                    <div className="dd-ritual-card-header">
                      <span className="dd-ritual-emoji">{ritual.emoji}</span>
                      {ritual.streak > 0 && (
                        <span className={`dd-ritual-streak ${ritual.streak >= 10 ? "fire" : ""}`}>
                          🔥 {ritual.streak}
                        </span>
                      )}
                    </div>
                    <div className="dd-ritual-title">{ritual.title}</div>
                    <div className="dd-ritual-schedule">
                      <i className="fa-regular fa-calendar"></i>
                      {ritual.frequency === "daily"
                        ? `Daily at ${ritual.scheduledTime}`
                        : ritual.frequency === "weekly"
                        ? `Every ${ritual.scheduledDay} at ${ritual.scheduledTime}`
                        : `${ritual.scheduledDay} at ${ritual.scheduledTime}`}
                    </div>
                    {ritual.bestStreak > 0 && (
                      <div className="dd-ritual-best">
                        🏆 Best streak: {ritual.bestStreak} {ritual.frequency === "daily" ? "days" : ritual.frequency === "weekly" ? "weeks" : "months"}
                      </div>
                    )}
                    {ritual.history.length > 0 && (
                      <div className="dd-ritual-history">
                        {ritual.history.slice(0, 3).map((entry, i) => (
                          <div key={i} className="dd-ritual-history-entry">
                            <span className="dd-ritual-history-entry-date">{formatDate(entry.date)}</span>
                            <span>{entry.note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── LOVE NOTES TAB ─── */}
          {activeTab === "notes" && (
            <div className="dd-notes-container">
              {/* Daily Prompt */}
              <div className="dd-notes-daily-prompt">
                <span className="dd-notes-daily-prompt-icon">💡</span>
                <span className="dd-notes-daily-prompt-text">{dailyPrompt}</span>
              </div>

              {/* Note Jar */}
              <div className="dd-notes-jar" title="Shake to read a random note">
                <span className="dd-notes-jar-icon">🫙</span>
                <div className="dd-notes-jar-label">Note Jar — {currentNotes.length} notes</div>
                <div className="dd-notes-jar-sublabel">Tap to read a random past note</div>
              </div>

              {/* Notes List */}
              <div className="dd-notes-list">
                {[...currentNotes]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((note) => (
                    <div
                      key={note.id}
                      className={`dd-note-card ${note.from === "user_me" ? "from-me" : "from-partner"} ${!note.isRead ? "unread" : ""}`}
                    >
                      <span className="dd-note-sticker">{note.sticker}</span>
                      <div className="dd-note-text">{note.text}</div>
                      <div className="dd-note-time">{formatNoteTime(note.createdAt)}</div>
                    </div>
                  ))}
              </div>

              {/* Note Composer */}
              <div className="dd-note-composer" style={{ position: "sticky", bottom: 16 }}>
                <input
                  type="text"
                  placeholder="Drop a note for your person..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendNote()}
                />
                <button className="dd-note-send-btn" onClick={handleSendNote} title="Send note">
                  <i className="fa-solid fa-paper-plane" style={{ fontSize: 13 }}></i>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ─── Floating Action Button ─── */}
        {activeTab === "timeline" && (
          <button className="dd-fab" onClick={() => setIsAddMemoryOpen(true)} title="Add Memory">
            <i className="fa-solid fa-plus"></i>
          </button>
        )}
        {activeTab === "bucket" && (
          <button className="dd-fab" onClick={() => setIsAddBucketOpen(true)} title="Add Bucket Item">
            <i className="fa-solid fa-plus"></i>
          </button>
        )}
        {activeTab === "scrapbook" && !expandedChapter && (
          <button className="dd-fab" onClick={() => setIsCreateChapterOpen(true)} title="New Chapter">
            <i className="fa-solid fa-plus"></i>
          </button>
        )}
        {activeTab === "scrapbook" && expandedChapter && (
          <button className="dd-fab" onClick={() => handleOpenAddPhotos(expandedChapter.id)} title="Add Photos">
            <i className="fa-solid fa-camera"></i>
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* Add Memory Modal */}
      {isAddMemoryOpen && (
        <div className="dd-invite-overlay" onClick={() => setIsAddMemoryOpen(false)}>
          <div className="dd-invite-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: "#0f172a" }}>
              <i className="fa-solid fa-plus-circle" style={{ color: "#8b5cf6", marginRight: 8 }}></i>
              Add a Memory
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Title *</label>
                <input
                  type="text"
                  placeholder="e.g., First Roadtrip 🚗"
                  value={newMemory.title}
                  onChange={(e) => setNewMemory((p) => ({ ...p, title: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Emoji</label>
                  <input
                    type="text"
                    placeholder="✨"
                    value={newMemory.emoji}
                    onChange={(e) => setNewMemory((p) => ({ ...p, emoji: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Date</label>
                  <input
                    type="date"
                    value={newMemory.date}
                    onChange={(e) => setNewMemory((p) => ({ ...p, date: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Caption</label>
                <textarea
                  placeholder="Describe this memory..."
                  value={newMemory.caption}
                  onChange={(e) => setNewMemory((p) => ({ ...p, caption: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical" }}
                ></textarea>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setIsAddMemoryOpen(false)}
                  style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMemory}
                  style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>
                  Add Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Bucket Item Modal */}
      {isAddBucketOpen && (
        <div className="dd-invite-overlay" onClick={() => setIsAddBucketOpen(false)}>
          <div className="dd-invite-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: "#0f172a" }}>
              <i className="fa-solid fa-list-check" style={{ color: "#8b5cf6", marginRight: 8 }}></i>
              Add Bucket List Item
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>What do you want to do? *</label>
                <input
                  type="text"
                  placeholder="e.g., Scuba diving together 🤿"
                  value={newBucketItem.title}
                  onChange={(e) => setNewBucketItem((p) => ({ ...p, title: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Emoji</label>
                  <input
                    type="text"
                    placeholder="🎯"
                    value={newBucketItem.emoji}
                    onChange={(e) => setNewBucketItem((p) => ({ ...p, emoji: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Category</label>
                  <select
                    value={newBucketItem.category}
                    onChange={(e) => setNewBucketItem((p) => ({ ...p, category: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", background: "white" }}
                  >
                    <option>Travel</option>
                    <option>Adventure</option>
                    <option>Cook Together</option>
                    <option>Fitness</option>
                    <option>Fun</option>
                    <option>Sentimental</option>
                    <option>Career</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setIsAddBucketOpen(false)}
                  style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBucketItem}
                  style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>
                  Add to List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Customization Modal */}
      {isChatCustomizeOpen && (
        <div className="dd-invite-overlay" onClick={() => setIsChatCustomizeOpen(false)}>
          <div className="dd-invite-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                <i className="fa-solid fa-palette" style={{ color: "#8b5cf6", marginRight: 8 }}></i>
                Chat & Deck Customization
              </h2>
              <button onClick={() => setIsChatCustomizeOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="dd-chat-customization">
              {/* Relationship Status Banner */}
              <div style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", borderRadius: 16, padding: 16, border: "1px solid #c4b5fd" }}>
                <div className="dd-section-title" style={{ marginBottom: 8 }}>
                  <i className="fa-solid fa-heart" style={{ color: "#8b5cf6" }}></i>
                  Relationship Status in Chat
                </div>
                <p style={{ fontSize: 12, color: "#5b21b6", marginBottom: 10 }}>
                  When you DM {selectedDeck?.partner.firstName}, this status shows in the chat header:
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 12, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 18 }}>{selectedDeck?.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{selectedDeck?.name}</span>
                  <span style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 600 }}>• {selectedDeck?.stats.daysTogether} days</span>
                </div>
              </div>

              {/* Chat Theme */}
              <div>
                <div className="dd-section-title">
                  <i className="fa-solid fa-brush" style={{ color: "#6366f1" }}></i>
                  Chat Theme
                </div>
                <div className="dd-chat-theme-grid">
                  {CHAT_THEMES.map((theme) => (
                    <div
                      key={theme.id}
                      className={`dd-chat-theme-card ${chatTheme === theme.id ? "active" : ""}`}
                      style={{ background: theme.gradient }}
                      onClick={() => setChatTheme(theme.id)}
                    >
                      <span className="dd-chat-theme-preview">{theme.preview}</span>
                      <span className="dd-chat-theme-name">{theme.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Sound */}
              <div>
                <div className="dd-section-title">
                  <i className="fa-solid fa-volume-high" style={{ color: "#6366f1" }}></i>
                  Message Notification Sound
                </div>
                <div className="dd-sound-grid">
                  {NOTIFICATION_SOUNDS.map((sound) => (
                    <div
                      key={sound.id}
                      className={`dd-sound-card ${chatSound === sound.id ? "active" : ""}`}
                      onClick={() => setChatSound(sound.id)}
                    >
                      <span className="dd-sound-icon">{sound.icon}</span>
                      <span className="dd-sound-name">{sound.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save */}
              <button
                onClick={() => setIsChatCustomizeOpen(false)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                }}
              >
                <i className="fa-solid fa-check" style={{ marginRight: 8 }}></i>
                Save Customization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Chapter Modal */}
      {isCreateChapterOpen && (
        <div className="dd-invite-overlay" onClick={() => { setIsCreateChapterOpen(false); setPhotoUploadPreviews([]); setNewChapterTitle(""); }}>
          <div className="dd-invite-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                <i className="fa-solid fa-folder-plus" style={{ color: "#8b5cf6", marginRight: 8 }}></i>
                New Chapter
              </h2>
              <button onClick={() => { setIsCreateChapterOpen(false); setPhotoUploadPreviews([]); setNewChapterTitle(""); }} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Chapter Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Summer 2025 🏖️"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                  autoFocus
                />
              </div>

              {/* Photo Upload Area */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>Add Photos (optional)</label>
                <input
                  ref={scrapbookFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleChapterFileSelect}
                  style={{ display: "none" }}
                />
                <div
                  onClick={() => scrapbookFileRef.current?.click()}
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: 16,
                    padding: "24px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: "#f8fafc",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.background = "#eef2ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
                >
                  <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 28, color: "#94a3b8", marginBottom: 8, display: "block" }}></i>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 2 }}>Click to upload photos</p>
                  <p style={{ fontSize: 11, color: "#94a3b8" }}>JPG, PNG, WEBP — select multiple</p>
                </div>
              </div>

              {/* Photo Previews */}
              {photoUploadPreviews.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                    {photoUploadPreviews.length} photo{photoUploadPreviews.length > 1 ? "s" : ""} selected
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {photoUploadPreviews.map((photo, i) => (
                      <div key={i} style={{ position: "relative", width: 72, height: 72 }}>
                        <img
                          src={photo.url}
                          alt=""
                          style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid #e2e8f0" }}
                        />
                        <button
                          onClick={() => handleRemoveChapterPhoto(i)}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "none",
                            background: "#ef4444",
                            color: "white",
                            fontSize: 10,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                    {/* Add more button */}
                    <div
                      onClick={() => scrapbookFileRef.current?.click()}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        border: "2px dashed #cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        background: "#f8fafc",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; }}
                    >
                      <i className="fa-solid fa-plus" style={{ fontSize: 16, color: "#94a3b8" }}></i>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { setIsCreateChapterOpen(false); setPhotoUploadPreviews([]); setNewChapterTitle(""); }}
                  style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChapter}
                  disabled={!newChapterTitle.trim()}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: newChapterTitle.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#e2e8f0",
                    color: newChapterTitle.trim() ? "white" : "#94a3b8",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: newChapterTitle.trim() ? "pointer" : "not-allowed",
                    boxShadow: newChapterTitle.trim() ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                  }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>
                  Create Chapter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Photos to Chapter Modal */}
      {isAddPhotosOpen && (
        <div className="dd-invite-overlay" onClick={() => { setIsAddPhotosOpen(false); setAddPhotoPreviews([]); }}>
          <div className="dd-invite-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                <i className="fa-solid fa-camera" style={{ color: "#8b5cf6", marginRight: 8 }}></i>
                Add Photos
              </h2>
              <button onClick={() => { setIsAddPhotosOpen(false); setAddPhotoPreviews([]); }} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Upload Area */}
              <input
                ref={addPhotosFileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddPhotosFileSelect}
                style={{ display: "none" }}
              />
              <div
                onClick={() => addPhotosFileRef.current?.click()}
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: 16,
                  padding: "28px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: "#f8fafc",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.background = "#eef2ff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
              >
                <i className="fa-solid fa-images" style={{ fontSize: 32, color: "#94a3b8", marginBottom: 8, display: "block" }}></i>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 2 }}>Click to select photos</p>
                <p style={{ fontSize: 11, color: "#94a3b8" }}>Select multiple photos to add to this chapter</p>
              </div>

              {/* Photo Previews */}
              {addPhotoPreviews.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                    {addPhotoPreviews.length} photo{addPhotoPreviews.length > 1 ? "s" : ""} ready to add
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {addPhotoPreviews.map((photo, i) => (
                      <div key={i} style={{ position: "relative", width: 72, height: 72 }}>
                        <img
                          src={photo.url}
                          alt=""
                          style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid #e2e8f0" }}
                        />
                        <button
                          onClick={() => handleRemoveAddPhoto(i)}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "none",
                            background: "#ef4444",
                            color: "white",
                            fontSize: 10,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                    {/* Add more */}
                    <div
                      onClick={() => addPhotosFileRef.current?.click()}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        border: "2px dashed #cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        background: "#f8fafc",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; }}
                    >
                      <i className="fa-solid fa-plus" style={{ fontSize: 16, color: "#94a3b8" }}></i>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { setIsAddPhotosOpen(false); setAddPhotoPreviews([]); }}
                  style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAddPhotos}
                  disabled={addPhotoPreviews.length === 0}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: addPhotoPreviews.length > 0 ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#e2e8f0",
                    color: addPhotoPreviews.length > 0 ? "white" : "#94a3b8",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: addPhotoPreviews.length > 0 ? "pointer" : "not-allowed",
                    boxShadow: addPhotoPreviews.length > 0 ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                  }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>
                  Add {addPhotoPreviews.length || ""} Photo{addPhotoPreviews.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create Deck Modal in Individual Deck View */}
      <CreateDeckModal {...createDeckModalProps} />
    </div>
  );
};

export default DualDeck;
