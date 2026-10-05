import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { overlayCard } from "../context/OverlayCardContext";
import ShareModal from "./ShareModal";

const ExplorePostModal = ({
  isOpen,
  post,
  onClose,
  onLike,
  onBookmark,
  onRecordView,
}) => {
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      setCommentsList(post.comments || []);
      setIsLiked(Boolean(post.isLiked));
      setLikeCount(post.likeCount || post.likes?.length || 0);
      setIsSaved(Boolean(post.isSaved));
      if (onRecordView) {
        onRecordView(post._id);
      }
    }
  }, [isOpen, post, onRecordView]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const handleToggleLike = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    if (onLike) {
      onLike(post._id);
    }
  };

  const handleDoubleTap = () => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 800);
    if (!isLiked) {
      handleToggleLike();
    }
  };

  const handleToggleBookmark = () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    if (onBookmark) {
      onBookmark(post._id);
    }
    overlayCard.success(nextState ? "Saved to your bookmarks! 🔖" : "Removed from bookmarks");
  };

  const handleShare = () => {
    setIsShareOpen(true);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `http://localhost:3000/api/posts/${post._id}/comment`,
        { text: commentInput.trim() },
        { withCredentials: true }
      );

      const updated = res.data.post?.comments || [
        ...commentsList,
        {
          text: commentInput.trim(),
          createdAt: new Date().toISOString(),
          profile: post.profile,
        },
      ];
      setCommentsList(updated);
      setCommentInput("");
    } catch (err) {
      console.error("Failed to add comment", err);
      overlayCard.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const authorProfile = post.profile || {};
  const authorUser = post.user || {};
  const authorName = authorProfile.userName || authorUser.firstName || "Creator";
  const authorPhoto = authorProfile.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all cursor-pointer md:hidden"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* Left Side: Media Display */}
        <div 
          className="relative md:w-3/5 bg-slate-950 flex items-center justify-center min-h-[300px] md:min-h-[540px] cursor-pointer overflow-hidden"
          onDoubleClick={handleDoubleTap}
        >
          <img
            src={post.image || post.thumbnailUrl}
            alt={post.caption || "Explore post"}
            className="w-full h-full object-cover max-h-[65vh] md:max-h-[580px]"
          />

          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <i className="fa-solid fa-heart text-7xl text-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.8)] animate-[ob-heart-burst_0.8s_ease-out_forwards]"></i>
            </div>
          )}

          {/* Category Tag Pills Overlay */}
          {post.categoryTags && post.categoryTags.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 z-20">
              {post.categoryTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Creator info, caption, comments & interactive actions */}
        <div className="md:w-2/5 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${authorProfile._id || ""}`} onClick={onClose}>
                <img
                  src={authorPhoto}
                  alt={authorName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
              </Link>
              <div>
                <Link
                  to={`/profile/${authorProfile._id || ""}`}
                  onClick={onClose}
                  className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors block"
                >
                  @{authorName}
                </Link>
                <span className="text-[11px] text-slate-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="hidden md:flex text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Comments and Caption scrollable container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[300px] md:max-h-[360px]">
            {/* Post Caption */}
            {post.caption && (
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <img
                  src={authorPhoto}
                  alt={authorName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                />
                <div className="text-xs leading-relaxed text-slate-700">
                  <span className="font-bold text-slate-900 mr-1.5">
                    @{authorName}
                  </span>
                  <span>{post.caption}</span>
                </div>
              </div>
            )}

            {/* Comments Stream */}
            {commentsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center">
                <i className="fa-regular fa-comment-dots text-2xl mb-1 text-slate-300"></i>
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              commentsList.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <img
                    src={c.profile?.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"}
                    alt="Commenter"
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 mr-1.5">
                      {c.profile?.userName || "User"}
                    </span>
                    <span className="text-slate-700 leading-relaxed">{c.text}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions Bar (Like, Comment, Share, Save) */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleLike}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isLiked
                      ? "text-rose-500 bg-rose-50 hover:bg-rose-100"
                      : "text-slate-600 hover:text-rose-500 hover:bg-slate-100"
                  }`}
                  aria-label="Like Post"
                >
                  <i className={`fa-solid fa-heart text-xl ${isLiked ? "animate-[ob-pop_0.3s_ease-out]" : ""}`}></i>
                </button>

                <button
                  onClick={() => document.getElementById("explore-comment-input")?.focus()}
                  className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer"
                  aria-label="Comment"
                >
                  <i className="fa-solid fa-comment-dots text-xl"></i>
                </button>

                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer"
                  aria-label="Share"
                >
                  <i className="fa-solid fa-paper-plane text-xl"></i>
                </button>
              </div>

              <button
                onClick={handleToggleBookmark}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isSaved
                    ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                    : "text-slate-600 hover:text-amber-500 hover:bg-slate-100"
                }`}
                aria-label="Save Post"
              >
                <i className="fa-solid fa-bookmark text-xl"></i>
              </button>
            </div>

            {/* Likes Count & View Count */}
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold px-1">
              <span>{likeCount.toLocaleString()} likes</span>
              {post.viewsCount > 0 && (
                <span className="text-slate-400 font-normal">
                  <i className="fa-regular fa-eye mr-1"></i>
                  {post.viewsCount.toLocaleString()} views
                </span>
              )}
            </div>

            {/* Comment Input Form */}
            <form onSubmit={handleSubmitComment} className="mt-3 flex items-center gap-2">
              <input
                id="explore-comment-input"
                type="text"
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={isSubmitting || !commentInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        post={post}
      />
    </div>
  );
};

export default ExplorePostModal;
