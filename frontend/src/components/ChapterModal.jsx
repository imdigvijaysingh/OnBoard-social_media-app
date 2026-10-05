import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const ChapterModal = ({
  isOpen,
  onClose,
  conversationId,
  selectedMessageIds = [],
  onChapterCreated,
}) => {
  const [activeTab, setActiveTab] = useState(
    selectedMessageIds.length > 0 ? "create" : "browse"
  );
  const [chapterName, setChapterName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("conversation_members");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Browse state
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterMessages, setChapterMessages] = useState([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    if (selectedMessageIds.length > 0) {
      setActiveTab("create");
    } else {
      setActiveTab("browse");
    }

    fetchChapters();
  }, [isOpen, conversationId, selectedMessageIds]);

  const fetchChapters = async () => {
    if (!conversationId) return;
    try {
      setIsLoadingChapters(true);
      const res = await axios.get(
        `${API_BASE}/conversations/${conversationId}/chapters`,
        { withCredentials: true }
      );
      setChapters(res.data.chapters || []);
    } catch (err) {
      console.error("Failed to fetch chapters", err);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!chapterName.trim()) {
      setError("Please provide a name for this Chapter.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const res = await axios.post(
        `${API_BASE}/conversations/${conversationId}/chapters`,
        {
          name: chapterName,
          description,
          visibility,
          messageIds: selectedMessageIds,
        },
        { withCredentials: true }
      );

      if (onChapterCreated) {
        onChapterCreated(res.data.chapter);
      }
      setChapterName("");
      setDescription("");
      fetchChapters();
      setActiveTab("browse");
    } catch (err) {
      console.error("Error creating chapter", err);
      setError(err.response?.data?.message || "Failed to create chapter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChapterDetail = async (chapter) => {
    setSelectedChapter(chapter);
    try {
      setIsLoadingMessages(true);
      const res = await axios.get(
        `${API_BASE}/chapters/${chapter._id}/messages`,
        { withCredentials: true }
      );
      setChapterMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load chapter messages", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleExportToBoard = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="chapter-modal-backdrop" onClick={onClose}>
      <div
        className="chapter-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="chapter-modal-header">
          <div className="chapter-title-group">
            <span className="chapter-badge-icon">🗂</span>
            <div>
              <h3>Conversation Chapters</h3>
              <p className="chapter-subtitle">
                Organize messages into living memories • Referenced, never duplicated
              </p>
            </div>
          </div>
          <button className="chapter-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab switch */}
        <div className="chapter-tab-bar">
          <button
            className={`chapter-tab ${activeTab === "browse" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("browse");
              setSelectedChapter(null);
            }}
          >
            <i className="fa-solid fa-book-open"></i> Browse Chapters ({chapters.length})
          </button>
          <button
            className={`chapter-tab ${activeTab === "create" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("create");
              setSelectedChapter(null);
            }}
          >
            <i className="fa-solid fa-plus"></i> Package Selected (
            {selectedMessageIds.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="chapter-modal-body">
          {activeTab === "create" && (
            <form onSubmit={handleCreate} className="chapter-create-form">
              <div className="chapter-selection-preview">
                <i className="fa-solid fa-layer-group"></i>
                <div>
                  <strong>{selectedMessageIds.length} Messages Selected</strong>
                  <p>
                    These messages will be linked into this chapter without creating duplicate data.
                  </p>
                </div>
              </div>

              {error && <div className="chapter-error-pill">{error}</div>}

              <div className="chapter-form-field">
                <label>Chapter Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 🌴 Goa Trip 2026, 🎓 Final Exam Prep, 🍕 Midnight Talks"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  maxLength={60}
                  required
                />
              </div>

              <div className="chapter-form-field">
                <label>Description / Story (Optional)</label>
                <textarea
                  placeholder="What makes this chapter special? Highlights, inside jokes, or memories..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
              </div>

              <div className="chapter-form-field">
                <label>Chapter Privacy</label>
                <div className="chapter-privacy-options">
                  <label
                    className={`privacy-pill ${
                      visibility === "conversation_members" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="conversation_members"
                      checked={visibility === "conversation_members"}
                      onChange={() => setVisibility("conversation_members")}
                    />
                    <span>👥 Conversation Members</span>
                  </label>
                  <label
                    className={`privacy-pill ${
                      visibility === "private" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === "private"}
                      onChange={() => setVisibility("private")}
                    />
                    <span>🔒 Only Me (Private)</span>
                  </label>
                </div>
              </div>

              <div className="chapter-form-actions">
                <button
                  type="button"
                  className="chapter-btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="chapter-btn-primary"
                  disabled={isSubmitting || !chapterName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Packaging...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-box-archive"></i> Save Chapter
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === "browse" && !selectedChapter && (
            <div className="chapter-browse-list">
              {isLoadingChapters ? (
                <div className="chapter-loading-state">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Loading Chapters...</span>
                </div>
              ) : chapters.length === 0 ? (
                <div className="chapter-empty-state">
                  <span className="empty-icon">🌴</span>
                  <h4>No Chapters Created Yet</h4>
                  <p>
                    Select messages in the chat using the checkmarks and package
                    them into memories!
                  </p>
                </div>
              ) : (
                <div className="chapter-grid">
                  {chapters.map((ch) => (
                    <div
                      key={ch._id}
                      className="chapter-card"
                      onClick={() => openChapterDetail(ch)}
                    >
                      <div className="chapter-card-header">
                        <span className="chapter-folder-icon">🗂</span>
                        <span className="chapter-count-tag">
                          {ch.messageCount} msgs
                        </span>
                      </div>
                      <h4 className="chapter-card-name">{ch.name}</h4>
                      {ch.description && (
                        <p className="chapter-card-desc">{ch.description}</p>
                      )}
                      <div className="chapter-card-footer">
                        <span>
                          By {ch.creator?.firstName || "Member"} •{" "}
                          {new Date(ch.createdAt).toLocaleDateString()}
                        </span>
                        <i className="fa-solid fa-chevron-right"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "browse" && selectedChapter && (
            <div className="chapter-reader-view">
              <button
                className="chapter-back-link"
                onClick={() => setSelectedChapter(null)}
              >
                <i className="fa-solid fa-arrow-left"></i> Back to all chapters
              </button>

              <div className="chapter-detail-hero">
                <div className="chapter-detail-meta">
                  <h3>{selectedChapter.name}</h3>
                  {selectedChapter.description && (
                    <p>{selectedChapter.description}</p>
                  )}
                  <div className="chapter-stats-row">
                    <span>
                      <i className="fa-regular fa-message"></i>{" "}
                      {chapterMessages.length} Messages
                    </span>
                    <span>
                      <i className="fa-solid fa-shield-halved"></i>{" "}
                      {selectedChapter.visibility === "private"
                        ? "Private"
                        : "Conversation Members"}
                    </span>
                  </div>
                </div>

                <button
                  className="chapter-export-btn"
                  onClick={handleExportToBoard}
                >
                  <i className="fa-solid fa-share-nodes"></i> Export to Board
                </button>
              </div>

              {exportSuccess && (
                <div className="export-toast">
                  ✨ Chapter successfully pinned as an OnBoard Memory!
                </div>
              )}

              <div className="chapter-messages-stream">
                {isLoadingMessages ? (
                  <div className="chapter-loading-state">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Loading chapter messages...</span>
                  </div>
                ) : chapterMessages.length === 0 ? (
                  <p className="no-messages-text">
                    No active messages found in this chapter.
                  </p>
                ) : (
                  chapterMessages.map((msg) => (
                    <div key={msg._id} className="chapter-msg-bubble">
                      <div className="chapter-msg-header">
                        <span className="chapter-msg-sender">
                          {msg.sender?.firstName || "Member"}
                        </span>
                        <span className="chapter-msg-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="chapter-msg-text">{msg.text}</div>
                      {msg.mediaUrl && (
                        <div className="chapter-msg-media">
                          <img src={msg.mediaUrl} alt="Shared attachment" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterModal;
