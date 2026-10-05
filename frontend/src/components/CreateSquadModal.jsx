import React, { useState } from "react";
import axios from "axios";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
];

const PRESET_BANNERS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
];

const POPULAR_TAGS = [
  "technology",
  "fitness",
  "photography",
  "design",
  "travel",
  "gaming",
  "music",
  "coding",
  "art",
  "crypto",
  "startups",
  "lifestyle",
];

const CreateSquadModal = ({ isOpen, onClose, onSquadCreated }) => {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState(["technology"]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [whoCanChat, setWhoCanChat] = useState("all_members");
  const [whoCanInvite, setWhoCanInvite] = useState("all_members");
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [banner, setBanner] = useState(PRESET_BANNERS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleNameChange = (val) => {
    setName(val);
    if (!handle || handle.startsWith("squad_") || handle === name.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20)) {
      setHandle(val.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20));
    }
  };

  const toggleTag = (tag) => {
    const lower = tag.toLowerCase().trim();
    if (selectedTags.includes(lower)) {
      setSelectedTags(selectedTags.filter((t) => t !== lower));
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, lower]);
      }
    }
  };

  const handleAddCustomTag = (e) => {
    if (e.key === "Enter" && customTagInput.trim()) {
      e.preventDefault();
      const clean = customTagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (clean && !selectedTags.includes(clean) && selectedTags.length < 5) {
        setSelectedTags([...selectedTags, clean]);
        setCustomTagInput("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter a squad name");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/squads",
        {
          name: name.trim(),
          handle: handle.trim().toLowerCase(),
          tagline: tagline.trim(),
          description: description.trim(),
          categoryTags: selectedTags,
          privacy,
          whoCanChat,
          whoCanInvite,
          avatar,
          banner,
        },
        { withCredentials: true }
      );

      if (onSquadCreated) {
        onSquadCreated(res.data.squad);
      }
      onClose();
    } catch (err) {
      console.error("Error creating squad:", err);
      setErrorMsg(err.response?.data?.message || "Failed to create squad. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-500/20">
              ⚓
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
                Form a New Squad
              </h2>
              <p className="text-xs text-slate-500">
                You become the <span className="text-indigo-600 font-bold">Captain</span> of this community
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Banner & Avatar Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Squad Visuals
            </label>
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
              <img
                src={banner}
                alt="Squad Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-3 left-4 flex items-center gap-3">
                <img
                  src={avatar}
                  alt="Squad Avatar"
                  className="w-14 h-14 rounded-2xl border-2 border-white object-cover shadow-md bg-white"
                />
                <div className="text-white drop-shadow">
                  <span className="font-extrabold text-sm block">
                    {name || "Your Squad Name"}
                  </span>
                  <span className="text-xs text-slate-200">
                    @{handle || "squad_handle"}
                  </span>
                </div>
              </div>
            </div>

            {/* Presets picker */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Choose preset banner:</span>
              <div className="flex items-center gap-1.5">
                {PRESET_BANNERS.map((bUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBanner(bUrl)}
                    className={`w-6 h-6 rounded-md overflow-hidden border-2 transition-all ${
                      banner === bUrl ? "border-indigo-600 scale-110 shadow-xs" : "border-transparent opacity-70"
                    }`}
                  >
                    <img src={bUrl} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Choose preset avatar:</span>
              <div className="flex items-center gap-1.5">
                {PRESET_AVATARS.map((aUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(aUrl)}
                    className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${
                      avatar === aUrl ? "border-indigo-600 scale-110 shadow-xs" : "border-transparent opacity-70"
                    }`}
                  >
                    <img src={aUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Squad Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Web3 Builders, Iron Lifters"
                maxLength={60}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Squad Handle <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  @
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="iron_lifters"
                  maxLength={25}
                  required
                  className="w-full pl-8 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tagline (One-liner)
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. The definitive crew for high performance fitness & gains."
              maxLength={120}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Category Interests Tags (Critical for Recommendations Feed) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Interest & Category Tags
              </label>
              <span className="text-[10px] text-indigo-600 font-semibold">
                Feeds & Recommendations (up to 5)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Accounts with similar interests will automatically discover this squad in their recommendations feed.
            </p>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Popular Tag suggestions */}
            <div className="flex flex-wrap gap-1 mb-2">
              {POPULAR_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              placeholder="Type custom tag and press Enter..."
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Captain's Permissions & Rules */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">🛡️</span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Captain's Controls & Permissions
              </span>
            </div>

            {/* Privacy */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-800 block">Squad Visibility</span>
                <span className="text-[11px] text-slate-400">
                  {privacy === "public" ? "Anyone can discover & join" : "Only invited members can join"}
                </span>
              </div>
              <div className="flex p-0.5 bg-slate-200 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPrivacy("public")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    privacy === "public" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacy("invite_only")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    privacy === "invite_only" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Invite-Only
                </button>
              </div>
            </div>

            {/* Who can chat */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-800 block">Squad Group Chat</span>
                <span className="text-[11px] text-slate-400">
                  {whoCanChat === "all_members" ? "All squad members can send messages" : "Captains & Sub-Captains only broadcast"}
                </span>
              </div>
              <div className="flex p-0.5 bg-slate-200 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setWhoCanChat("all_members")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    whoCanChat === "all_members" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                  }`}
                >
                  All Members
                </button>
                <button
                  type="button"
                  onClick={() => setWhoCanChat("captains_only")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    whoCanChat === "captains_only" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Captains Only
                </button>
              </div>
            </div>

            {/* Who can invite */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-800 block">Member Invitations</span>
                <span className="text-[11px] text-slate-400">
                  {whoCanInvite === "all_members" ? "Any member can invite their crew" : "Only Captains can invite new members"}
                </span>
              </div>
              <div className="flex p-0.5 bg-slate-200 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setWhoCanInvite("all_members")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    whoCanInvite === "all_members" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                  }`}
                >
                  All Members
                </button>
                <button
                  type="button"
                  onClick={() => setWhoCanInvite("captains_only")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    whoCanInvite === "captains_only" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Captains Only
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Squad Lore
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this squad about? What are the goals, guidelines, and vibe?"
              maxLength={800}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Assembling Squad...</span>
                </>
              ) : (
                <>
                  <span>⚓ Set Sail as Captain</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSquadModal;
