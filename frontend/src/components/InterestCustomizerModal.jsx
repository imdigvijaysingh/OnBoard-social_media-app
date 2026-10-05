import React, { useState } from "react";
import axios from "axios";
import { overlayCard } from "../context/OverlayCardContext";

const AVAILABLE_INTERESTS = [
  { id: "tech", label: "Tech & Coding", icon: "💻", color: "from-blue-500 to-indigo-600" },
  { id: "comedy", label: "Comedy & Memes", icon: "😂", color: "from-amber-400 to-orange-500" },
  { id: "travel", label: "Travel & Outdoors", icon: "✈️", color: "from-cyan-400 to-blue-500" },
  { id: "fitness", label: "Fitness & Gym", icon: "🏋️", color: "from-emerald-400 to-teal-600" },
  { id: "art", label: "Art & Design", icon: "🎨", color: "from-purple-400 to-pink-500" },
  { id: "food", label: "Food & Cooking", icon: "🍔", color: "from-orange-400 to-red-500" },
  { id: "music", label: "Music & Beats", icon: "🎧", color: "from-violet-500 to-purple-600" },
  { id: "gaming", label: "Gaming & Esports", icon: "🎮", color: "from-rose-500 to-pink-600" },
  { id: "fashion", label: "Fashion & Style", icon: "👗", color: "from-pink-400 to-rose-500" },
  { id: "nature", label: "Nature & Peace", icon: "🌿", color: "from-green-500 to-emerald-600" },
  { id: "lifestyle", label: "Lifestyle & Vibe", icon: "✨", color: "from-yellow-400 to-amber-500" },
];

const InterestCustomizerModal = ({
  isOpen,
  currentInterests = [],
  onClose,
  onSave,
}) => {
  const [selectedInterests, setSelectedInterests] = useState(
    currentInterests.length > 0 ? currentInterests : ["tech", "travel", "comedy", "music"]
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.put(
        "http://localhost:3000/api/posts/interests",
        { interests: selectedInterests },
        { withCredentials: true }
      );
      overlayCard.success("Your recommendation algorithm has adapted! ✨", {
        title: "Taste Profile Saved",
      });
      if (onSave) {
        onSave(selectedInterests);
      }
      onClose();
    } catch (err) {
      console.error("Failed to update interests", err);
      // Even if offline/unauth, still apply locally
      if (onSave) {
        onSave(selectedInterests);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg shadow-sm">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Your Taste Profile
              </h2>
              <p className="text-xs text-slate-500">
                Choose the topics you love to tune your Instagram Discover algorithm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Interests Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-6 max-h-[360px] overflow-y-auto pr-1">
          {AVAILABLE_INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-sm shadow-indigo-600/10 scale-[1.02]"
                    : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <span className="text-2xl">{interest.icon}</span>
                <span className="text-xs font-bold text-center leading-tight">
                  {interest.label}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                  isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {isSelected ? "Active" : "Add"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">
            {selectedInterests.length} topics selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Apply to Discover</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestCustomizerModal;
