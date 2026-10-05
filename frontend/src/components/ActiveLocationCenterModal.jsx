import React, { useState, useEffect } from "react";
import axios from "axios";
import { overlayCard } from "../context/OverlayCardContext";

const API_BASE = "http://localhost:3000/api/chat/location";

const ActiveLocationCenterModal = ({
  isOpen,
  onClose,
  onOpenMap,
  onSharesChanged,
}) => {
  const [activeShares, setActiveShares] = useState({ outbound: [], inbound: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isStoppingAll, setIsStoppingAll] = useState(false);

  const fetchActiveShares = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}/active`, {
        withCredentials: true,
      });
      setActiveShares(res.data);
    } catch (err) {
      console.error("Failed to fetch active location shares", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveShares();
    }
  }, [isOpen]);

  const handleStopSingle = async (shareId) => {
    try {
      await axios.post(`${API_BASE}/${shareId}/stop`, {}, { withCredentials: true });
      fetchActiveShares();
      if (onSharesChanged) onSharesChanged();
    } catch (err) {
      console.error("Failed to stop share", err);
    }
  };

  const handleStopAll = async () => {
    const confirmed = await overlayCard.confirm({
      title: "Stop Live Location Sharing?",
      message: "Are you sure you want to stop all active live location shares immediately?",
      confirmText: "Stop All Shares",
      isDanger: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsStoppingAll(true);
      await axios.post(`${API_BASE}/stop-all`, {}, { withCredentials: true });
      fetchActiveShares();
      if (onSharesChanged) onSharesChanged();
    } catch (err) {
      console.error("Failed to stop all shares", err);
    } finally {
      setIsStoppingAll(false);
    }
  };

  if (!isOpen) return null;

  const totalActive = activeShares.outbound.length;

  return (
    <div className="location-center-backdrop" onClick={onClose}>
      <div
        className="location-center-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="location-center-header">
          <div className="center-title-group">
            <span className="center-icon">📡</span>
            <div>
              <h3>Active Location Sharing Center</h3>
              <p className="center-subtitle">
                Centralized dashboard • Control your real-time privacy
              </p>
            </div>
          </div>
          <button className="location-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="location-center-body">
          {isLoading ? (
            <div className="center-loading">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>Loading active location streams...</span>
            </div>
          ) : (
            <>
              {/* OUTBOUND SHARES: Location You Are Currently Sharing */}
              <div className="center-section">
                <div className="center-section-title">
                  <span>🟢 Currently Sharing Your Location ({activeShares.outbound.length})</span>
                  {activeShares.outbound.length > 1 && (
                    <button
                      type="button"
                      className="stop-all-mini-btn"
                      onClick={handleStopAll}
                      disabled={isStoppingAll}
                    >
                      Stop All
                    </button>
                  )}
                </div>

                {activeShares.outbound.length === 0 ? (
                  <div className="center-empty-card">
                    <i className="fa-solid fa-shield-halved"></i>
                    <p>You are not sharing your live location with anyone right now.</p>
                  </div>
                ) : (
                  <div className="center-shares-list">
                    {activeShares.outbound.map((share) => {
                      const minsLeft = share.expiresAt
                        ? Math.max(
                            0,
                            Math.floor(
                              (new Date(share.expiresAt).getTime() - Date.now()) /
                                (1000 * 60)
                            )
                          )
                        : 0;

                      return (
                        <div key={share._id} className="center-share-item">
                          <div className="share-item-left">
                            <span className="share-status-dot pulse"></span>
                            <div>
                              <strong className="share-conv-title">
                                {share.conversation?.title || "Conversation"}
                              </strong>
                              <span className="share-expires-text">
                                Ends in {minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m` : `${minsLeft} mins`}
                              </span>
                            </div>
                          </div>

                          <div className="share-item-actions">
                            <button
                              type="button"
                              className="center-btn-view"
                              onClick={() => {
                                onClose();
                                onOpenMap && onOpenMap(share);
                              }}
                            >
                              <i className="fa-solid fa-eye"></i> Map
                            </button>

                            <button
                              type="button"
                              className="center-btn-stop"
                              onClick={() => handleStopSingle(share._id)}
                            >
                              Stop
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* INBOUND SHARES: Location Friends Are Sharing With You */}
              {activeShares.inbound.length > 0 && (
                <div className="center-section">
                  <div className="center-section-title">
                    <span>📍 Live Locations Shared With You ({activeShares.inbound.length})</span>
                  </div>

                  <div className="center-shares-list">
                    {activeShares.inbound.map((share) => (
                      <div key={share._id} className="center-share-item">
                        <div className="share-item-left">
                          <span className="share-status-dot"></span>
                          <div>
                            <strong className="share-conv-title">
                              {share.sender?.firstName || "Friend"}
                            </strong>
                            <span className="share-expires-text">
                              in {share.conversation?.title || "Chat"}
                            </span>
                          </div>
                        </div>

                        <div className="share-item-actions">
                          <button
                            type="button"
                            className="center-btn-view"
                            onClick={() => {
                              onClose();
                              onOpenMap && onOpenMap(share);
                            }}
                          >
                            <i className="fa-solid fa-map-location-dot"></i> View Live
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Global Stop All Button */}
              {totalActive > 0 && (
                <div className="center-footer-actions">
                  <button
                    type="button"
                    className="stop-all-danger-btn"
                    onClick={handleStopAll}
                    disabled={isStoppingAll}
                  >
                    <i className="fa-solid fa-hand"></i> Stop All Location Sharing Immediately
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveLocationCenterModal;
