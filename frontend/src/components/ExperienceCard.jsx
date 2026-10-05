import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const CATEGORY_META = {
  trip: { emoji: "🌴", label: "TRIP / TRAVEL", color: "#10b981" },
  event: { emoji: "🎉", label: "EVENT", color: "#8b5cf6" },
  celebration: { emoji: "🎂", label: "CELEBRATION", color: "#f59e0b" },
  project: { emoji: "🎓", label: "PROJECT", color: "#3b82f6" },
  gaming: { emoji: "🎮", label: "GAMING NIGHT", color: "#ec4899" },
  hangout: { emoji: "🍜", label: "HANGOUT", color: "#f97316" },
  watch: { emoji: "🎬", label: "WATCH PARTY", color: "#6366f1" },
  activity: { emoji: "🏃", label: "ACTIVITY", color: "#14b8a6" },
  custom: { emoji: "✨", label: "EXPERIENCE", color: "#5445ff" },
};

const ExperienceCard = ({
  experience,
  currentUserId,
  onOpenMap,
  onExperienceUpdated,
}) => {
  const [localExp, setLocalExp] = useState(experience);
  const [isUpdating, setIsUpdating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!localExp) return null;

  const meta = CATEGORY_META[localExp.category] || CATEGORY_META.custom;
  const rsvps = localExp.rsvps || [];

  const goingCount = rsvps.filter((r) => r.status === "going").length;
  const maybeCount = rsvps.filter((r) => r.status === "maybe").length;
  const cantGoCount = rsvps.filter((r) => r.status === "cant_go").length;

  const myRsvp = rsvps.find(
    (r) => (r.user?._id || r.user)?.toString() === currentUserId?.toString()
  )?.status;

  const handleRsvp = async (newStatus) => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      const res = await axios.patch(
        `${API_BASE}/experiences/${localExp._id}/rsvp`,
        { status: newStatus },
        { withCredentials: true }
      );
      setLocalExp(res.data.experience);
      if (onExperienceUpdated) onExperienceUpdated(res.data.experience);
    } catch (err) {
      console.error("Failed to update RSVP", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveToBoard = async () => {
    try {
      await axios.post(
        `${API_BASE}/experiences/${localExp._id}/save-to-board`,
        {},
        { withCredentials: true }
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save experience to board", err);
    }
  };

  const handleLocationClick = () => {
    if (localExp.locationCoordinates?.latitude && onOpenMap) {
      onOpenMap({
        latitude: localExp.locationCoordinates.latitude,
        longitude: localExp.locationCoordinates.longitude,
        label: localExp.locationName || localExp.title,
        accuracy: 15,
        type: "experience_location",
        senderName: localExp.creator?.firstName || "Host",
        startedAt: localExp.createdAt,
      });
    } else if (localExp.locationName) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localExp.locationName)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="inchat-widget-card experience-card">
      <div className="widget-card-header">
        <div
          className="widget-card-badge"
          style={{ background: `${meta.color}18`, color: meta.color, borderColor: `${meta.color}35` }}
        >
          <span>{meta.emoji}</span>
          <span>{meta.label}</span>
        </div>

        {localExp.status === "planning" && (
          <span className="exp-status-planning">⚡ Planning</span>
        )}
      </div>

      <h4 className="experience-title">{localExp.title}</h4>

      <div className="experience-meta-strip">
        {localExp.date && (
          <div className="exp-meta-item">
            <i className="fa-regular fa-calendar-days"></i>
            <span>
              {new Date(localExp.date).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              •{" "}
              {new Date(localExp.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {localExp.locationName && (
          <div className="exp-meta-item location-clickable" onClick={handleLocationClick}>
            <i className="fa-solid fa-location-dot"></i>
            <span>{localExp.locationName}</span>
          </div>
        )}
      </div>

      {localExp.description && (
        <p className="experience-desc">{localExp.description}</p>
      )}

      {/* RSVP Section */}
      <div className="experience-rsvp-box">
        <span className="rsvp-title-label">Your RSVP:</span>
        <div className="rsvp-buttons-row">
          <button
            type="button"
            className={`btn-rsvp going ${myRsvp === "going" ? "selected" : ""}`}
            onClick={() => handleRsvp("going")}
            disabled={isUpdating}
          >
            <span>🟢 Going</span>
            <span className="rsvp-num-badge">{goingCount}</span>
          </button>

          <button
            type="button"
            className={`btn-rsvp maybe ${myRsvp === "maybe" ? "selected" : ""}`}
            onClick={() => handleRsvp("maybe")}
            disabled={isUpdating}
          >
            <span>🟡 Maybe</span>
            <span className="rsvp-num-badge">{maybeCount}</span>
          </button>

          <button
            type="button"
            className={`btn-rsvp cant-go ${myRsvp === "cant_go" ? "selected" : ""}`}
            onClick={() => handleRsvp("cant_go")}
            disabled={isUpdating}
          >
            <span>🔴 Can't Go</span>
            <span className="rsvp-num-badge">{cantGoCount}</span>
          </button>
        </div>
      </div>

      {/* Save to Board action */}
      <div className="experience-card-footer">
        <button
          type="button"
          className="btn-exp-save-board"
          onClick={handleSaveToBoard}
        >
          {savedSuccess ? (
            <>
              <i className="fa-solid fa-check"></i> Saved to Board!
            </>
          ) : (
            <>
              <i className="fa-solid fa-bookmark"></i> Save to Board Memories
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExperienceCard;
