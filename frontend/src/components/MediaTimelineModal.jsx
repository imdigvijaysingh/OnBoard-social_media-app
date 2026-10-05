import React, { useState, useMemo } from "react";

const MediaTimelineModal = ({
  isOpen,
  onClose,
  messages = [],
  onCreateChapterFromMedia,
  onCreateMomentFromMedia,
}) => {
  const [filterType, setFilterType] = useState("all"); // all, image, video
  const [selectedMediaUrls, setSelectedMediaUrls] = useState([]);

  // Extract all media messages from conversation
  const mediaMessages = useMemo(() => {
    return messages.filter(
      (m) =>
        m.mediaUrl &&
        !m.isDeletedForEveryone &&
        (m.type === "image" || m.type === "video" || m.mediaType?.startsWith("image") || m.mediaType?.startsWith("video"))
    );
  }, [messages]);

  // Group media chronologically by Month & Year (e.g., "June 2026")
  const groupedMedia = useMemo(() => {
    const groups = {};
    const filtered = mediaMessages.filter((m) => {
      if (filterType === "all") return true;
      if (filterType === "image") return m.type === "image" || m.mediaType?.startsWith("image");
      if (filterType === "video") return m.type === "video" || m.mediaType?.startsWith("video");
      return true;
    });

    filtered.forEach((msg) => {
      const d = new Date(msg.createdAt || Date.now());
      const key = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });

    return groups;
  }, [mediaMessages, filterType]);

  if (!isOpen) return null;

  const toggleSelectMedia = (msg) => {
    if (selectedMediaUrls.includes(msg._id)) {
      setSelectedMediaUrls(selectedMediaUrls.filter((id) => id !== msg._id));
    } else {
      setSelectedMediaUrls([...selectedMediaUrls, msg._id]);
    }
  };

  const handleCreateChapter = () => {
    if (onCreateChapterFromMedia && selectedMediaUrls.length > 0) {
      onCreateChapterFromMedia(selectedMediaUrls);
      onClose();
    }
  };

  const handleCreateMoment = () => {
    if (onCreateMomentFromMedia && selectedMediaUrls.length > 0) {
      onCreateMomentFromMedia(selectedMediaUrls);
      onClose();
    }
  };

  return (
    <div className="location-modal-backdrop" onClick={onClose}>
      <div className="location-modal-card media-timeline-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal-header">
          <div className="location-modal-title-group">
            <span className="location-modal-badge-icon">📸</span>
            <div>
              <h3>Shared Media Timeline</h3>
              <p className="location-modal-sub">
                Chronological gallery of all photos and videos in this cabin
              </p>
            </div>
          </div>
          <button className="location-modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Filter Switcher */}
        <div className="media-filter-bar">
          <div className="filter-pill-group">
            <button
              type="button"
              className={`media-filter-pill ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All Media ({mediaMessages.length})
            </button>
            <button
              type="button"
              className={`media-filter-pill ${filterType === "image" ? "active" : ""}`}
              onClick={() => setFilterType("image")}
            >
              📸 Photos
            </button>
            <button
              type="button"
              className={`media-filter-pill ${filterType === "video" ? "active" : ""}`}
              onClick={() => setFilterType("video")}
            >
              🎥 Videos
            </button>
          </div>

          {selectedMediaUrls.length > 0 && (
            <div className="media-select-actions">
              <span className="media-selected-count">
                {selectedMediaUrls.length} selected
              </span>
              <button
                type="button"
                className="btn-media-create-chapter"
                onClick={handleCreateChapter}
              >
                🗂 Chapter
              </button>
              <button
                type="button"
                className="btn-media-create-moment"
                onClick={handleCreateMoment}
              >
                ✨ Moment
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="media-timeline-scroll-area">
          {Object.keys(groupedMedia).length === 0 ? (
            <div className="empty-media-timeline">
              <span className="empty-icon">🖼️</span>
              <h4>No media found yet</h4>
              <p>Share photos or videos in this conversation to build your chronological timeline.</p>
            </div>
          ) : (
            Object.entries(groupedMedia).map(([monthGroup, items]) => (
              <div key={monthGroup} className="media-month-section">
                <div className="media-month-header">
                  <span className="month-title">{monthGroup}</span>
                  <span className="month-count">{items.length} items</span>
                </div>

                <div className="media-grid-mosaic">
                  {items.map((msg) => {
                    const isSelected = selectedMediaUrls.includes(msg._id);
                    const isVideo = msg.type === "video" || msg.mediaType?.startsWith("video");

                    return (
                      <div
                        key={msg._id}
                        className={`media-mosaic-item ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleSelectMedia(msg)}
                      >
                        {isVideo ? (
                          <div className="video-mosaic-thumb">
                            <video src={msg.mediaUrl} />
                            <span className="video-play-indicator">▶</span>
                          </div>
                        ) : (
                          <img
                            src={msg.mediaUrl}
                            alt="Shared"
                            loading="lazy"
                            className="media-thumb-img"
                          />
                        )}

                        <div className={`media-mosaic-checkbox ${isSelected ? "checked" : ""}`}>
                          {isSelected ? "✓" : ""}
                        </div>

                        <span className="media-mosaic-date">
                          {new Date(msg.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaTimelineModal;
