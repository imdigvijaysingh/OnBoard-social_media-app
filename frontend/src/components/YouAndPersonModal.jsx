import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const YouAndPersonModal = ({
  isOpen,
  onClose,
  targetUserId,
  currentUserName = "You",
  onOpenEditAlias,
}) => {
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !targetUserId) return;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `${API_BASE}/relationship/${targetUserId}`,
          { withCredentials: true }
        );
        setStatsData(res.data);
      } catch (err) {
        console.error("Failed to load relationship stats", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isOpen, targetUserId]);

  if (!isOpen) return null;

  const target = statsData?.targetUser;
  const stats = statsData?.stats;
  const milestones = statsData?.sharedMilestones || [];

  return (
    <div className="relationship-modal-backdrop" onClick={onClose}>
      <div
        className="relationship-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relationship-modal-header">
          <div className="relationship-title-group">
            <span className="relationship-badge-icon">👥</span>
            <div>
              <h3>You + {target?.privateNickname || target?.name || "Friend"}</h3>
              <p className="relationship-subtitle">
                Shared Social History & Real-Life Milestones
              </p>
            </div>
          </div>
          <button className="relationship-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {isLoading ? (
          <div className="relationship-loading">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <span>Calculating your shared history...</span>
          </div>
        ) : (
          <div className="relationship-modal-body">
            {/* Passenger pair cards */}
            <div className="passenger-pair-row">
              <div className="passenger-bubble">
                <div className="passenger-avatar-placeholder">
                  <i className="fa-solid fa-user"></i>
                </div>
                <span>{currentUserName}</span>
              </div>
              <div className="flight-route-spark">
                <span className="flight-icon">✈️</span>
                <span className="flight-route-line"></span>
              </div>
              <div className="passenger-bubble">
                <img
                  src={
                    target?.privateAvatar ||
                    target?.profilePhoto ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt="Contact"
                  className="passenger-avatar-img"
                />
                <span>{target?.privateNickname || target?.name || "Friend"}</span>
              </div>
            </div>

            {stats?.connectedSince && (
              <div className="connection-since-tag">
                <span>🗓 Flight paths crossed on </span>
                <strong>
                  {new Date(stats.connectedSince).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                    day: "numeric",
                  })}
                </strong>
              </div>
            )}

            {/* Meaningful Context Metrics (Zero Surveillance Counters) */}
            <div className="relationship-metrics-grid">
              <div className="rel-metric-card">
                <span className="rel-metric-icon">📸</span>
                <span className="rel-metric-val">
                  {stats?.sharedMedia?.toLocaleString() || 0}
                </span>
                <span className="rel-metric-label">Shared Media</span>
              </div>

              <div className="rel-metric-card">
                <span className="rel-metric-icon">🎙</span>
                <span className="rel-metric-val">
                  {stats?.voiceNotes?.toLocaleString() || 0}
                </span>
                <span className="rel-metric-label">Voice Notes</span>
              </div>

              <div className="rel-metric-card">
                <span className="rel-metric-icon">🗂</span>
                <span className="rel-metric-val">
                  {stats?.chaptersCount?.toLocaleString() || 0}
                </span>
                <span className="rel-metric-label">Co-Created Chapters</span>
              </div>

              <div className="rel-metric-card">
                <span className="rel-metric-icon">🌴</span>
                <span className="rel-metric-val">
                  {stats?.experiencesCount?.toLocaleString() || 0}
                </span>
                <span className="rel-metric-label">Shared Experiences</span>
              </div>
            </div>

            {/* Chronological Relationship Timeline */}
            <div className="shared-timeline-section">
              <div className="shared-timeline-header">
                <span className="timeline-title-icon">🧭</span>
                <h4>Shared Flight Path Timeline</h4>
              </div>

              {milestones.length === 0 ? (
                <p className="empty-milestones-text">
                  Your story is just beginning. Create your first Chapter or Experience together!
                </p>
              ) : (
                <div className="milestones-vertical-stream">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="milestone-timeline-item">
                      <div className="milestone-node">
                        <span className="milestone-icon-bubble">{m.icon}</span>
                        {idx < milestones.length - 1 && <span className="milestone-stem-line"></span>}
                      </div>
                      <div className="milestone-details">
                        <div className="milestone-top-row">
                          <span className="milestone-title">{m.title}</span>
                          <span className="milestone-date">
                            {new Date(m.date).toLocaleDateString(undefined, {
                              month: "short",
                              year: "numeric",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="milestone-desc">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {target?.notes && (
              <div className="relationship-private-notes">
                <span className="notes-label">
                  <i className="fa-solid fa-lock"></i> Your Private Memory Note:
                </span>
                <p>{target.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="relationship-actions-footer">
              <button
                className="rel-edit-alias-btn"
                onClick={() => {
                  onClose();
                  if (onOpenEditAlias) onOpenEditAlias();
                }}
              >
                <i className="fa-solid fa-pen-to-square"></i> Set Contact Nickname
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouAndPersonModal;
