import React, { useState } from "react";
import axios from "axios";
import "../styles/Chats.css";

const API_BASE = "http://localhost:3000/api/chat";

const WidgetModal = ({
  isOpen,
  onClose,
  conversationId,
  initialType = "poll",
  initialText = "",
  onWidgetCreated,
}) => {
  const [activeTab, setActiveTab] = useState(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Poll state
  const [pollTitle, setPollTitle] = useState(initialText || "");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [isMultiChoice, setIsMultiChoice] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [closingInHours, setClosingInHours] = useState(24);

  // Checklist state
  const [checklistTitle, setChecklistTitle] = useState(initialText || "");
  const [checklistItems, setChecklistItems] = useState(["", ""]);

  // Meeting Point state
  const [meetingVenue, setMeetingVenue] = useState(initialText || "");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLat, setMeetingLat] = useState("");
  const [meetingLng, setMeetingLng] = useState("");
  const [isFetchingGeo, setIsFetchingGeo] = useState(false);

  // Question state
  const [questionPrompt, setQuestionPrompt] = useState(initialText || "");

  if (!isOpen) return null;

  // Poll option helpers
  const handleAddPollOption = () => {
    if (pollOptions.length < 8) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handlePollOptionChange = (index, val) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Checklist item helpers
  const handleAddChecklistItem = () => {
    if (checklistItems.length < 15) {
      setChecklistItems([...checklistItems, ""]);
    }
  };

  const handleChecklistItemChange = (index, val) => {
    const updated = [...checklistItems];
    updated[index] = val;
    setChecklistItems(updated);
  };

  const handleRemoveChecklistItem = (index) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter((_, i) => i !== index));
    }
  };

  // Meeting Point GPS fetcher
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setIsFetchingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMeetingLat(pos.coords.latitude.toFixed(6));
        setMeetingLng(pos.coords.longitude.toFixed(6));
        setIsFetchingGeo(false);
      },
      (err) => {
        setError("Could not retrieve GPS position: " + err.message);
        setIsFetchingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (activeTab === "poll") {
        if (!pollTitle.trim()) {
          setError("Please enter a question or title for the poll");
          setIsSubmitting(false);
          return;
        }
        const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
        if (validOptions.length < 2) {
          setError("Please provide at least 2 non-empty options");
          setIsSubmitting(false);
          return;
        }

        const res = await axios.post(
          `${API_BASE}/widgets/poll`,
          {
            conversationId,
            title: pollTitle.trim(),
            options: validOptions,
            isMultiChoice,
            isAnonymous,
            closingInHours: Number(closingInHours),
          },
          { withCredentials: true }
        );

        if (onWidgetCreated) onWidgetCreated(res.data.message);
        onClose();
      } else if (activeTab === "checklist") {
        if (!checklistTitle.trim()) {
          setError("Please enter a title for the checklist");
          setIsSubmitting(false);
          return;
        }
        const validItems = checklistItems.map((i) => i.trim()).filter(Boolean);
        if (validItems.length === 0) {
          setError("Please add at least 1 task item");
          setIsSubmitting(false);
          return;
        }

        const res = await axios.post(
          `${API_BASE}/widgets/checklist`,
          {
            conversationId,
            title: checklistTitle.trim(),
            items: validItems,
          },
          { withCredentials: true }
        );

        if (onWidgetCreated) onWidgetCreated(res.data.message);
        onClose();
      } else if (activeTab === "meeting_point") {
        if (!meetingVenue.trim()) {
          setError("Please specify the venue or place name");
          setIsSubmitting(false);
          return;
        }
        if (!meetingLat || !meetingLng) {
          setError("Please provide or detect GPS coordinates for the meeting point");
          setIsSubmitting(false);
          return;
        }

        const res = await axios.post(
          `${API_BASE}/widgets/meeting-point`,
          {
            conversationId,
            venueName: meetingVenue.trim(),
            scheduledTime: meetingTime || null,
            latitude: meetingLat,
            longitude: meetingLng,
          },
          { withCredentials: true }
        );

        if (onWidgetCreated) onWidgetCreated(res.data.message);
        onClose();
      } else if (activeTab === "question") {
        if (!questionPrompt.trim()) {
          setError("Please enter a prompt for the question");
          setIsSubmitting(false);
          return;
        }

        const res = await axios.post(
          `${API_BASE}/widgets/question`,
          {
            conversationId,
            prompt: questionPrompt.trim(),
          },
          { withCredentials: true }
        );

        if (onWidgetCreated) onWidgetCreated(res.data.message);
        onClose();
      }
    } catch (err) {
      console.error("Failed to create widget", err);
      setError(err.response?.data?.message || "Failed to create widget");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="location-modal-backdrop" onClick={onClose}>
      <div className="location-modal-card widget-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal-header">
          <div className="location-modal-title-group">
            <span className="location-modal-badge-icon">🧩</span>
            <div>
              <h3>Interactive Social Widgets</h3>
              <p className="location-modal-sub">
                Native coordination objects for real-world plans
              </p>
            </div>
          </div>
          <button className="location-modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="location-tab-switcher widget-tab-switcher">
          <button
            className={`location-tab-btn ${activeTab === "poll" ? "active" : ""}`}
            onClick={() => { setActiveTab("poll"); setError(""); }}
          >
            <span>📊</span> Poll
          </button>
          <button
            className={`location-tab-btn ${activeTab === "checklist" ? "active" : ""}`}
            onClick={() => { setActiveTab("checklist"); setError(""); }}
          >
            <span>📋</span> Checklist
          </button>
          <button
            className={`location-tab-btn ${activeTab === "meeting_point" ? "active" : ""}`}
            onClick={() => { setActiveTab("meeting_point"); setError(""); }}
          >
            <span>📍</span> Meeting Point
          </button>
          <button
            className={`location-tab-btn ${activeTab === "question" ? "active" : ""}`}
            onClick={() => { setActiveTab("question"); setError(""); }}
          >
            <span>❓</span> Question
          </button>
        </div>

        {error && <div className="location-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="widget-modal-form">
          <div className="location-modal-body widget-modal-body">
          {/* TAB 1: POLL */}
          {activeTab === "poll" && (
            <div className="widget-form-section">
              <div className="location-form-group">
                <label>Question or Topic *</label>
                <input
                  type="text"
                  placeholder="e.g. Which cafe are we heading to?"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  maxLength={120}
                  className="location-input"
                  autoFocus
                />
              </div>

              <div className="location-form-group">
                <label>Poll Options (at least 2)</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="widget-option-row">
                    <span className="widget-opt-num">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      maxLength={60}
                      className="location-input widget-opt-input"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        className="widget-remove-opt-btn"
                        onClick={() => handleRemovePollOption(idx)}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 8 && (
                  <button
                    type="button"
                    className="widget-add-opt-btn"
                    onClick={handleAddPollOption}
                  >
                    <i className="fa-solid fa-plus"></i> Add Option
                  </button>
                )}
              </div>

              <div className="widget-toggles-grid">
                <label className="location-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isMultiChoice}
                    onChange={(e) => setIsMultiChoice(e.target.checked)}
                  />
                  <span>Allow Multiple Choices</span>
                </label>
                <label className="location-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  <span>Anonymous Voting</span>
                </label>
              </div>

              <div className="location-form-group" style={{ marginTop: "12px" }}>
                <label>Closes In</label>
                <select
                  value={closingInHours}
                  onChange={(e) => setClosingInHours(e.target.value)}
                  className="location-input"
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>24 hours (1 day)</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                  <option value={0}>No expiration</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: CHECKLIST */}
          {activeTab === "checklist" && (
            <div className="widget-form-section">
              <div className="location-form-group">
                <label>Checklist Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip Packing List"
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}
                  maxLength={100}
                  className="location-input"
                  autoFocus
                />
              </div>

              <div className="location-form-group">
                <label>Tasks / Items</label>
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="widget-option-row">
                    <span className="widget-opt-num">☐</span>
                    <input
                      type="text"
                      placeholder={`Task item ${idx + 1}`}
                      value={item}
                      onChange={(e) => handleChecklistItemChange(idx, e.target.value)}
                      maxLength={100}
                      className="location-input widget-opt-input"
                    />
                    {checklistItems.length > 1 && (
                      <button
                        type="button"
                        className="widget-remove-opt-btn"
                        onClick={() => handleRemoveChecklistItem(idx)}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                ))}
                {checklistItems.length < 15 && (
                  <button
                    type="button"
                    className="widget-add-opt-btn"
                    onClick={handleAddChecklistItem}
                  >
                    <i className="fa-solid fa-plus"></i> Add Item
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MEETING POINT */}
          {activeTab === "meeting_point" && (
            <div className="widget-form-section">
              <div className="location-form-group">
                <label>Venue / Place Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Phoenix Mall, Gate 3"
                  value={meetingVenue}
                  onChange={(e) => setMeetingVenue(e.target.value)}
                  maxLength={100}
                  className="location-input"
                  autoFocus
                />
              </div>

              <div className="location-form-group">
                <label>Rendezvous Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="location-input"
                />
              </div>

              <div className="location-form-group">
                <label>GPS Coordinates *</label>
                <div className="meeting-coords-row">
                  <input
                    type="text"
                    placeholder="Latitude"
                    value={meetingLat}
                    onChange={(e) => setMeetingLat(e.target.value)}
                    className="location-input"
                  />
                  <input
                    type="text"
                    placeholder="Longitude"
                    value={meetingLng}
                    onChange={(e) => setMeetingLng(e.target.value)}
                    className="location-input"
                  />
                  <button
                    type="button"
                    className="btn-detect-geo"
                    onClick={handleGetLocation}
                    disabled={isFetchingGeo}
                  >
                    {isFetchingGeo ? "Detecting..." : "📍 My GPS"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL QUESTION */}
          {activeTab === "question" && (
            <div className="widget-form-section">
              <div className="location-form-group">
                <label>Question Prompt *</label>
                <textarea
                  placeholder="e.g. If you could travel anywhere tomorrow with zero budget limits, where would we go?"
                  value={questionPrompt}
                  onChange={(e) => setQuestionPrompt(e.target.value)}
                  rows={4}
                  maxLength={250}
                  className="location-input"
                  autoFocus
                />
                <span className="form-hint">Crew members will be able to submit thoughts and reply directly.</span>
              </div>
            </div>
          )}

          </div>
          {/* Modal Actions */}
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
                `Publish ${activeTab === "poll" ? "Poll" : activeTab === "checklist" ? "Checklist" : activeTab === "meeting_point" ? "Meeting Point" : "Question"}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WidgetModal;
