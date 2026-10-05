import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const QuestionCard = ({ widget, onWidgetUpdated }) => {
  const [localWidget, setLocalWidget] = useState(widget);
  const [isExpanded, setIsExpanded] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const q = localWidget?.questionData || widget?.questionData;
  if (!q) return null;

  const answers = q.answers || [];

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${API_BASE}/widgets/question/${widget._id}/answer`,
        { text: answerText.trim() },
        { withCredentials: true }
      );
      setLocalWidget(res.data.widget);
      if (onWidgetUpdated) onWidgetUpdated(res.data.widget);
      setAnswerText("");
      setIsExpanded(true);
    } catch (err) {
      console.error("Failed to answer question", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inchat-widget-card question-card">
      <div className="widget-card-header">
        <div className="widget-card-badge question-badge">
          <span>❓</span>
          <span>SOCIAL QUESTION</span>
        </div>
        <button
          type="button"
          className="question-expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {answers.length} {answers.length === 1 ? "response" : "responses"}{" "}
          <i className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"}`}></i>
        </button>
      </div>

      <div className="question-prompt-box">
        <p className="question-prompt-text">{q.prompt || widget.title}</p>
      </div>

      {isExpanded && answers.length > 0 && (
        <div className="question-answers-list">
          {answers.map((ans, idx) => (
            <div key={idx} className="question-answer-item">
              <span className="question-answer-user">
                {ans.user?.firstName || "Crew Member"}:
              </span>
              <span className="question-answer-text">{ans.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inline Reply Form */}
      <form onSubmit={handleAnswerSubmit} className="question-reply-form">
        <input
          type="text"
          placeholder="Share your answer with the crew..."
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          className="location-input question-inline-input"
        />
        <button
          type="submit"
          className="question-btn-send"
          disabled={isSubmitting || !answerText.trim()}
        >
          {isSubmitting ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default QuestionCard;
