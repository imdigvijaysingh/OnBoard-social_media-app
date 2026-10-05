import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const MeetingPointCard = ({
  widget,
  currentUserId,
  onOpenMap,
  onWidgetUpdated,
}) => {
  const [localWidget, setLocalWidget] = useState(widget);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const mp = localWidget?.meetingPointData || widget?.meetingPointData;
  if (!mp) return null;

  const lat = mp.latitude;
  const lng = mp.longitude;
  const attendees = mp.attendeesHere || [];
  const userCheckedIn = attendees.some(
    (a) => (a.user?._id || a.user)?.toString() === currentUserId?.toString()
  );

  const handleCheckInToggle = async () => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      const res = await axios.post(
        `${API_BASE}/widgets/meeting-point/${widget._id}/checkin`,
        {},
        { withCredentials: true }
      );
      setLocalWidget(res.data.widget);
      if (onWidgetUpdated) onWidgetUpdated(res.data.widget);
    } catch (err) {
      console.error("Failed to check in", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
  };

  const handleViewMapClick = () => {
    if (onOpenMap) {
      onOpenMap({
        latitude: lat,
        longitude: lng,
        label: mp.venueName || "Meeting Point",
        accuracy: 15,
        type: "meeting_point",
        senderName: widget.creator?.firstName || "Host",
        startedAt: widget.createdAt,
      });
    }
  };

  return (
    <div className="inchat-widget-card meeting-point-card">
      <div className="widget-card-header">
        <div className="widget-card-badge meeting-badge">
          <span>📍</span>
          <span>SHARED MEETING POINT</span>
        </div>
        {mp.scheduledTime && (
          <span className="meeting-time-pill">
            ⏰ {new Date(mp.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="meeting-point-body">
        <div className="meeting-point-radar-icon">
          <div className="radar-circle-beacon"></div>
          <span className="radar-pin-symbol">📍</span>
        </div>

        <div className="meeting-point-info">
          <h4 className="meeting-venue-title">{mp.venueName || widget.title}</h4>
          {mp.scheduledTime && (
            <p className="meeting-date-sub">
              {new Date(mp.scheduledTime).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
          <span className="meeting-coords-sub">
            GPS: {lat?.toFixed(4)}, {lng?.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Attendees on-site */}
      <div className="meeting-attendees-strip">
        <div className="attendees-left">
          <span className="attendees-count">
            🟢 <strong>{attendees.length}</strong> arrived on site
          </span>
        </div>
        <button
          type="button"
          className={`btn-im-here ${userCheckedIn ? "checked-in" : ""}`}
          onClick={handleCheckInToggle}
          disabled={isUpdating}
        >
          {userCheckedIn ? "✓ I'm Here" : "📍 Check In (I'm Here)"}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="meeting-point-actions">
        <button
          type="button"
          className="meeting-btn-map"
          onClick={handleViewMapClick}
        >
          <i className="fa-solid fa-map-location-dot"></i> View Map 🗺
        </button>
        <button
          type="button"
          className="meeting-btn-launch"
          onClick={openGoogleMaps}
        >
          <i className="fa-solid fa-arrow-up-right-from-square"></i> Open in Maps
        </button>
      </div>
    </div>
  );
};

export default MeetingPointCard;
