import React, { useState } from "react";
import axios from "axios";
import '../styles/CreatePost.css'

const CreatePost = ({ onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    axios
      .post("http://localhost:3000/api/create-post", formData, { withCredentials: true })                          //development
      // .post("https://onboard-social-media-app-1.onrender.com/api/create-post", formData, { withCredentials: true })  //production
      .then((res) => {
        setIsAnimating(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      })
      .catch((err) => {
        console.log(err);
        alert("Error creating post");
      });
  };

  // Close overlay when clicking backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
    <div className={`create-post-overlay ${isAnimating ? 'blur-background' : ''}`} onClick={handleBackdropClick}>
      <div className="create-post-modal">

        <div className="modal-header">
          <h2>Create Post</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-divider"></div>

        <div className="create-post-form">
          <form onSubmit={handleSubmit}>
            <div className="upload-area">
              <i className="fa-regular fa-image upload-icon"></i>
              <p className="upload-hint">Upload a photo</p>
              <input type="file" name="image" accept="image/*" id="file-upload" />
              <label htmlFor="file-upload" className="file-upload-label">Choose File</label>
            </div>
            <textarea
              name="caption"
              placeholder="Write a caption for your post..."
              required
              rows={3}
              className="caption-textarea"
            />
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-submit">
                <i className="fa-solid fa-paper-plane"></i> Share Post
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
    
    {isAnimating && (
      <div className="global-overlay">
        <div className="global-spinner"></div>
        <h2>Creating post...</h2>
      </div>
    )}
    </>
  );
};

export default CreatePost;
