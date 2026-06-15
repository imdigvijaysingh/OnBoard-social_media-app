import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Feed.css";
import { Link, useNavigate } from "react-router-dom";
import CreatePost from "./CreatePost";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Profile1 from "../assets/profile.jpg";
import Profile2 from "../assets/virat.jpg";
import Profile3 from "../assets/roman.jpg";
import Profile4 from "../assets/chrisevans.jpg";
import Profile5 from "../assets/chrishems.jpg";
import Profile6 from "../assets/harry.webp";

const Feed = () => {
  // handling the log out functionality by clearing the token cookie and redirecting to login page
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await axios.post(
        // "http://localhost:3000/api/auth/logout", //development
        "https://onboardsocial.netlify.app/api/auth/logout",  //production
        {},
        { withCredentials: true },
      );

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.log(error);
      setIsLoggingOut(false);
    }
  };

  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [commentSectionsOpen, setCommentSectionsOpen] = useState({});
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const toggleCommentSection = (postId) => {
    setCommentSectionsOpen((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
      await axios.delete(`http://localhost:3000/api/posts/${postToDelete}`, {
        withCredentials: true,
      });
      setPosts((prev) => prev.filter((post) => post._id !== postToDelete));
      setPostToDelete(null);
    } catch (err) {
      console.error("Failed to delete post", err);
      alert("Failed to delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const suggestions = [
    { name: "Virat Kohli", handle: "@viratkohli", avatar: Profile2 },
    { name: "Roman Reigns", handle: "@romanreigns", avatar: Profile3 },
    { name: "Chris Evans", handle: "@chrisevans", avatar: Profile4 },
    { name: "Chris Hemsworth", handle: "@chris.hemsworth", avatar: Profile5 },
    { name: "Harry Potter", handle: "@potter.harry", avatar: Profile6 },
  ];

  useEffect(() => {
    axios.get("http://localhost:3000/api/posts").then((res) => {
      //development
      // axios.get("https://onboard-social-media-app-1.onrender.com/api/posts").then((res) => { //production
      setPosts(res.data.posts);
    });

    axios
      .get("http://localhost:3000/api/profile/get-me", {
        withCredentials: true,
      })
      .then((res) => {
        setProfile(res.data.user);
      })
      .catch((err) => {
        console.error("Failed to fetch profile", err);
      });
  }, []);

  const likePost = (postId) => {
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const savePost = (postId) => {
    setSavedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <>
    <div className={`app-layout ${isLoggingOut ? 'blur-background' : ''}`}>
      {/* LEFT SIDEBAR - Fixed */}
      <nav className={`blue-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <h1 className="logo-text">OnBoard</h1>
          <i
            className="fa-solid fa-xmark close-sidebar-icon"
            onClick={toggleSidebar}
          ></i>
        </div>

        <div className="sidebar-profile">
          <img
            src={profile?.profilePhoto || Profile1}
            alt="Profile"
            className="sidebar-avatar"
          />
          <h2 className="sidebar-username">
            {profile
              ? profile.dob
                ? `${profile.userName} | ${calculateAge(profile.dob)}`
                : profile.userName
              : "Loading..."}
          </h2>
          {/* <div className="sidebar-stats">
            <div className="stat"><span>1,158</span> Followers</div>
            <div className="stat"><span>250</span> Following</div>
          </div> */}
        </div>

        <div className="sidebar-nav">
          <Link to="/" className="nav-item active">
            <i className="fa-solid fa-house"></i> Feed
          </Link>
          <Link to="/stories" className="nav-item">
            <i className="fa-solid fa-bell"></i> Notification
          </Link>
          <Link to="/friends" className="nav-item">
            <i className="fa-solid fa-folder-open"></i> My Posts
            {/* <span className="badge">2</span> */}
          </Link>
          <Link to="/apis" className="nav-item">
            <i className="fa-solid fa-comments"></i> Chats
          </Link>
          <Link to="/subscription" className="nav-item">
            <i className="fa-solid fa-bookmark"></i> Saved
          </Link>
          <Link to="/settings" className="nav-item">
            <i className="fa-solid fa-gear"></i> Settings
          </Link>
          <button onClick={handleLogout} className="nav-item logout">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Log Out
          </button>
        </div>
      </nav>

      <div className="main-content">
        {/* Navbar */}
        <div className="navbar">
          <div className="hamburger-menu" onClick={toggleSidebar}>
            <i className="fa-solid fa-bars"></i>
          </div>
          <div className="search-section-top">
            <input
              type="text"
              className="search-input-top"
              placeholder="Search for friends, groups, pages"
            />
          </div>
          <div className="cta">
            <button
              className="add-post-btn"
              onClick={() => setIsCreatePostOpen(true)}
            >
              <span className="add-post-text">Add New Post</span>{" "}
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        <div className="main-dashboard">
          <section className="feed-column">
            <div className="feed-section">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post._id} className="post-card">
                    <div className="post-card-header">
                      <div className="post-card-header-left">
                        <img
                          src={post.profile?.profilePhoto || Profile1}
                          alt="Profile"
                          className="post-profile-img"
                        />
                        <div className="post-author-info">
                          <span className="post-author-name">
                            {post.profile?.userName || "Anonymous"}
                          </span>
                          <span className="post-author-role">
                            User
                          </span>
                        </div>
                      </div>
                      {profile && post.user === profile.userId ? (
                        <i 
                          className="fa-solid fa-trash post-options-icon" 
                          style={{ color: '#ef4444' }} 
                          title="Delete Post"
                          onClick={() => setPostToDelete(post._id)}
                        ></i>
                      ) : (
                        <i className="fa-solid fa-ellipsis-vertical post-options-icon"></i>
                      )}
                    </div>

                    <div className="post-card-body">
                      <p className="post-caption-text">{post.caption}</p>
                      {post.image && (
                        <img
                          src={post.image}
                          alt="Post"
                          className="post-image"
                        />
                      )}
                    </div>

                    <div className="post-card-footer">
                      <div
                        className="post-action"
                        onClick={() => likePost(post._id)}
                      >
                        <i
                          className={
                            likedPosts[post._id]
                              ? "fa-solid fa-thumbs-up liked"
                              : "fa-regular fa-thumbs-up"
                          }
                        ></i>
                        <span>200</span>
                      </div>
                      <div
                        className="post-action"
                        onClick={() => toggleCommentSection(post._id)}
                      >
                        <i className="fa-regular fa-comment"></i>
                        <span>25</span>
                      </div>
                      <div className="post-action">
                        <i className="fa-solid fa-share"></i>
                        <span>187</span>
                      </div>
                      <div
                        className="post-action"
                        onClick={() => savePost(post._id)}
                      >
                        <i
                          className={
                            savedPosts[post._id]
                              ? "fa-solid fa-bookmark saved"
                              : "fa-regular fa-bookmark"
                          }
                        ></i>
                        <span>8</span>
                      </div>
                    </div>

                    {commentSectionsOpen[post._id] && (
                      <div className="post-comment-section">
                        <div className="comment-input-wrapper">
                          <input
                            type="text"
                            placeholder="Write your comment.."
                            className="comment-input"
                          />
                          <div className="comment-actions">
                            <div className="submit-comment-btn">
                              <i className="fa-regular fa-paper-plane"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-posts">
                  <h1>No posts available</h1>
                </div>
              )}
            </div>
          </section>

          <section className="right-column">
            <div className="friend-suggestions">
              <div className="section-header-row">
                <h3 className="section-title">Friend Suggestions</h3>
                <a href="#" className="see-all">
                  See All{" "}
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </div>
              <div className="suggestions-grid">
                {suggestions.map((s, idx) => (
                  <div key={idx} className="suggestion-card">
                    <img
                      src={s.avatar}
                      alt={s.name}
                      className="suggestion-avatar"
                    />
                    <div className="suggestion-info">
                      <span className="suggestion-name">{s.name}</span>
                      <span className="suggestion-handle">{s.handle}</span>
                    </div>
                    <button className="add-friend-btn">Follow</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="footer-section">
          <p>&copy; 2026 OnBoard. All rights reserved.</p>
        </div>
      </div>

      {/* Create Post Modal Overlay */}
      {isCreatePostOpen && (
        <CreatePost onClose={() => setIsCreatePostOpen(false)} />
      )}
      
      <DeleteConfirmModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={confirmDeletePost}
        isDeleting={isDeletingPost}
      />
    </div>

    {isLoggingOut && (
      <div className="global-overlay">
        <div className="global-spinner"></div>
        <h2>Logging out...</h2>
      </div>
    )}
    </>
  );
};

export default Feed;
