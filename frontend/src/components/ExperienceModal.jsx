import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const CATEGORIES = [
  { id: "hangout", label: "Hangout", emoji: "🍜" },
  { id: "trip", label: "Trip / Travel", emoji: "🌴" },
  { id: "event", label: "Event", emoji: "🎉" },
  { id: "celebration", label: "Celebration", emoji: "🎂" },
  { id: "project", label: "Project", emoji: "🎓" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "watch", label: "Watch Party", emoji: "🎬" },
  { id: "activity", label: "Activity / Sport", emoji: "🏃" },
  { id: "custom", label: "Custom", emoji: "✨" },
];

const ExperienceModal = ({
  isOpen,
  onClose,
  conversationId,
  initialTitle = "",
  initialLocation = "",
  onExperienceCreated,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState("hangout");
  const [date, setDate] = useState("");
  const [locationName, setLocationName] = useState(initialLocation);
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for the Experience");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const res = await axios.post(
        `${API_BASE}/experiences`,
        {
          conversationId,
          title: title.trim(),
          category,
          date: date || null,
          locationName: locationName.trim(),
          latitude: latitude || null,
          longitude: longitude || null,
          description: description.trim(),
        },
        { withCredentials: true }
      );

      if (onExperienceCreated) {
        onExperienceCreated(res.data.message);
      }
      onClose();
    } catch (err) {
      console.error("Failed to create experience", err);
      setError(err.response?.data?.message || "Failed to create experience");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="location-modal-backdrop" onClick={onClose}>
      <div className="location-modal-card experience-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal-header">
          <div className="location-modal-title-group">
            <span className="location-modal-badge-icon">🌴</span>
            <div>
              <h3>Create Experience</h3>
              <p className="location-modal-sub">
                Transform "we should do this" into an active plan
              </p>
            </div>
          </div>
          <button className="location-modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {error && <div className="location-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="location-modal-body">
          {/* Category Chips */}
          <div className="experience-categories-grid">
            {CATEGORIES.map((cat) => (
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
            <label>Experience Title *</label>
            <input
              type="text"
              placeholder="e.g. Goa Sunset & Beach Bonfire"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="location-input"
              autoFocus
            />
          </div>

          <div className="experience-row-fields">
            <div className="location-form-group">
              <label>Target Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="location-input"
              />
            </div>
            <div className="location-form-group">
              <label>Location / Spot</label>
              <input
                type="text"
                placeholder="e.g. Anjuna Beach, Goa"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="location-input"
              />
            </div>
          </div>

          <div className="location-form-group">
            <label>Plans & Context</label>
            <textarea
              placeholder="Add key notes, meeting plans, or vibe guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  <i className="fa-solid fa-spinner fa-spin"></i> Creating...
                </>
              ) : (
                "Launch Experience 🚀"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExperienceModal;
