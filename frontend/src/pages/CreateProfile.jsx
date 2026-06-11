import React, { useState, useRef } from 'react';
import '../styles/CreateProfile.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateProfile = () => {
  const [image, setImage] = useState(null);
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const fileInputRef = useRef(null);

  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [userNameError, setuserNameError] = useState("");

  const navigate = useNavigate();

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("profilePhoto", fileInputRef.current.files[0]);
    formData.append("userName", username);
    formData.append("dob", dob);

    axios
      .post("http://localhost:3000/api/profile/create", formData, { withCredentials: true })                         //development
      // .post("https://onboard-social-media-app-1.onrender.com/api/profile/create", formData, { withCredentials: true }) //production
      .then((res) => {
        setIsSuccess(true);
        setIsAnimating(true);
        setTimeout(() => {
          navigate('/feed');
        }, 2000);
      })
      .catch((err) => {
        const message = err.response?.data?.message;

        if (message === "This username is taken. Try a different one."){
            setuserNameError(message);
        }

        setIsLoading(false);
      })
    
      setuserNameError("");
  };

  return (
    <>
    <div className={`create-profile-container ${isAnimating ? 'blur-background' : ''}`}>
      <div className="create-profile-card">
        <h1 className="title">Setup Your Profile</h1>
        <p className="subtitle">Let's get you ready for the journey</p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="avatar-section">
            <div 
              className={`avatar-preview ${image ? 'has-image' : ''}`} 
              onClick={handleImageClick}
            >
              {image ? (
                <img src={image} alt="Profile Preview" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  <span>Upload</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden-file-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input 
              type="text" 
                id="username"
                name="userName"
                placeholder="Choose a username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              
              {userNameError && <p className="error-text">{userNameError}</p>}

            </div>
          </div>

          <div className="input-group">
            <label htmlFor="dob">Date of Birth</label>
            <div className="input-wrapper">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input 
              type="date" 
                id="dob"
                name="dob"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="create-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner" style={{ marginRight: '8px' }}></span>
                CREATING...
              </>
            ) : (
              "CREATE PROFILE"
            )}
          </button>
        </form>
      </div>
    </div>
    
    {isAnimating && (
      <div className="global-overlay">
        <div className="global-spinner"></div>
        <h2>Creating profile...</h2>
      </div>
    )}
    </>
  );
};

export default CreateProfile;