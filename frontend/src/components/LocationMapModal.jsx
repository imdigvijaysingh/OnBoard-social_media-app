import React from "react";

const LocationMapModal = ({ isOpen, onClose, locationData, onSaveToBoard }) => {
  if (!isOpen || !locationData) return null;

  const lat = locationData.latestLatitude || locationData.lat;
  const lng = locationData.latestLongitude || locationData.lng;
  const label = locationData.label || "Shared Location";
  const accuracy = locationData.latestAccuracy || locationData.accuracy;
  const isLive = locationData.type === "live" && locationData.status === "active";

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const appleMapsUrl = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`;

  // OpenStreetMap embed URL (100% Free, Zero-Cost)
  const delta = 0.005;
  const bbox = `${lng - delta}%2C${lat - delta * 0.7}%2C${lng + delta}%2C${lat + delta * 0.7}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="location-map-backdrop" onClick={onClose}>
      <div
        className="location-map-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="location-map-header">
          <div className="map-title-group">
            <span className="map-badge-icon">🗺</span>
            <div>
              <h3>{label}</h3>
              <p className="map-subtitle">
                {isLive ? "🟢 Active Live Coordinates" : "📍 Static Location Snapshot"} • {lat?.toFixed(4)}°, {lng?.toFixed(4)}°
              </p>
            </div>
          </div>
          <button className="location-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Embedded Zero-Cost OpenStreetMap Frame */}
        <div className="location-map-frame-wrapper">
          {lat && lng ? (
            <iframe
              title="OpenStreetMap Location View"
              src={osmEmbedUrl}
              className="location-osm-iframe"
              loading="lazy"
            />
          ) : (
            <div className="map-unavailable-box">
              <i className="fa-solid fa-map-pin"></i>
              <p>Coordinates not available</p>
            </div>
          )}

          {isLive && (
            <div className="map-live-floating-chip">
              <span className="pulse-dot"></span> Live GPS Stream
            </div>
          )}
        </div>

        {/* Meta info & actions */}
        <div className="location-map-footer">
          <div className="map-accuracy-info">
            {accuracy && (
              <span>
                <i className="fa-solid fa-crosshairs"></i> Estimated Accuracy: ~{Math.round(accuracy)}m
              </span>
            )}
          </div>

          <div className="map-footer-actions">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="map-action-link google-maps-btn"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Google Maps
            </a>

            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="map-action-link apple-maps-btn"
            >
              <i className="fa-brands fa-apple"></i> Apple Maps
            </a>

            {onSaveToBoard && (
              <button
                type="button"
                className="map-save-board-btn"
                onClick={() => onSaveToBoard(locationData._id)}
              >
                <i className="fa-regular fa-bookmark"></i> Save to Board
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMapModal;
