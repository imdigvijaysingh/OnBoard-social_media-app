import React, { useState } from "react";
import axios from "axios";
import { overlayCard } from "../context/OverlayCardContext";

const ChapterDetailModal = ({
  isOpen,
  chapter,
  isOwner,
  onClose,
  onEditChapter,
  onChapterDeleted,
  onSelectPost,
  userPosts = [],
  onChapterUpdated,
}) => {
  const [isAddingPhotos, setIsAddingPhotos] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [isSubmittingPhotos, setIsSubmittingPhotos] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !chapter) return null;

  const currentPostIds = (chapter.posts || []).map((p) =>
    typeof p === "object" ? p._id : p
  );

  const availablePosts = userPosts.filter(
    (p) => !currentPostIds.includes(p._id)
  );

  const handleToggleAddPost = (postId) => {
    setSelectedToAdd((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleSaveAddedPhotos = async () => {
    if (selectedToAdd.length === 0) {
      setIsAddingPhotos(false);
      return;
    }

    try {
      setIsSubmittingPhotos(true);
      const res = await axios.post(
        `http://localhost:3000/api/chapters/${chapter._id}/add-posts`,
        { postIds: selectedToAdd },
        { withCredentials: true }
      );
      overlayCard.success("Photos added to Chapter! ✨");
      if (onChapterUpdated) {
        onChapterUpdated(res.data.chapter);
      }
      setSelectedToAdd([]);
      setIsAddingPhotos(false);
    } catch (err) {
      console.error("Failed to add photos:", err);
      overlayCard.error("Failed to add photos to chapter.");
    } finally {
      setIsSubmittingPhotos(false);
    }
  };

  const handleDeleteChapter = async () => {
    const confirmed = await overlayCard.confirm(
      `Are you sure you want to delete chapter "${chapter.title}"? Your photos will not be deleted, only unlinked from this chapter.`,
      { title: "Delete Chapter" }
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:3000/api/chapters/${chapter._id}`, {
        withCredentials: true,
      });
      overlayCard.success("Chapter deleted.");
      if (onChapterDeleted) {
        onChapterDeleted(chapter._id);
      }
      onClose();
    } catch (err) {
      console.error("Failed to delete chapter:", err);
      overlayCard.error("Failed to delete chapter.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Cover Banner */}
        <div className="relative h-48 sm:h-60 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 overflow-hidden shrink-0">
          {chapter.coverImage ? (
            <img
              src={chapter.coverImage}
              alt={chapter.title}
              className="w-full h-full object-cover opacity-50 blur-[1px] scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 opacity-60"></div>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer z-10"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 sm:p-6 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-2xl p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xs">
                {chapter.emoji || "📖"}
              </span>
              {chapter.timeframe && (
                <span className="text-[11px] font-bold px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full border border-white/20">
                  🗓️ {chapter.timeframe}
                </span>
              )}
              <span className="text-[11px] font-bold px-2.5 py-1 bg-indigo-500/40 backdrop-blur-md text-indigo-100 rounded-full border border-indigo-400/30">
                📸 {chapter.posts?.length || 0} photos
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">
              {chapter.title}
            </h2>

            {chapter.description && (
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl line-clamp-2 leading-relaxed font-normal">
                {chapter.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Bar for Owner */}
        {isOwner && (
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingPhotos(!isAddingPhotos)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAddingPhotos
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
                <span>{isAddingPhotos ? "Cancel Adding" : "Add Photos"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onEditChapter) onEditChapter(chapter);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                <span>Edit Info</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteChapter}
              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <i className="fa-regular fa-trash-can text-[10px]"></i>
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Inline Drawer: Add Photos to Chapter */}
        {isAddingPhotos && (
          <div className="p-4 bg-indigo-50/60 border-b border-indigo-100 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-900">
                Select photos to bundle into this chapter:
              </span>
              <button
                type="button"
                disabled={isSubmittingPhotos || selectedToAdd.length === 0}
                onClick={handleSaveAddedPhotos}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPhotos ? "Saving..." : `Add Selected (${selectedToAdd.length})`}
              </button>
            </div>

            {availablePosts.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                {availablePosts.map((post) => {
                  const isChecked = selectedToAdd.includes(post._id);
                  return (
                    <div
                      key={post._id}
                      onClick={() => handleToggleAddPost(post._id)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        isChecked
                          ? "border-indigo-600 scale-95 shadow-sm"
                          : "border-transparent opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={post.image}
                        alt="available"
                        className="w-full h-full object-cover"
                      />
                      {isChecked && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px]">
                          <i className="fa-solid fa-check"></i>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-2">
                All your existing photos are already in this chapter! Upload new photos in Feed to add more.
              </p>
            )}
          </div>
        )}

        {/* Photos Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {chapter.posts && chapter.posts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {chapter.posts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => {
                    if (onSelectPost) onSelectPost(post);
                  }}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 cursor-pointer group shadow-xs hover:shadow-lg transition-all duration-200 border border-slate-200/60"
                >
                  <img
                    src={post.image}
                    alt={post.caption || "Chapter photo"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-bold backdrop-blur-[1px]">
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-heart text-rose-500"></i>
                      {post.likes?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-comment"></i>
                      {post.comments?.length || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
              <span className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mb-3 text-slate-400">
                <i className="fa-regular fa-images"></i>
              </span>
              <h4 className="text-sm font-bold text-slate-700 mb-1">
                No photos in this chapter yet
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mb-4">
                Add photos to build out this era of your life.
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsAddingPhotos(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  + Add Photos Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterDetailModal;
