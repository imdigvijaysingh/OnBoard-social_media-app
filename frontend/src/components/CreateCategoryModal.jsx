import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const EMOJI_OPTIONS = [
  "📁", "✈️", "💼", "🌴", "🎉", "💡", "📌", "🎵", 
  "⭐", "🍕", "✨", "🔥", "📚", "🏖️", "🚀", "❤️"
];

const CreateCategoryModal = ({
  isOpen,
  onClose,
  conversationId,
  existingCategories = [],
  selectedMessageIds = [],
  onCategoryCreated,
  onCategoryUpdated,
}) => {
  const [tab, setTab] = useState(
    selectedMessageIds.length > 0 && existingCategories.length > 0
      ? "existing"
      : "create"
  );
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📁");
  const [description, setDescription] = useState("");
  const [selectedExistingCatId, setSelectedExistingCatId] = useState(
    existingCategories[0]?._id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await axios.post(
        `${API_BASE}/conversations/${conversationId}/chapters`,
        {
          name: name.trim(),
          coverImage: selectedEmoji,
          description: description.trim(),
          visibility: "conversation_members",
          messageIds: selectedMessageIds,
        },
        { withCredentials: true }
      );

      if (onCategoryCreated) {
        onCategoryCreated(res.data.chapter);
      }

      setName("");
      setDescription("");
      setSelectedEmoji("📁");
      onClose();
    } catch (err) {
      console.error("Failed to create category", err);
      setError(err.response?.data?.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToExisting = async (e) => {
    e.preventDefault();
    if (!selectedExistingCatId) {
      setError("Please select an existing category.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await axios.post(
        `${API_BASE}/chapters/${selectedExistingCatId}/messages`,
        { messageIds: selectedMessageIds },
        { withCredentials: true }
      );

      if (onCategoryUpdated) {
        onCategoryUpdated(selectedExistingCatId);
      }

      onClose();
    } catch (err) {
      console.error("Failed to add messages to category", err);
      setError(err.response?.data?.message || "Failed to add messages to category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="custom-cat-modal-backdrop" onClick={onClose}>
      <div
        className="custom-cat-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-cat-modal-header">
          <div className="custom-cat-title-group">
            <span className="custom-cat-header-icon">{selectedEmoji}</span>
            <div>
              <h3>{tab === "create" ? "Create Custom Category" : "Add to Existing Category"}</h3>
              <p className="custom-cat-subtitle">
                Organize messages into custom topics for this conversation
              </p>
            </div>
          </div>
          <button className="custom-cat-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {selectedMessageIds.length > 0 && existingCategories.length > 0 && (
          <div className="custom-cat-tabs">
            <button
              type="button"
              className={`cat-tab-btn ${tab === "create" ? "active" : ""}`}
              onClick={() => setTab("create")}
            >
              <i className="fa-solid fa-plus"></i> New Category
            </button>
            <button
              type="button"
              className={`cat-tab-btn ${tab === "existing" ? "active" : ""}`}
              onClick={() => setTab("existing")}
            >
              <i className="fa-solid fa-folder-open"></i> Existing ({existingCategories.length})
            </button>
          </div>
        )}

        {selectedMessageIds.length > 0 && (
          <div className="custom-cat-selected-pill">
            <i className="fa-solid fa-layer-group"></i>
            <span>
              <strong>{selectedMessageIds.length}</strong> message{selectedMessageIds.length === 1 ? "" : "s"} selected to assign
            </span>
          </div>
        )}

        {error && <div className="custom-cat-error-pill">{error}</div>}

        {tab === "create" ? (
          <form onSubmit={handleCreate} className="custom-cat-form">
            <div className="custom-cat-field">
              <label>Category Icon / Emoji</label>
              <div className="custom-cat-emoji-picker">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-pill-btn ${selectedEmoji === emoji ? "selected" : ""}`}
                    onClick={() => setSelectedEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="custom-cat-field">
              <label>Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Goa Trip, Project Alpha, Important, Memes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                autoFocus
              />
            </div>

            <div className="custom-cat-field">
              <label>Description (Optional)</label>
              <input
                type="text"
                placeholder="Brief summary or purpose of this category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="custom-cat-actions">
              <button
                type="button"
                className="custom-cat-cancel-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="custom-cat-submit-btn"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Creating...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus"></i> Create Category
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddToExisting} className="custom-cat-form">
            <div className="custom-cat-field">
              <label>Choose Existing Category</label>
              <div className="existing-categories-grid">
                {existingCategories.map((cat) => (
                  <div
                    key={cat._id}
                    className={`existing-cat-option ${selectedExistingCatId === cat._id ? "selected" : ""}`}
                    onClick={() => setSelectedExistingCatId(cat._id)}
                  >
                    <span className="existing-cat-emoji">{cat.coverImage || "📁"}</span>
                    <div className="existing-cat-meta">
                      <strong>{cat.name}</strong>
                      <span>{cat.messageCount || 0} messages</span>
                    </div>
                    {selectedExistingCatId === cat._id && (
                      <i className="fa-solid fa-check check-indicator"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="custom-cat-actions">
              <button
                type="button"
                className="custom-cat-cancel-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="custom-cat-submit-btn"
                disabled={isSubmitting || !selectedExistingCatId}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Adding...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i> Assign to Category
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateCategoryModal;
