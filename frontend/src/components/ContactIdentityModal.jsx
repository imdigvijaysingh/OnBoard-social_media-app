import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api/chat";

const ContactIdentityModal = ({
  isOpen,
  onClose,
  targetUser,
  onSaved,
}) => {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (targetUser) {
      setNickname(targetUser.displayName !== targetUser.userName ? targetUser.displayName : "");
      setAvatar(targetUser.customAvatar || "");
      setNotes(targetUser.notes || "");
      setShowUrlInput(false);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WebP, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be under 10MB.");
      return;
    }

    setError("");

    // Immediate local preview so the user sees it without delay
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatar(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to ImageKit backend
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await axios.post(
        `${API_BASE}/upload-avatar`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data?.url) {
        setAvatar(res.data.url);
      }
    } catch (err) {
      console.warn("Cloud upload warning, using base64 preview:", err);
      // Local preview is already set, so it remains usable!
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");

      const res = await axios.post(
        `${API_BASE}/contact-identity`,
        {
          targetUserId: targetUser.userId,
          privateNickname: nickname,
          privateAvatar: avatar,
          notes,
        },
        { withCredentials: true }
      );

      if (onSaved) {
        onSaved({
          userId: targetUser.userId,
          privateNickname: nickname,
          privateAvatar: avatar,
          notes,
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save personal contact identity", err);
      setError(err.response?.data?.message || "Failed to save contact identity");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-identity-backdrop" onClick={onClose}>
      <div
        className="contact-identity-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="contact-identity-header">
          <div className="contact-title-group">
            <span className="contact-badge-icon">🏷</span>
            <div>
              <h3>Personal Contact Identity</h3>
              <p className="contact-subtitle">
                "How I See You" • Only visible to you on your device
              </p>
            </div>
          </div>
          <button className="contact-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contact-identity-form">
          <div className="contact-target-preview">
            <img
              src={
                avatar ||
                targetUser.profilePhoto ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={targetUser.userName}
              className="contact-preview-avatar"
            />
            <div>
              <div className="contact-global-name">
                {targetUser.firstName} {targetUser.lastName}
              </div>
              <div className="contact-global-handle">
                @{targetUser.userName}
              </div>
            </div>
          </div>

          {error && <div className="contact-error-pill">{error}</div>}

          <div className="contact-field">
            <label>Personal Nickname</label>
            <input
              type="text"
              placeholder="e.g. 🌸 Mimi, 🦁 Digs, Roomie"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
            />
            <span className="field-hint">
              This replaces their global handle across your chat windows.
            </span>
          </div>

          <div className="contact-field">
            <label>Custom Local Avatar (Optional)</label>
            
            {avatar ? (
              <div className="avatar-active-card">
                <img src={avatar} alt="Custom Preview" className="avatar-active-thumb" />
                <div className="avatar-active-info">
                  <div className="avatar-active-title">
                    <span>Custom Avatar Set</span>
                    {isUploading && (
                      <span className="avatar-uploading-pill">
                        <i className="fa-solid fa-spinner fa-spin"></i> Uploading...
                      </span>
                    )}
                  </div>
                  <span className="avatar-active-src" title={avatar}>
                    {avatar.startsWith("data:") ? "Local Image File" : avatar}
                  </span>
                </div>
                <div className="avatar-active-actions">
                  <button
                    type="button"
                    className="avatar-change-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload different image"
                  >
                    <i className="fa-solid fa-arrow-up-from-bracket"></i> Replace
                  </button>
                  <button
                    type="button"
                    className="avatar-remove-btn"
                    onClick={() => setAvatar("")}
                    title="Remove custom avatar"
                  >
                    <i className="fa-solid fa-xmark"></i> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`avatar-dropzone ${isDragging ? "dragging" : ""} ${isUploading ? "uploading" : ""}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="dropzone-loading">
                    <i className="fa-solid fa-spinner fa-spin dropzone-spin-icon"></i>
                    <span>Uploading image...</span>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <div className="dropzone-icon-circle">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <div className="dropzone-text">
                      <p className="dropzone-primary-text">
                        <strong>Drag & drop avatar image here</strong>, or <span className="dropzone-browse-link">browse</span>
                      </p>
                      <p className="dropzone-sub-text">PNG, JPG, WebP, GIF up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />

            <div className="avatar-url-fallback">
              <button
                type="button"
                className="toggle-url-btn"
                onClick={() => setShowUrlInput(!showUrlInput)}
              >
                <i className={`fa-solid ${showUrlInput ? "fa-chevron-up" : "fa-link"}`}></i>{" "}
                {showUrlInput ? "Hide image URL field" : "Or paste direct image URL"}
              </button>
              {showUrlInput && (
                <input
                  type="url"
                  className="avatar-url-input"
                  placeholder="https://images.unsplash.com/... or https://ik.imagekit.io/..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="contact-field">
            <label>Private Notes & Key Dates (Optional)</label>
            <textarea
              placeholder="e.g. Met at campus orientation 2026. Birthday on Oct 14. Favorite coffee: iced mocha."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={250}
            />
          </div>

          <div className="contact-actions">
            <button
              type="button"
              className="contact-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="contact-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                "Save Local Identity"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactIdentityModal;
