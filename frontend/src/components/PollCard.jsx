import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const PollCard = ({ widget, currentUserId, onWidgetUpdated }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [localWidget, setLocalWidget] = useState(widget);

  const poll = localWidget?.pollData || widget?.pollData;
  if (!poll) return null;

  const options = poll.options || [];
  const isClosed = poll.closedAt && new Date() > new Date(poll.closedAt);

  // Calculate total votes across all options
  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

  const handleVote = async (optionId) => {
    if (isClosed || isVoting) return;

    try {
      setIsVoting(true);
      const res = await axios.post(
        `${API_BASE}/widgets/poll/${widget._id}/vote`,
        { optionId },
        { withCredentials: true }
      );
      setLocalWidget(res.data.widget);
      if (onWidgetUpdated) onWidgetUpdated(res.data.widget);
    } catch (err) {
      console.error("Failed to vote", err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="inchat-widget-card poll-card">
      <div className="widget-card-header">
        <div className="widget-card-badge">
          <span>📊</span>
          <span>POLL {poll.isMultiChoice ? "• MULTI-CHOICE" : "• SINGLE CHOICE"}</span>
        </div>
        {isClosed && <span className="poll-closed-pill">Closed</span>}
      </div>

      <h4 className="widget-card-title">{localWidget.title || widget.title}</h4>

      <div className="poll-options-list">
        {options.map((opt) => {
          const voteCount = opt.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const userVoted = opt.votes?.some(
            (v) => (v.user?._id || v.user)?.toString() === currentUserId?.toString()
          );

          return (
            <div
              key={opt.id}
              className={`poll-option-row ${userVoted ? "voted" : ""} ${isClosed ? "disabled" : ""}`}
              onClick={() => handleVote(opt.id)}
            >
              <div
                className="poll-fill-bar"
                style={{ width: `${percentage}%` }}
              ></div>

              <div className="poll-option-content">
                <div className="poll-opt-left">
                  <span className={`poll-radio-indicator ${userVoted ? "checked" : ""}`}>
                    {userVoted ? "✓" : ""}
                  </span>
                  <span className="poll-opt-text">{opt.text}</span>
                </div>
                <div className="poll-opt-right">
                  <span className="poll-opt-percent">{percentage}%</span>
                  <span className="poll-opt-count">({voteCount})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="widget-card-footer">
        <span className="widget-footer-meta">
          <i className="fa-solid fa-users"></i> {totalVotes} vote{totalVotes === 1 ? "" : "s"}
          {poll.isAnonymous && " • 🕶️ Anonymous"}
        </span>
        {!isClosed && (
          <span className="poll-live-indicator">
            <span className="beacon-dot"></span> Voting Open
          </span>
        )}
      </div>
    </div>
  );
};

export default PollCard;
