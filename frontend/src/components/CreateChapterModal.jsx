import React, { useState } from "react";
import axios from "axios";
import { overlayCard } from "../context/OverlayCardContext";

const EMOJI_PRESETS = [
  { emoji: "🎓", label: "College" },
  { emoji: "✈️", label: "Travel" },
  { emoji: "🚀", label: "Startup" },
  { emoji: "💼", label: "Career" },
  { emoji: "🏖️", label: "Vacation" },
  { emoji: "🎸", label: "Music" },
  { emoji: "🎨", label: "Art" },
  { emoji: "🏕️", label: "Adventure" },
  { emoji: "💻", label: "Coding" },
  { emoji: "🍕", label: "Memories" },
  { emoji: "🏆", label: "Milestone" },
  { emoji: "✨", label: "Vibes" },
];

const CreateChapterModal = ({
  isOpen,
  onClose,
  onChapterCreated,
  userPosts = [],
  initialChapter = null,
}) => {
  const isEditing = !!initialChapter;
  const [title, setTitle] = useState(initialChapter?.title || "");
  const [emoji, setEmoji] = useState(initialChapter?.emoji || "🎓");
  const [timeframe, setTimeframe] = useState(initialChapter?.timeframe || "");
  const [description, setDescription] = useState(initialChapter?.description || "");
  const [coverImage, setCoverImage] = useState(initialChapter?.coverImage || "");
  const [selectedPostIds, setSelectedPostIds] = useState(
    initialChapter?.posts?.map((p) => (typeof p === "object" ? p._id : p)) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const togglePostSelection = (postId, postImageUrl) => {
    setSelectedPostIds((prev) => {
      const isSelected = prev.includes(postId);
      const next = isSelected ? prev.filter((id) => id !== postId) : [...prev, postId];
      // Auto-set cover image if none set and selecting first post
      if (!coverImage && !isSelected && postImageUrl) {
        setCoverImage(postImageUrl);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      overlayCard.error("Please enter a chapter title.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        emoji,
        timeframe: timeframe.trim(),
        description: description.trim(),
        coverImage,
        postIds: selectedPostIds,
      };

      let res;
      if (isEditing) {
        res = await axios.put(
          `http://localhost:3000/api/chapters/${initialChapter._id}`,
          payload,
          { withCredentials: true }
        );
        overlayCard.success("Chapter updated successfully! ✨");
      } else {
        res = await axios.post("http://localhost:3000/api/chapters", payload, {
          withCredentials: true,
        });
        overlayCard.success("New Chapter created! 📖");
      }

      if (onChapterCreated) {
        onChapterCreated(res.data.chapter);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save chapter:", err);
      overlayCard.error(
        err.response?.data?.message || "Failed to save chapter. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shadow-xs">
              {emoji}
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {isEditing ? "Edit Chapter" : "New Life Chapter"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Organize your life story into meaningful milestones
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 flex-1">
            {/* Emoji Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Chapter Icon
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {EMOJI_PRESETS.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => setEmoji(item.emoji)}
                    className={`h-9 px-2.5 rounded-xl text-base flex items-center gap-1 shrink-0 border transition-all cursor-pointer ${
                      emoji === item.emoji
                        ? "bg-indigo-50 border-indigo-500 scale-105 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span className="text-[10px] font-medium text-slate-600">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter Title */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Chapter Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. College Era, Goa Trip 2025, First Startup"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
              />
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Timeframe / Year
              </label>
              <input
                type="text"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="e.g. 2022 – 2026, Summer '25, Nov 2025"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
              />
            </div>

            {/* Description / Story */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                The Story / Memories
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a few lines about this era of your life..."
                rows={2}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
              />
            </div>

            {/* Select Photos from Posts */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Add Photos ({selectedPostIds.length} selected)
                </label>
                <span className="text-[10px] text-slate-400">
                  Tap to add/remove photos
                </span>
              </div>

              {userPosts.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                  {userPosts.map((post) => {
                    const isSelected = selectedPostIds.includes(post._id);
                    const isCover = coverImage === post.image;
                    return (
                      <div
                        key={post._id}
                        onClick={() => togglePostSelection(post._id, post.image)}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected
                            ? "border-indigo-600 scale-95 shadow-sm"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={post.image}
                          alt="post"
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">
                            <i className="fa-solid fa-check"></i>
                          </div>
                        )}
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCoverImage(post.image);
                            }}
                            className={`absolute bottom-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs ${
                              isCover
                                ? "bg-amber-400 text-slate-900"
                                : "bg-black/60 text-white hover:bg-black/80"
                            }`}
                          >
                            {isCover ? "Cover" : "Set Cover"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No photos uploaded yet. You can still create the chapter and add photos later!
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-book-bookmark text-[11px]"></i>
                  <span>{isEditing ? "Save Changes" : "Create Chapter"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChapterModal;
