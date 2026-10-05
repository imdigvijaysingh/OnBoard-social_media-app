import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const ChecklistCard = ({ widget, onWidgetUpdated }) => {
  const [localWidget, setLocalWidget] = useState(widget);
  const [newItemText, setNewItemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);

  const checklist = localWidget?.checklistData || widget?.checklistData;
  if (!checklist) return null;

  const items = checklist.items || [];
  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleToggle = async (itemId) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/widgets/checklist/${widget._id}/item/${itemId}`,
        {},
        { withCredentials: true }
      );
      setLocalWidget(res.data.widget);
      if (onWidgetUpdated) onWidgetUpdated(res.data.widget);
    } catch (err) {
      console.error("Failed to toggle item", err);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim() || isAdding) return;

    try {
      setIsAdding(true);
      const res = await axios.post(
        `${API_BASE}/widgets/checklist/${widget._id}/item`,
        { text: newItemText.trim() },
        { withCredentials: true }
      );
      setLocalWidget(res.data.widget);
      if (onWidgetUpdated) onWidgetUpdated(res.data.widget);
      setNewItemText("");
      setShowAddInput(false);
    } catch (err) {
      console.error("Failed to add checklist item", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="inchat-widget-card checklist-card">
      <div className="widget-card-header">
        <div className="widget-card-badge">
          <span>📋</span>
          <span>SHARED CHECKLIST</span>
        </div>
        <span className="checklist-progress-text">
          {completedCount}/{items.length} ({progressPercent}%)
        </span>
      </div>

      <h4 className="widget-card-title">{localWidget.title || widget.title}</h4>

      {/* Progress Bar */}
      <div className="checklist-progress-bar-bg">
        <div
          className="checklist-progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="checklist-items-list">
        {items.map((item) => (
          <div
            key={item.id}
            className={`checklist-item-row ${item.completed ? "completed" : ""}`}
            onClick={() => handleToggle(item.id)}
          >
            <span className={`checklist-box ${item.completed ? "checked" : ""}`}>
              {item.completed ? "✓" : ""}
            </span>
            <div className="checklist-item-body">
              <span className="checklist-item-text">{item.text}</span>
              {item.completed && item.completedBy && (
                <span className="checklist-completed-by">
                  done by {item.completedBy.firstName || "Crew member"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddInput ? (
        <form onSubmit={handleAddItem} className="checklist-add-form">
          <input
            type="text"
            placeholder="Add new task..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="location-input checklist-inline-input"
            autoFocus
          />
          <div className="checklist-add-actions">
            <button
              type="button"
              className="btn-checklist-cancel"
              onClick={() => setShowAddInput(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-checklist-save"
              disabled={isAdding || !newItemText.trim()}
            >
              Add
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="checklist-add-trigger-btn"
          onClick={() => setShowAddInput(true)}
        >
          <i className="fa-solid fa-plus"></i> Add task to list
        </button>
      )}
    </div>
  );
};

export default ChecklistCard;
