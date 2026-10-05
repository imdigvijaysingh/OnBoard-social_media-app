import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const MOMENT_CATEGORIES = [
  { id: "funny", label: "Funny Moment", emoji: "😂" },
  { id: "inside_joke", label: "Inside Joke", emoji: "🤫" },
  { id: "trip_planning", label: "Trip Memory", emoji: "🗺️" },
  { id: "birthday", label: "Birthday", emoji: "🎂" },
  { id: "achievement", label: "Achievement", emoji: "🏆" },
  { id: "announcement", label: "Announcement", emoji: "📢" },
  { id: "first_conversation", label: "First Hello", emoji: "🌱" },
  { id: "custom", label: "Custom Moment", emoji: "✨" },
];

const MomentModal = ({
  isOpen,
  onClose,
  conversationId,
  selectedMessageIds = [],
  initialTitle = "",
  onMomentCreated,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState("funny");
  const [coverImage, setCoverImage] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for this Moment");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const res = await axios.post(
        `${API_BASE}/moments`,
        {
          conversationId,
          title: title.trim(),
          category,
          coverImage: coverImage.trim(),
          notes: notes.trim(),
          messageIds: selectedMessageIds,
        },
        { withCredentials: true }
      );

      if (onMomentCreated) {
        onMomentCreated(res.data.message);
      }
      onClose();
    } catch (err) {
      console.error("Failed to create moment", err);
      setError(err.response?.data?.message || "Failed to create moment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="location-modal-backdrop" onClick={onClose}>
      <div className="location-modal-card moment-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal-header">
          <div className="location-modal-title-group">
            <span className="location-modal-badge-icon">✨</span>
            <div>
              <h3>Preserve a Living Moment</h3>
              <p className="location-modal-sub">
                Capture inside jokes, milestones, and shared memories
              </p>
            </div>
          </div>
          <button className="location-modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {error && <div className="location-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="location-modal-body">
          {selectedMessageIds.length > 0 && (
            <div className="moment-selected-banner">
              <span>📌 Preserving <strong>{selectedMessageIds.length}</strong> selected message{selectedMessageIds.length > 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Category Chips */}
          <div className="experience-categories-grid">
            {MOMENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`exp-cat-chip ${category === cat.id ? "active" : ""}`}
                onClick={() => setCategory(cat.id)}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="location-form-group">
            <label>Moment Title *</label>
            <input
              type="text"
              placeholder="e.g. That time we planned a 3 AM drive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="location-input"
              autoFocus
            />
          </div>

          <div className="location-form-group">
            <label>Cover Photo URL (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="location-input"
            />
          </div>

          <div className="location-form-group">
            <label>Story & Reflections (Optional)</label>
            <textarea
              placeholder="Why this moment matters to you..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="location-input"
            />
          </div>

          <div className="location-modal-actions">
            <button
              type="button"
              className="location-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="location-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                "Preserve Moment ✨"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MomentModal;
