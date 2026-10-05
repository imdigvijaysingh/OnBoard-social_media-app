import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat/location";

const LocationCard = ({
  message,
  currentUserId,
  onOpenMap,
  onLocationStopped,
}) => {
  const [shareData, setShareData] = useState(
    message.locationShare || {
      type: message.type === "live_location" ? "live" : "current",
      status: "active",
      latestLatitude: message.locationData?.latitude,
      latestLongitude: message.locationData?.longitude,
      latestAccuracy: message.locationData?.accuracy,
      label: message.locationData?.label,
      expiresAt: message.locationShare?.expiresAt,
    }
  );
  const [timeLeftStr, setTimeLeftStr] = useState("");
  const [isStopping, setIsStopping] = useState(false);
  const [isSaved, setIsSaved] = useState(message.locationShare?.savedToBoard || false);

  const isLive = message.type === "live_location" || shareData.type === "live";
  const isSender = message.senderId === currentUserId;
  const isActive = isLive && shareData.status === "active";

  // Countdown timer for live location
  useEffect(() => {
    if (!isLive || !shareData.expiresAt) return;

    const updateCountdown = () => {
      const diff = new Date(shareData.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr("Ended");
        setShareData((prev) => ({ ...prev, status: "expired" }));
      } else {
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const days = Math.floor(hours / 24);

        if (days > 0) {
          setTimeLeftStr(`${days}d ${hours % 24}h remaining`);
        } else if (hours > 0) {
          setTimeLeftStr(`${hours}h ${mins}m remaining`);
        } else {
          setTimeLeftStr(`${mins}m remaining`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 15000);
    return () => clearInterval(interval);
  }, [isLive, shareData.expiresAt]);

  const handleStopSharing = async (e) => {
    e.stopPropagation();
    if (!shareData._id) return;
    try {
      setIsStopping(true);
      const res = await axios.post(
        `${API_BASE}/${shareData._id}/stop`,
        {},
        { withCredentials: true }
      );
      setShareData(res.data.locationShare || { ...shareData, status: "stopped" });
      if (onLocationStopped) onLocationStopped(shareData._id);
    } catch (err) {
      console.error("Failed to stop location sharing", err);
    } finally {
      setIsStopping(false);
    }
  };

  const handleSaveToBoard = async (e) => {
    e.stopPropagation();
    if (!shareData._id) return;
    try {
      await axios.post(
        `${API_BASE}/${shareData._id}/save-to-board`,
        {},
        { withCredentials: true }
      );
      setIsSaved(true);
    } catch (err) {
      console.error("Failed to save location to board", err);
    }
  };

  const lat = shareData.latestLatitude || message.locationData?.latitude;
  const lng = shareData.latestLongitude || message.locationData?.longitude;
  const accuracy = shareData.latestAccuracy || message.locationData?.accuracy;
  const label = shareData.label || message.locationData?.label;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className={`location-bubble-card ${isLive ? "live-card" : "snapshot-card"} ${!isActive && isLive ? "ended" : ""}`}>
      {/* Card Header */}
      <div className="location-card-top">
        <div className="location-type-tag">
          {isLive ? (
            isActive ? (
              <span className="live-pulse-badge">
                <span className="pulse-dot"></span>
                <strong>LIVE LOCATION</strong>
              </span>
            ) : (
              <span className="ended-badge">
                <i className="fa-solid fa-clock-rotate-left"></i> Location sharing ended
              </span>
            )
          ) : (
            <span className="snapshot-badge">
              <i className="fa-solid fa-location-dot"></i> Current Location
            </span>
          )}
        </div>

        {isLive && isActive && timeLeftStr && (
          <span className="countdown-pill">{timeLeftStr}</span>
        )}
      </div>

      {/* Visual Radar / Map Preview Canvas Box */}
      <div
        className="location-radar-preview"
        onClick={() => onOpenMap && onOpenMap({ ...shareData, lat, lng, label, accuracy })}
        title="Click to view interactive map"
      >
        <div className="radar-grid">
          <div className="radar-circle circle-1"></div>
          <div className="radar-circle circle-2"></div>
          <div className="radar-marker">
            <span className="marker-pin">📍</span>
            {isLive && isActive && <span className="marker-ripple"></span>}
          </div>
        </div>

        <div className="radar-overlay-meta">
          <span className="coords-text">
            {lat ? lat.toFixed(4) : "0.0000"}°, {lng ? lng.toFixed(4) : "0.0000"}°
          </span>
          {accuracy && (
            <span className="accuracy-text">Accuracy: ~{Math.round(accuracy)}m</span>
          )}
        </div>
      </div>

      {/* Details & Label */}
      <div className="location-card-body">
        {label ? (
          <h4 className="location-label-text">"{label}"</h4>
        ) : (
          <h4 className="location-label-text">
            {isLive ? "Live GPS Coordinates" : "Location Snapshot"}
          </h4>
        )}

        <div className="location-meta-row">
          <span>Shared by {message.senderName || "User"}</span>
          {shareData.latestUpdatedAt && (
            <span>
              • {new Date(shareData.latestUpdatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="location-card-actions">
        <button
          className="loc-btn loc-btn-map"
          onClick={() => onOpenMap && onOpenMap({ ...shareData, lat, lng, label, accuracy })}
        >
          <i className="fa-solid fa-map-location-dot"></i> View Map
        </button>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="loc-btn loc-btn-external"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fa-solid fa-arrow-up-right-from-square"></i> Open in Maps
        </a>

        {isLive && isActive && isSender && (
          <button
            className="loc-btn loc-btn-stop"
            onClick={handleStopSharing}
            disabled={isStopping}
          >
            {isStopping ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fa-solid fa-circle-stop"></i> Stop Sharing
              </>
            )}
          </button>
        )}

        {isSaved ? (
          <span className="loc-saved-indicator" title="Saved to OnBoard Memories">
            <i className="fa-solid fa-bookmark"></i> Saved
          </span>
        ) : (
          <button
            className="loc-btn loc-btn-save"
            onClick={handleSaveToBoard}
            title="Save this place to your Board & Memories"
          >
            <i className="fa-regular fa-bookmark"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationCard;
