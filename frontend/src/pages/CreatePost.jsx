import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { scrollToTop } from "../utils/scrollToTop";
import PhotoCropperModal from "../components/PhotoCropperModal";
import { overlayCard } from "../context/OverlayCardContext";
import pulse from "../utils/pulseEngine";

const CATEGORY_OPTIONS = [
  "tech", "coding", "comedy", "memes", "travel", "fitness", 
  "art", "food", "music", "gaming", "fashion", "lifestyle"
];

const VIDEO_PRESETS = [
  { label: "🌊 Ocean Waves", url: "https://vjs.zencdn.net/v/oceans.mp4", audio: "Tropical Chill Waves • Summer Tape" },
  { label: "🌸 Nature Bloom", url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", audio: "Ambient Lo-Fi Beats" },
  { label: "🐰 Fun Animation", url: "https://www.w3schools.com/html/mov_bbb.mp4", audio: "Comedy Club Live • Tape 1" }
];

const CreatePost = ({ onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [mediaType, setMediaType] = useState("image"); // 'image' | 'reel'
  const [rawImage, setRawImage] = useState("");
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audioTrack, setAudioTrack] = useState("Original Audio");
  const [selectedTags, setSelectedTags] = useState(["lifestyle"]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    scrollToTop();
    axios
      .get("http://localhost:3000/api/chapters/me", { withCredentials: true })
      .then((res) => {
        setChapters(res.data.chapters || []);
      })
      .catch(() => {});
  }, []);

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() || "";
      setRawImage(result);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
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

  const handleCropComplete = (blob, previewUrl) => {
    setCroppedImageBlob(blob);
    setCroppedImageUrl(previewUrl);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const clean = customTagInput.replace(/#/g, "").trim().toLowerCase();
      if (clean && !selectedTags.includes(clean)) {
        setSelectedTags((prev) => [...prev, clean]);
        setCustomTagInput("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mediaType === "image" && !croppedImageBlob) {
      overlayCard.info("Please select and crop an image first.", { title: "Image Required" });
      return;
    }

    if (mediaType === "reel" && !videoUrl.trim() && !croppedImageBlob) {
      overlayCard.info("Please enter a video URL or select a video preset.", { title: "Video Required" });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("mediaType", mediaType);
      formData.append("categoryTags", JSON.stringify(selectedTags));
      formData.append("audioTrack", audioTrack);

      if (croppedImageBlob) {
        formData.append("image", croppedImageBlob, "post-image.jpg");
      }

      if (mediaType === "reel") {
        formData.append("videoUrl", videoUrl.trim());
      }

      if (selectedChapterId) {
        formData.append("chapterId", selectedChapterId);
      }

      await axios.post("http://localhost:3000/api/create-post", formData, {
        withCredentials: true,
      });

      pulse.postPublished();
      setIsAnimating(true);
      setTimeout(() => {
        handleSafeClose();
      }, 1600);
    } catch (err) {
      console.error("Error creating post:", err);
      overlayCard.error("Error creating post. Please try again.");
      setIsSubmitting(false);
    }
  };

  const navigate = useNavigate();
  const handleSafeClose = () => {
    if (onClose) onClose();
    else navigate("/feed");
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleSafeClose();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 ${
          isAnimating ? "blur-sm pointer-events-none" : ""
        }`}
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h2 className="text-lg font-bold text-slate-900">Create New Post</h2>
            </div>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={handleSafeClose}
              aria-label="Close"
              type="button"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Post Type Selector (Photo vs Reel) */}
          <div className="px-6 pt-3 pb-1 border-b border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={() => setMediaType("image")}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mediaType === "image"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <i className="fa-solid fa-image"></i>
              <span>Photo Post</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType("reel")}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mediaType === "reel"
                  ? "bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md shadow-pink-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <i className="fa-solid fa-water text-[11px]"></i>
              <span>Wave (Video)</span>
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Photo Mode Media Selection */}
              {mediaType === "image" && (
                <>
                  {!croppedImageUrl ? (
                    <div
                      className={`border-2 border-dashed rounded-2xl py-10 px-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                        isDragging
                          ? "border-indigo-600 bg-indigo-50/70 scale-[1.01]"
                          : "border-slate-300 bg-slate-50/70 hover:border-indigo-500 hover:bg-indigo-50/30"
                      }`}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-1 shadow-inner">
                        <i className="fa-regular fa-image"></i>
                      </div>
                      <p className="text-xs font-bold text-slate-700">Drag &amp; drop your photo here</p>
                      <p className="text-[11px] text-slate-400">Supports JPG, PNG, WEBP with custom crop</p>
                      <input
                        type="file"
                        accept="image/*"
                        id="file-upload"
                        onChange={onSelectFile}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
                      >
                        Choose Photo
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[30vh] w-full">
                        <img
                          src={croppedImageUrl}
                          alt="Cropped post preview"
                          className="max-h-[30vh] w-auto max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                          onClick={() => setIsCropperOpen(true)}
                        >
                          <i className="fa-solid fa-crop-simple text-indigo-600"></i>
                          <span>Recrop Photo</span>
                        </button>
                        <label
                          htmlFor="re-upload-file"
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Change
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          id="re-upload-file"
                          onChange={onSelectFile}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Wave Mode Video Input */}
              {mediaType === "reel" && (
                <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <i className="fa-solid fa-link text-indigo-600"></i> Video Stream URL (.mp4 / stream)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />

                  {/* Quick Video Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400">Or pick a demo wave preset:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {VIDEO_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setVideoUrl(preset.url);
                            setAudioTrack(preset.audio);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                            videoUrl === preset.url
                              ? "bg-indigo-600 border-indigo-600 text-white font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Track Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <i className="fa-solid fa-music text-pink-500"></i> Audio Track Name
                    </label>
                    <input
                      type="text"
                      value={audioTrack}
                      onChange={(e) => setAudioTrack(e.target.value)}
                      placeholder="e.g. Original Audio - @username"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Caption &amp; Story</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share what this post is about, mention friends, add hashtags..."
                  required
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Optional: Add to Life Chapter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <i className="fa-solid fa-book-bookmark text-indigo-600"></i> Add to Chapter (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400">Save to your life timeline</span>
                </div>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 cursor-pointer transition-all"
                >
                  <option value="">None (Standalone Post)</option>
                  {chapters.map((chap) => (
                    <option key={chap._id} value={chap._id}>
                      {chap.emoji || "📖"} {chap.title} {chap.timeframe ? `(${chap.timeframe})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Tags Selector (For Instagram Discover Matching!) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <i className="fa-solid fa-tags text-indigo-600"></i> Category Tags (for Discover Page)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {CATEGORY_OPTIONS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Tag input */}
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  placeholder="Type a custom tag and press Enter..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-indigo-600 mt-1"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-3 justify-end mt-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSafeClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (mediaType === "image" && !croppedImageBlob) || (mediaType === "reel" && !videoUrl.trim())}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>{mediaType === "reel" ? "Share Wave" : "Share Post"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Cinematic Blur Overlay on Post Creation */}
      {isAnimating && (
        <div className="fixed inset-0 z-[1100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-slate-900 animate-in slide-in-from-bottom-2 duration-300">
            {mediaType === "reel" ? "Catching the Wave to Discover... 🌊" : "Publishing to Crew... 🚀"}
          </h2>
        </div>
      )}

      {/* Enhanced Photo Cropper Modal */}
      <PhotoCropperModal
        isOpen={isCropperOpen}
        imageSrc={rawImage}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
        initialAspect={1}
        lockAspect={false}
        title="Crop &amp; Frame Post Photo"
      />
    </>
  );
};

export default CreatePost;
