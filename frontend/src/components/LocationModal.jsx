import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat/location";

const DURATION_PRESETS = [
  { label: "15 mins", minutes: 15, group: "Quick" },
  { label: "30 mins", minutes: 30, group: "Quick" },
  { label: "1 hour", minutes: 60, group: "Standard" },
  { label: "2 hours", minutes: 120, group: "Standard" },
  { label: "6 hours", minutes: 360, group: "Standard" },
  { label: "24 hours", minutes: 1440, group: "Day" },
  { label: "7 days", minutes: 10080, group: "Trip" },
  { label: "10 days (Max)", minutes: 14400, group: "Trip" },
];

const LocationModal = ({
  isOpen,
  onClose,
  conversationId,
  conversationMembers = [],
  currentUserId,
  onLocationSent,
}) => {
  const [activeTab, setActiveTab] = useState("current"); // "current" | "live"

  // Geolocation state
  const [coords, setCoords] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Form options
  const [label, setLabel] = useState("");
  const [precision, setPrecision] = useState("exact"); // "exact" | "approximate"
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [visibility, setVisibility] = useState("conversation_members"); // "conversation_members" | "selected_members"
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [notifyRecipients, setNotifyRecipients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request browser geolocation when modal opens or on retry
  const acquireLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsGettingLocation(false);
      },
      (err) => {
        setIsGettingLocation(false);
        if (err.code === 1) {
          setLocationError(
            "Location permission was denied. Please allow location access in your browser settings to share your coordinates."
          );
        } else if (err.code === 2) {
          setLocationError("Location position is unavailable. Try again outside or near a window.");
        } else {
          setLocationError("Location request timed out. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    if (isOpen) {
      acquireLocation();
    }
  }, [isOpen]);

  const toggleSelectMember = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSendCurrent = async (e) => {
    e.preventDefault();
    if (!coords || !conversationId) return;

    const clientMsgId = `msg_loc_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${API_BASE}/conversations/${conversationId}/current`,
        {
          clientMessageId: clientMsgId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          precision,
          label: label.trim(),
        },
        { withCredentials: true }
      );

      if (onLocationSent) onLocationSent(res.data.message);
      onClose();
    } catch (err) {
      console.error("Failed to send current location", err);
      setLocationError(err.response?.data?.message || "Failed to send location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartLive = async (e) => {
    e.preventDefault();
    if (!coords || !conversationId) return;

    const clientMsgId = `msg_live_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${API_BASE}/conversations/${conversationId}/live`,
        {
          clientMessageId: clientMsgId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          durationMinutes,
          precision,
          visibility,
          selectedMemberIds,
          notifyRecipients,
          label: label.trim(),
        },
        { withCredentials: true }
      );

      if (onLocationSent) onLocationSent(res.data.message);
      onClose();
    } catch (err) {
      console.error("Failed to start live location", err);
      setLocationError(
        err.response?.data?.message || "Failed to start live location"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const otherMembers = conversationMembers.filter(
    (m) => m.userId !== currentUserId
  );

  return (
    <div className="location-modal-backdrop" onClick={onClose}>
      <div
        className="location-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="location-modal-header">
          <div className="location-title-group">
            <span className="location-badge-icon">📍</span>
            <div>
              <h3>Share Location</h3>
              <p className="location-subtitle">
                Temporary, explicit & privacy-first real-world coordination
              </p>
            </div>
          </div>
          <button className="location-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="location-tab-bar">
          <button
            className={`loc-tab ${activeTab === "current" ? "active" : ""}`}
            onClick={() => setActiveTab("current")}
          >
            <i className="fa-solid fa-location-dot"></i> Send Current Location
          </button>
          <button
            className={`loc-tab ${activeTab === "live" ? "active" : ""}`}
            onClick={() => setActiveTab("live")}
          >
            <span className="live-mini-dot"></span> Share Live Location
          </button>
        </div>

        {/* Geolocation Status / Preview */}
        <div className="location-coords-status">
          {isGettingLocation ? (
            <div className="coords-loading-pill">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>Acquiring GPS coordinates from device...</span>
            </div>
          ) : coords ? (
            <div className="coords-success-pill">
              <i className="fa-solid fa-circle-check text-green"></i>
              <span>
                GPS Ready ({coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}°) • Accuracy: ~{Math.round(coords.accuracy)}m
              </span>
              <button
                type="button"
                className="coords-refresh-btn"
                onClick={acquireLocation}
                title="Refresh GPS position"
              >
                <i className="fa-solid fa-arrows-rotate"></i>
              </button>
            </div>
          ) : (
            <div className="coords-error-pill">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{locationError || "Couldn't acquire location."}</span>
              <button
                type="button"
                className="coords-retry-btn"
                onClick={acquireLocation}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="location-modal-body">
          {/* Optional Label / Meet Me Here Note */}
          <div className="loc-form-field">
            <label>Place Label or Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 'Meet Me Here', 'Outside Gate 2', 'Library Café'"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={60}
            />
          </div>

          {/* Precision Selector */}
          <div className="loc-form-field">
            <label>Location Precision</label>
            <div className="precision-selector-grid">
              <label
                className={`precision-card ${precision === "exact" ? "active" : ""}`}
                onClick={() => setPrecision("exact")}
              >
                <input
                  type="radio"
                  name="precision"
                  checked={precision === "exact"}
                  onChange={() => {}}
                />
                <div>
                  <strong>Exact Coordinates</strong>
                  <p>Precise pinpoint (~10-25m accuracy)</p>
                </div>
              </label>

              <label
                className={`precision-card ${precision === "approximate" ? "active" : ""}`}
                onClick={() => setPrecision("approximate")}
              >
                <input
                  type="radio"
                  name="precision"
                  checked={precision === "approximate"}
                  onChange={() => {}}
                />
                <div>
                  <strong>Approximate Zone</strong>
                  <p>Obfuscates within ~1km radius for privacy</p>
                </div>
              </label>
            </div>
          </div>

          {/* TAB 1: CURRENT LOCATION */}
          {activeTab === "current" && (
            <form onSubmit={handleSendCurrent}>
              <div className="loc-privacy-notice">
                <i className="fa-solid fa-shield-halved"></i>
                <span>
                  This sends a one-time static snapshot. Your location will <strong>not</strong> continue updating.
                </span>
              </div>

              <div className="location-form-actions">
                <button
                  type="button"
                  className="loc-btn-cancel"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="loc-btn-submit"
                  disabled={!coords || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Sending...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> Send Current Location
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: LIVE LOCATION */}
          {activeTab === "live" && (
            <form onSubmit={handleStartLive}>
              {/* Duration Presets */}
              <div className="loc-form-field">
                <label>Sharing Duration (Hard Maximum: 10 Days)</label>
                <div className="duration-presets-grid">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.minutes}
                      type="button"
                      className={`duration-pill-btn ${
                        durationMinutes === preset.minutes ? "active" : ""
                      }`}
                      onClick={() => setDurationMinutes(preset.minutes)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Selection */}
              <div className="loc-form-field">
                <label>Who Can See Your Live Location?</label>
                <div className="visibility-options-row">
                  <button
                    type="button"
                    className={`vis-option-btn ${
                      visibility === "conversation_members" ? "active" : ""
                    }`}
                    onClick={() => setVisibility("conversation_members")}
                  >
                    <i className="fa-solid fa-users"></i> Everyone in this Chat
                  </button>
                  {otherMembers.length > 1 && (
                    <button
                      type="button"
                      className={`vis-option-btn ${
                        visibility === "selected_members" ? "active" : ""
                      }`}
                      onClick={() => setVisibility("selected_members")}
                    >
                      <i className="fa-solid fa-user-check"></i> Selected Members
                    </button>
                  )}
                </div>

                {/* Member selection checkboxes */}
                {visibility === "selected_members" && otherMembers.length > 0 && (
                  <div className="selected-members-box">
                    <span className="selected-hint">
                      Choose specifically who receives live coordinates:
                    </span>
                    <div className="member-checkbox-list">
                      {otherMembers.map((m) => (
                        <label key={m.userId} className="member-check-item">
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(m.userId)}
                            onChange={() => toggleSelectMember(m.userId)}
                          />
                          <img
                            src={
                              m.customAvatar ||
                              m.profilePhoto ||
                              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                            }
                            alt=""
                            className="member-check-avatar"
                          />
                          <span>{m.displayName || m.userName || "User"}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Toggle (Decoupled from visibility) */}
              <div className="loc-form-field">
                <label className="notify-toggle-label">
                  <input
                    type="checkbox"
                    checked={notifyRecipients}
                    onChange={(e) => setNotifyRecipients(e.target.checked)}
                  />
                  <span>
                    🔔 Send push notification alerting recipients that live sharing has started
                  </span>
                </label>
              </div>

              <div className="loc-privacy-notice live-notice">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>
                  You can tap <strong>[Stop Sharing]</strong> at any moment. Coordinates will automatically expire after the duration ends.
                </span>
              </div>

              <div className="location-form-actions">
                <button
                  type="button"
                  className="loc-btn-cancel"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="loc-btn-submit live-submit"
                  disabled={!coords || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Starting...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-tower-broadcast"></i> Start Live Sharing
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
