import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import PhotoCropperModal from "../components/PhotoCropperModal";
import MemberBadge from "../components/MemberBadge";
import CommunityStandingBadge from "../components/CommunityStandingBadge";
import AccountSettingsModal from "../components/AccountSettingsModal";
import OfficialTickModal from "../components/OfficialTickModal";
import CrewFollowingModal from "../components/CrewFollowingModal";
import ShareModal from "../components/ShareModal";
import CreateChapterModal from "../components/CreateChapterModal";
import ChapterDetailModal from "../components/ChapterDetailModal";
import Profile1 from "../assets/profile.jpg";
import { scrollToTop } from "../utils/scrollToTop";
import { downloadImage } from "../utils/downloadImage";
import { overlayCard } from "../context/OverlayCardContext";
import { useSidebar } from "../context/SidebarContext";
import pulse from "../utils/pulseEngine";

const ERA_PRESETS = [
  { emoji: "🚀", text: "Building Something" },
  { emoji: "🎧", text: "In My Zone" },
  { emoji: "📚", text: "Study & Exam Time" },
  { emoji: "☕", text: "Taking a Break" },
  { emoji: "✨", text: "Just Vibing" },
  { emoji: "💪", text: "Gym & Health" },
  { emoji: "🍕", text: "Food & Chill" },
  { emoji: "🎮", text: "Gaming Night" },
  { emoji: "✈️", text: "Traveling & Exploring" },
  { emoji: "🌙", text: "Night Owl Mode" },
];

const MyProfile = () => {
  const { isCollapsed } = useSidebar();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState({});
  const [savedPostsList, setSavedPostsList] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isCreateChapterOpen, setIsCreateChapterOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState("posts"); // "posts" | "chapters" | "saved"
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);
  const [rawAvatarForCrop, setRawAvatarForCrop] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const isOwnProfile = true;

  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [commentSectionsOpen, setCommentSectionsOpen] = useState({});
  const [currentEra, setCurrentEra] = useState(() => {
    return localStorage.getItem("onboard_current_era") || "✨ Just Vibing";
  });
  const [isEraModalOpen, setIsEraModalOpen] = useState(false);
  const [customEraInput, setCustomEraInput] = useState("");
  const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyToast, setPrivacyToast] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [crewModalTab, setCrewModalTab] = useState("crew");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetPost, setShareTargetPost] = useState(null);

  // Avatar dropdown menu state
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);

  // Unified Edit Profile Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editPronouns, setEditPronouns] = useState("");
  const [isCustomPronouns, setIsCustomPronouns] = useState(false);
  const [editDob, setEditDob] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editShowEmail, setEditShowEmail] = useState(false);
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editShowPhone, setEditShowPhone] = useState(false);
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isTestingBirthday, setIsTestingBirthday] = useState(false);
  const [birthdayAlertMessage, setBirthdayAlertMessage] = useState("");
  const [isPhotoHistoryOpen, setIsPhotoHistoryOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const usernameDebounceRef = useRef(null);

  const handleOpenEditProfile = () => {
    setEditFirstName(profile?.firstName || profile?.name?.split(" ")[0] || "");
    setEditLastName(profile?.lastName || profile?.name?.split(" ").slice(1).join(" ") || "");
    setEditUserName(profile?.userName || "");
    setEditBio(profile?.bio || "");
    setEditGender(profile?.gender || "");
    const userPronouns = profile?.pronouns || "";
    setEditPronouns(userPronouns);
    const standardPronouns = ["", "he/him", "she/her", "they/them", "he/they", "she/they", "any pronouns"];
    setIsCustomPronouns(Boolean(userPronouns && !standardPronouns.includes(userPronouns)));
    setEditDob(profile?.dob || "");
    setEditIsPrivate(Boolean(profile?.isPrivate));
    setEditContactEmail(profile?.contactEmail || "");
    setEditShowEmail(profile?.showEmail || false);
    setEditContactPhone(profile?.contactPhone || "");
    setEditShowPhone(profile?.showPhone || false);
    setNewAvatarFile(null);
    setNewAvatarPreview(null);
    setUsernameStatus(null);
    setBirthdayAlertMessage("");
    setIsEditProfileOpen(true);
  };

  // Live Auto-Check Username Availability as soon as user types
  useEffect(() => {
    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current);
    }

    const trimmed = (editUserName || "").trim();

    // If blank or identical to user's current username
    if (!trimmed || trimmed.toLowerCase() === (profile?.userName || "").toLowerCase()) {
      setUsernameStatus(null);
      setIsCheckingUsername(false);
      return;
    }

    // Minimum 3 characters
    if (trimmed.length < 3) {
      setUsernameStatus({ available: false, message: "Must be at least 3 characters" });
      setIsCheckingUsername(false);
      return;
    }

    // Allowed characters: letters, numbers, underscores, dots
    if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) {
      setUsernameStatus({ available: false, message: "Only letters, numbers, underscores & dots" });
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameStatus(null);

    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/profile/check-username/${encodeURIComponent(trimmed)}`,
          { withCredentials: true }
        );
        setUsernameStatus(res.data);
      } catch (err) {
        console.error("Live username check error:", err);
        setUsernameStatus({ available: false, message: "Could not verify username" });
      } finally {
        setIsCheckingUsername(false);
      }
    }, 280);

    return () => {
      if (usernameDebounceRef.current) {
        clearTimeout(usernameDebounceRef.current);
      }
    };
  }, [editUserName, profile?.userName]);

  // Close avatar dropdown menu on outside click
  useEffect(() => {
    const handleAvatarOutsideClick = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setIsAvatarMenuOpen(false);
      }
    };
    if (isAvatarMenuOpen) {
      document.addEventListener("mousedown", handleAvatarOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleAvatarOutsideClick);
    };
  }, [isAvatarMenuOpen]);

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    setEditUserName(clean);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawAvatarForCrop(reader.result);
        setIsAvatarCropOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarCropComplete = (blob, previewUrl) => {
    setNewAvatarFile(blob);
    setNewAvatarPreview(previewUrl);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editUserName.trim()) {
      overlayCard.error("Username cannot be empty", { title: "Invalid Username" });
      return;
    }
    if (usernameStatus && !usernameStatus.available) {
      overlayCard.error("Please choose a unique available username", { title: "Username Unavailable" });
      return;
    }

    try {
      setIsSavingProfile(true);
      const formData = new FormData();
      formData.append("firstName", editFirstName);
      formData.append("lastName", editLastName);
      formData.append("userName", editUserName);
      formData.append("bio", editBio);
      formData.append("gender", editGender);
      formData.append("pronouns", editPronouns);
      formData.append("dob", editDob);
      formData.append("contactEmail", editContactEmail);
      formData.append("showEmail", editShowEmail);
      formData.append("contactPhone", editContactPhone);
      formData.append("showPhone", editShowPhone);
      formData.append("isPrivate", editIsPrivate);
      if (newAvatarFile) {
        formData.append("profilePhoto", newAvatarFile);
      }

      const res = await axios.put("http://localhost:3000/api/profile/update", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile((prev) => ({
        ...prev,
        ...res.data.user,
        isPrivate: editIsPrivate,
      }));

      setIsEditProfileOpen(false);
      overlayCard.success("Profile updated successfully! ✨", { title: "Profile Updated" });
    } catch (err) {
      console.error("Failed to update profile", err);
      const msg = err.response?.data?.message || "Failed to update profile";
      overlayCard.error(msg, { title: "Update Failed" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleTriggerBirthdayAlert = async () => {
    try {
      setIsTestingBirthday(true);
      const res = await axios.post(
        "http://localhost:3000/api/profile/birthday-alerts",
        {},
        { withCredentials: true }
      );
      const msg = res.data.message || "Birthday notification sent! 🎂";
      setBirthdayAlertMessage(msg);
      overlayCard.success(msg, { title: "Birthday Alert Activated" });
    } catch (err) {
      console.error("Failed to send birthday alert", err);
      const errMsg = err.response?.data?.message || "Failed to send birthday alert. Ensure your date of birth is set.";
      setBirthdayAlertMessage(errMsg);
      overlayCard.error(errMsg, { title: "Birthday Alert" });
    } finally {
      setIsTestingBirthday(false);
    }
  };

  const handleConfirmTogglePrivacy = async () => {
    try {
      setIsTogglingPrivacy(true);
      const targetState = !profile?.isPrivate;
      const res = await axios.put(
        "http://localhost:3000/api/profile/privacy",
        { isPrivate: targetState },
        { withCredentials: true }
      );
      setProfile((prev) => ({ ...prev, isPrivate: res.data.isPrivate }));
      setIsPrivacyModalOpen(false);
      setPrivacyToast({
        type: "success",
        message: res.data.isPrivate
          ? "Account is now Private 🔒 Only approved crew can view your posts."
          : "Account is now Public 🌐 Anyone can view your posts and explore your gallery.",
      });
      setTimeout(() => setPrivacyToast(null), 4000);
    } catch (err) {
      console.error("Failed to toggle privacy", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update account privacy. Please try again.";
      setPrivacyToast({
        type: "error",
        message: errorMsg,
      });
      setTimeout(() => setPrivacyToast(null), 5000);
    } finally {
      setIsTogglingPrivacy(false);
    }
  };

  useEffect(() => {
    if (selectedPost || editingPost || postToDelete) {
      scrollToTop();
    }
  }, [selectedPost, editingPost, postToDelete]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchProfileAndPosts = () => {
    setIsLoadingProfile(true);
    axios
      .get("http://localhost:3000/api/profile/get-me", {
        withCredentials: true,
      })
      .then((res) => {
        setProfile(res.data.user);
        if (res.data.user?.savedPosts) {
          const savedMap = {};
          res.data.user.savedPosts.forEach((id) => {
            const key = typeof id === "object" ? id._id || id : id;
            savedMap[key] = true;
          });
          setSavedPosts(savedMap);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch profile", err);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });

    axios
      .get("http://localhost:3000/api/posts/my-posts", {
        withCredentials: true,
      })
      .then((res) => {
        setPosts(res.data.posts || []);
      })
      .catch((err) => {
        console.error("Failed to fetch own posts", err);
      });

    fetchSavedPosts();
    fetchChapters();
  };

  const fetchChapters = async () => {
    try {
      setIsLoadingChapters(true);
      const res = await axios.get("http://localhost:3000/api/chapters/me", {
        withCredentials: true,
      });
      setChapters(res.data.chapters || []);
    } catch (err) {
      console.error("Failed to fetch chapters", err);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      setIsLoadingSaved(true);
      const res = await axios.get("http://localhost:3000/api/posts/bookmarks", {
        withCredentials: true,
      });
      setSavedPostsList(res.data.posts || []);
      const savedMap = {};
      (res.data.posts || []).forEach((p) => {
        savedMap[p._id] = true;
      });
      setSavedPosts((prev) => ({ ...prev, ...savedMap }));
    } catch (err) {
      console.error("Failed to fetch bookmarks", err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPosts();
  }, []);

  const likePost = async (postId) => {
    try {
      pulse.like();
      const res = await axios.post(
        `http://localhost:3000/api/posts/${postId}/like`,
        {},
        { withCredentials: true },
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? res.data.post : p)),
      );
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(res.data.post);
      }
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  const sharePost = async (postId) => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/posts/${postId}/share`,
        {},
        { withCredentials: true },
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? res.data.post : p)),
      );
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(res.data.post);
      }
    } catch (err) {
      console.error("Failed to share post", err);
    }
  };

  const handleCommentChange = (postId, text) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const handleAddCommentEmoji = (postId, emoji) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: (prev[postId] || "") + emoji,
    }));
  };

  const submitComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    try {
      const res = await axios.post(
        `http://localhost:3000/api/posts/${postId}/comment`,
        { text },
        { withCredentials: true },
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? res.data.post : p)),
      );
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(res.data.post);
      }
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Failed to submit comment", err);
    }
  };

  const toggleCommentSection = (postId) => {
    setCommentSectionsOpen((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const savePost = async (postId) => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/posts/${postId}/bookmark`,
        {},
        { withCredentials: true }
      );
      setSavedPosts((prev) => ({
        ...prev,
        [postId]: res.data.isSaved,
      }));
      if (!res.data.isSaved) {
        setSavedPostsList((prev) => prev.filter((p) => p._id !== postId));
      } else {
        fetchSavedPosts();
      }
    } catch (err) {
      console.error("Failed to bookmark post", err);
    }
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
      setProfile((prev) =>
        prev ? { ...prev, postCount: Math.max(0, prev.postCount - 1) } : null,
      );
    } catch (err) {
      console.error("Failed to delete post", err);
      overlayCard.error("Failed to delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleTogglePin = async (postId) => {
    try {
      const res = await axios.put(
        `http://localhost:3000/api/posts/${postId}/pin`,
        {},
        { withCredentials: true },
      );

      const updatedPost = res.data.post;
      setPosts((prev) => {
        const next = prev.map((p) => (p._id === postId ? updatedPost : p));
        return next.sort(
          (a, b) =>
            (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
            new Date(b.createdAt) - new Date(a.createdAt),
        );
      });
    } catch (err) {
      console.error("Failed to toggle pin state", err);
      const message = err.response?.data?.message || "Failed to pin post";
      overlayCard.error(message);
    }
  };

  const openEditModal = (post) => {
    scrollToTop();
    setEditingPost(post);
    setEditCaption(post.caption || "");
    setEditImageFile(null);
    setEditImagePreview(post.image || null);
  };

  const closeEditModal = () => {
    setEditingPost(null);
    setEditCaption("");
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePostSubmit = async (e) => {
    e.preventDefault();
    if (!editingPost) return;

    setIsUpdatingPost(true);
    const formData = new FormData();
    formData.append("caption", editCaption);
    if (editImageFile) {
      formData.append("image", editImageFile);
    }

    try {
      const res = await axios.put(
        `http://localhost:3000/api/posts/${editingPost._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );

      const updatedPost = res.data.post;
      setPosts((prev) =>
        prev.map((p) => (p._id === editingPost._id ? updatedPost : p)),
      );
      closeEditModal();
    } catch (err) {
      console.error("Failed to update post", err);
      overlayCard.error("Failed to update post");
    } finally {
      setIsUpdatingPost(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

        <div className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          isCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
        }`}>
          {/* Top Navbar */}
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden text-slate-700 text-lg p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={toggleSidebar}
              >
                <i className="fa-solid fa-bars"></i>
              </button>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Profile</h2>
            </div>

            {/* Community Standing Badge in Navbar row with Profile */}
            <div className="flex items-center gap-2">
              <CommunityStandingBadge
                standing={profile?.communityStanding}
                trustScore={profile?.trustScore}
                onClick={() => setIsAccountSettingsOpen(true)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full p-3 sm:p-5">
            {/* Compact Modern Social Profile Header Card with Supporter Cabin Theme Accent */}
            <div className={`bg-white rounded-2xl shadow-xs border p-4 sm:p-6 transition-all ${
              profile?.cabinTheme === "gold"
                ? "border-amber-300 ring-2 ring-amber-400/25 shadow-amber-500/10 shadow-lg"
                : profile?.cabinTheme === "violet"
                ? "border-purple-300 ring-2 ring-purple-400/25 shadow-purple-500/10 shadow-lg"
                : profile?.cabinTheme === "cyan"
                ? "border-cyan-300 ring-2 ring-cyan-400/25 shadow-cyan-500/10 shadow-lg"
                : profile?.cabinTheme === "rose"
                ? "border-rose-300 ring-2 ring-rose-400/25 shadow-rose-500/10 shadow-lg"
                : profile?.cabinTheme === "emerald"
                ? "border-emerald-300 ring-2 ring-emerald-400/25 shadow-emerald-500/10 shadow-lg"
                : "border-slate-200/80"
            }`}>
              {/* Top Row: Avatar + Name/Handle + Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  {/* Avatar with Click Dropdown Menu (Authorized own profile only) */}
                  <div className="relative shrink-0" ref={avatarMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                      className="relative block rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 transition-transform active:scale-95 group cursor-pointer"
                      title="Click for photo options"
                    >
                      <img
                        src={profile ? profile.profilePhoto || Profile1 : Profile1}
                        alt="Profile Avatar"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-indigo-600/10 shadow-xs group-hover:brightness-95 transition-all"
                      />
                      <span
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs"
                        title="Active Now"
                      ></span>
                      <div className="absolute inset-0 rounded-full bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                        <i className="fa-solid fa-ellipsis"></i>
                      </div>
                    </button>

                    {/* Mini Dropdown on own profile */}
                    {isAvatarMenuOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-in fade-in zoom-in-95">
                        {profile?.profilePhoto && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAvatarMenuOpen(false);
                              downloadImage(profile.profilePhoto, `${profile.userName || "onboard"}-avatar.jpg`);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <i className="fa-solid fa-arrow-down-to-bracket text-slate-400 text-sm"></i>
                            <span>Download Avatar</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAvatarMenuOpen(false);
                            handleOpenEditProfile();
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-camera-rotate text-slate-400 text-sm"></i>
                          <span>Change Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAvatarMenuOpen(false);
                            setIsPhotoHistoryOpen(true);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-clock-rotate-left text-slate-400 text-sm"></i>
                          <span>Photo History</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Name, Handle, Vibe & Badges */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                        {profile?.name || (isLoadingProfile ? "Loading..." : "User Profile")}
                      </h1>
                      <MemberBadge tier={profile?.membershipTier} size="md" showLabel={true} />
                      {profile?.isOfficialVerified && (
                        <span
                          className="inline-flex items-center text-indigo-600 text-sm"
                          title="Official Verified Tick"
                        >
                          <i className="fa-solid fa-circle-check"></i>
                        </span>
                      )}
                    </div>

                    {/* Handle + Repositioned Responsive Vibe Status + VIP Flair */}
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
                        @{profile?.userName || (isLoadingProfile ? "loading..." : "username")}
                      </p>

                      {/* Vibe / Status pill - inline, clean and responsive */}
                      <button
                        type="button"
                        onClick={() => setIsEraModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-0.5 rounded-full transition-all cursor-pointer border border-indigo-200/60 shadow-2xs max-w-full"
                        title="Change vibe status"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse shrink-0"></span>
                        <span className="truncate max-w-[120px] sm:max-w-[200px]">{currentEra}</span>
                        <i className="fa-solid fa-pen text-[8px] text-indigo-500 shrink-0"></i>
                      </button>

                      {profile?.vipFlair && (
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full shadow-xs">
                          ✨ {profile.vipFlair}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Clean, decluttered */}
                <div className="flex items-center gap-2 shrink-0">
                  {isOwnProfile ? (
                    <>
                      {/* Single Unified Edit Profile Button */}
                      <button
                        type="button"
                        onClick={handleOpenEditProfile}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <i className="fa-solid fa-user-pen text-[10px]"></i>
                        <span>Edit Profile</span>
                      </button>

                      {/* Share Profile */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          overlayCard.success("Profile link copied to clipboard! 📋", { title: "Link Copied" });
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Share Profile Link"
                      >
                        <i className="fa-solid fa-share-nodes text-[11px] text-slate-500"></i>
                        <span>Share</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsFollowing(!isFollowing)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isFollowing ? "bg-slate-100 text-slate-800" : "bg-indigo-600 text-white shadow-xs"
                      }`}
                    >
                      {isFollowing ? "OnBoarded 🤝" : "Board Crew 🚀"}
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: Compact Bio & Badges */}
              <div className="pt-3">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {profile?.bio || "Content creator in the digital universe. Living life, one drop at a time ✨"}
                </p>

                {/* Optional Profile Badges (Pronouns, Gender, Birthday, Public Contact) */}
                {(profile?.pronouns || profile?.gender || profile?.dob || (profile?.showEmail && profile?.contactEmail) || (profile?.showPhone && profile?.contactPhone)) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-500">
                    {profile?.pronouns && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium text-slate-600">
                        <i className="fa-solid fa-sparkles text-indigo-500 text-[9px]"></i>
                        <span>{profile.pronouns}</span>
                      </span>
                    )}
                    {profile?.gender && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium text-slate-600 capitalize">
                        <i className="fa-solid fa-user text-slate-400 text-[9px]"></i>
                        <span>{profile.gender}</span>
                      </span>
                    )}
                    {profile?.dob && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-full font-medium">
                        <i className="fa-solid fa-cake-candles text-amber-600 text-[9px]"></i>
                        <span>{profile.dob}</span>
                      </span>
                    )}
                    {profile?.showEmail && profile?.contactEmail && (
                      <a
                        href={`mailto:${profile.contactEmail}`}
                        className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:underline px-2.5 py-0.5 rounded-full font-medium"
                      >
                        <i className="fa-solid fa-envelope text-[9px]"></i>
                        <span>{profile.contactEmail}</span>
                      </a>
                    )}
                    {profile?.showPhone && profile?.contactPhone && (
                      <a
                        href={`tel:${profile.contactPhone}`}
                        className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:underline px-2.5 py-0.5 rounded-full font-medium"
                      >
                        <i className="fa-solid fa-phone text-[9px]"></i>
                        <span>{profile.contactPhone}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Row: Ultra-Compact Social Stats Bar */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-around sm:justify-start sm:gap-8 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm">
                    {profile ? profile.postCount || posts.length : posts.length}
                  </span>
                  <span className="text-slate-500 text-[11px]">Posts</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCrewModalTab("crew");
                    setCrewModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors group text-left"
                  title="Click to view and manage your Crew"
                >
                  <span className="font-bold text-slate-900 group-hover:text-indigo-600 text-sm transition-colors">
                    {profile ? profile.friendsCount || 0 : 0}
                  </span>
                  <span className="text-slate-500 group-hover:text-indigo-600 text-[11px] transition-colors">Crew</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCrewModalTab("following");
                    setCrewModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors group text-left"
                  title="Click to view and manage who you are following"
                >
                  <span className="font-bold text-slate-900 group-hover:text-indigo-600 text-sm transition-colors">
                    {profile?.boards ? profile.boards.length : 0}
                  </span>
                  <span className="text-slate-500 group-hover:text-indigo-600 text-[11px] transition-colors">Following</span>
                </button>
                <div className="flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                  <span>🔥</span>
                  <span>{Math.max(1, (posts.length % 7) + 1)}d Streak</span>
                </div>
              </div>
            </div>

            {/* Promotional Card: Get Verified / Official Tick */}
            {!profile?.isOfficialVerified ? (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white p-4 sm:p-5 shadow-lg shadow-indigo-500/15 border border-indigo-400/30 transition-all hover:shadow-indigo-500/25">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
                      <i className="fa-solid fa-circle-check text-2xl text-blue-200"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                          Get OnBoard Official Blue Tick
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full shadow-xs">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-blue-100/90 mt-1 max-w-xl leading-relaxed">
                        Stand out with the authentic official checkmark beside your name, boost your crew discovery, and unlock creator trust across the network.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsVerifyModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-blue-50 text-indigo-700 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-certificate text-indigo-600"></i>
                      <span>Get Verified</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-purple-50/70 border border-indigo-100 p-3 flex items-center justify-between gap-3 text-xs text-slate-700 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                    <i className="fa-solid fa-circle-check"></i>
                  </span>
                  <div>
                    <span className="font-extrabold text-slate-900">
                      Official Verified Account Active
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      Your blue tick is active across profile, cabin feeds, replies, and crew search.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 hover:bg-indigo-100/70 transition-colors cursor-pointer shrink-0"
                >
                  View Status
                </button>
              </div>
            )}

            {/* Posts / Chapters / Saved Tabs Header */}
            <div className="flex justify-center border-t border-slate-200 -mt-px mb-4">
              <div className="flex items-center gap-4 sm:gap-10 text-xs font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setActiveProfileTab("posts")}
                  className={`py-4 flex items-center gap-2 border-t-2 -mt-px transition-all cursor-pointer ${
                    activeProfileTab === "posts"
                      ? "text-indigo-600 border-indigo-600 font-extrabold"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                >
                  <i className="fa-solid fa-table-cells text-sm"></i>
                  <span>POSTS ({posts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveProfileTab("chapters");
                    fetchChapters();
                  }}
                  className={`py-4 flex items-center gap-2 border-t-2 -mt-px transition-all cursor-pointer ${
                    activeProfileTab === "chapters"
                      ? "text-indigo-600 border-indigo-600 font-extrabold"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                >
                  <i className="fa-solid fa-book-bookmark text-sm"></i>
                  <span>CHAPTERS ({chapters.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveProfileTab("saved");
                    fetchSavedPosts();
                  }}
                  className={`py-4 flex items-center gap-2 border-t-2 -mt-px transition-all cursor-pointer ${
                    activeProfileTab === "saved"
                      ? "text-indigo-600 border-indigo-600 font-extrabold"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                >
                  <i className="fa-solid fa-bookmark text-sm"></i>
                  <span>SAVED ({savedPostsList.length})</span>
                </button>
              </div>
            </div>

            {/* 3-Column Post Grid */}
            <div className="w-full">
              {activeProfileTab === "posts" ? (
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <div
                        key={post._id}
                        className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer group rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
                        onClick={() => {
                          scrollToTop();
                          setSelectedPost(post);
                        }}
                      >
                        {post.image ? (
                          <img
                            src={post.image}
                            alt="Post"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-slate-700 bg-white">
                            <p className="line-clamp-3 font-medium">{post.caption}</p>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs sm:text-sm">
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-heart"></i> {post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-comment"></i> {post.comments?.length || 0}
                          </span>
                        </div>

                        {post.pinned && (
                          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white p-1.5 rounded-full text-xs z-10 shadow-sm">
                            <i className="fa-solid fa-thumbtack"></i>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100">
                      <i className="fa-regular fa-folder-open text-4xl mb-2 text-slate-300 block"></i>
                      <h3 className="text-sm font-bold text-slate-700">No posts uploaded yet</h3>
                      <p className="text-xs text-slate-400 mt-1">Start sharing moments with your crew!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                  {isLoadingSaved ? (
                    <div className="col-span-3 text-center py-12 text-slate-400">
                      <i className="fa-solid fa-spinner fa-spin text-2xl text-indigo-600 mb-2"></i>
                      <p className="text-xs font-semibold">Loading your saved collection...</p>
                    </div>
                  ) : savedPostsList.length > 0 ? (
                    savedPostsList.map((post) => (
                      <div
                        key={post._id}
                        className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer group rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
                        onClick={() => {
                          scrollToTop();
                          setSelectedPost(post);
                        }}
                      >
                        {post.image ? (
                          <img
                            src={post.image}
                            alt="Saved post"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-slate-700 bg-white">
                            <p className="line-clamp-3 font-medium">{post.caption}</p>
                          </div>
                        )}

                        {/* Ribbon indicator */}
                        <div className="absolute top-2.5 right-2.5 bg-indigo-600/90 backdrop-blur-xs text-white p-1.5 rounded-full text-xs z-10 shadow-sm">
                          <i className="fa-solid fa-bookmark text-[10px]"></i>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs sm:text-sm">
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-heart"></i> {post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-comment"></i> {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100">
                      <i className="fa-regular fa-bookmark text-4xl mb-2 text-indigo-400 block"></i>
                      <h3 className="text-sm font-bold text-slate-700">No Saved Bookmarks Yet</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Tap the bookmark icon on any post in your feed to save it to your private collection.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Chapters Tab Grid */}
              {activeProfileTab === "chapters" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Create New Chapter Action Card */}
                  <div
                    onClick={() => {
                      setEditingChapter(null);
                      setIsCreateChapterOpen(true);
                    }}
                    className="min-h-[220px] rounded-3xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group shadow-xs hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg mb-3 shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-plus"></i>
                    </div>
                    <h4 className="text-sm font-black text-indigo-950">Add New Chapter</h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                      Capture an era: college, a trip, a project, or a milestone.
                    </p>
                  </div>

                  {/* Chapter Cards List */}
                  {chapters.map((chap) => (
                    <div
                      key={chap._id}
                      onClick={() => setSelectedChapter(chap)}
                      className="group relative min-h-[220px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-end p-5"
                    >
                      {/* Background Cover */}
                      {chap.coverImage ? (
                        <img
                          src={chap.coverImage}
                          alt={chap.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-900 opacity-90"></div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                        <span className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center justify-center text-lg shadow-sm">
                          {chap.emoji || "📖"}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-black/40 backdrop-blur-md text-white rounded-full border border-white/20">
                          {chap.posts?.length || 0} Photos
                        </span>
                      </div>

                      {/* Bottom Info Gradient */}
                      <div className="relative z-10">
                        {chap.timeframe && (
                          <span className="inline-block text-[10px] font-bold text-indigo-200 mb-1">
                            🗓️ {chap.timeframe}
                          </span>
                        )}
                        <h4 className="text-base font-extrabold text-white leading-tight drop-shadow-sm group-hover:text-indigo-200 transition-colors">
                          {chap.title}
                        </h4>
                        {chap.description && (
                          <p className="text-xs text-slate-300 line-clamp-1 mt-0.5 font-normal">
                            {chap.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lightbox Modal */}
        {selectedPost && (
          <div
            className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-[9999] animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && setSelectedPost(null)}
          >
            <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPost.profile?.profilePhoto || Profile1}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      {selectedPost.profile?.userName || "Anonymous"}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      {selectedPost.pinned ? (
                        <span className="text-indigo-600 font-bold inline-flex items-center gap-1">
                          <i className="fa-solid fa-thumbtack text-[10px]"></i> Pinned
                        </span>
                      ) : (
                        "User"
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className={`w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer transition-all ${
                      selectedPost.pinned
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    title={selectedPost.pinned ? "Unpin Post" : "Pin Post"}
                    onClick={() => handleTogglePin(selectedPost._id)}
                  >
                    <i className="fa-solid fa-thumbtack text-xs"></i>
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                    title="Edit Post"
                    onClick={() => {
                      setSelectedPost(null);
                      openEditModal(selectedPost);
                    }}
                  >
                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Delete Post"
                    onClick={() => {
                      setSelectedPost(null);
                      setPostToDelete(selectedPost._id);
                    }}
                  >
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer ml-1"
                    onClick={() => setSelectedPost(null)}
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {selectedPost.image && (
                  <div className="flex justify-center items-center bg-slate-900 rounded-2xl overflow-hidden max-h-[420px]">
                    <img
                      src={selectedPost.image}
                      alt="Post Media"
                      className="max-w-full max-h-[420px] object-contain"
                    />
                  </div>
                )}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {selectedPost.caption}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center py-3.5 px-6 border-t border-slate-100 text-xs font-semibold text-slate-600 shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 hover:text-rose-500 cursor-pointer"
                    onClick={() => likePost(selectedPost._id)}
                  >
                    <i
                      className={
                        selectedPost.likes?.includes(profile?.user || profile?._id)
                          ? "fa-solid fa-heart text-rose-500 text-base"
                          : "fa-regular fa-heart text-base"
                      }
                    ></i>
                    <span>{selectedPost.likes?.length || 0}</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer"
                    onClick={() => toggleCommentSection(selectedPost._id)}
                  >
                    <i className="fa-regular fa-comment text-base"></i>
                    <span>{selectedPost.comments?.length || 0}</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer"
                    onClick={() => {
                      setShareTargetPost(selectedPost);
                      setIsShareModalOpen(true);
                    }}
                    title="Share Post"
                  >
                    <i className="fa-solid fa-share text-base"></i>
                    <span>{selectedPost.shares?.length || 0}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {selectedPost.image && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer text-slate-600 text-xs sm:text-sm font-semibold"
                      onClick={() => downloadImage(selectedPost.image, `onboard-post-${selectedPost._id}.jpg`)}
                      title="Download Photo to Device"
                    >
                      <i className="fa-solid fa-arrow-down-to-bracket text-base"></i>
                      <span>Download</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer text-xs sm:text-sm font-semibold"
                    onClick={() => savePost(selectedPost._id)}
                    title={savedPosts[selectedPost._id] ? "Saved to your bookmarks" : "Save to bookmarks"}
                  >
                    <i
                      className={
                        savedPosts[selectedPost._id]
                          ? "fa-solid fa-bookmark text-indigo-600 text-base"
                          : "fa-regular fa-bookmark text-base text-slate-500"
                      }
                    ></i>
                    <span className={savedPosts[selectedPost._id] ? "text-indigo-600 font-bold" : "text-slate-600"}>
                      {savedPosts[selectedPost._id] ? "Saved" : "Save"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {commentSectionsOpen[selectedPost._id] && (
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
                  {selectedPost.comments && selectedPost.comments.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {selectedPost.comments.map((c, i) => (
                        <div key={i} className="bg-white p-2 rounded-xl border border-slate-100">
                          <strong className="text-slate-900 font-bold">{c.profile?.userName || "User"}</strong>:{" "}
                          <span className="text-slate-600">{c.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">React:</span>
                    {["❤️", "🔥", "💀", "🫡", "⚡", "😭"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:scale-110 flex items-center justify-center text-xs transition-all cursor-pointer"
                        onClick={() => handleAddCommentEmoji(selectedPost._id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write your comment..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-600"
                      value={commentInputs[selectedPost._id] || ""}
                      onChange={(e) => handleCommentChange(selectedPost._id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitComment(selectedPost._id);
                      }}
                    />
                    <button
                      type="button"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      onClick={() => submitComment(selectedPost._id)}
                    >
                      <i className="fa-regular fa-paper-plane text-xs"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={!!postToDelete}
          onClose={() => setPostToDelete(null)}
          onConfirm={confirmDeletePost}
          isDeleting={isDeletingPost}
        />

        {/* Edit Post Modal overlay */}
        {editingPost && (
          <div
            className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-[9999] animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && closeEditModal()}
          >
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center py-4 px-6 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Edit Post</h2>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={closeEditModal}
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark text-base"></i>
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleUpdatePostSubmit}>
                  <div
                    className="cursor-pointer relative overflow-hidden min-h-[180px] bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl mb-4 hover:border-indigo-500 transition-all group"
                    onClick={() => document.getElementById("edit-file-upload").click()}
                  >
                    {editImagePreview ? (
                      <div className="w-full h-full relative flex justify-center items-center">
                        <img
                          src={editImagePreview}
                          alt="New Preview"
                          className="max-w-full max-h-[260px] object-contain block"
                        />
                        <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center gap-1.5 opacity-0 transition-opacity font-semibold text-xs group-hover:opacity-100">
                          <i className="fa-solid fa-camera text-xl"></i>
                          <span>Change Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <i className="fa-regular fa-image text-3xl"></i>
                        <p className="text-xs font-semibold">Upload a photo</p>
                      </div>
                    )}
                    <input
                      type="file"
                      id="edit-file-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>

                  <textarea
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Update the caption for your post..."
                    required
                    rows={3}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 mb-4 bg-slate-50/50"
                  />

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs"
                      onClick={closeEditModal}
                      disabled={isUpdatingPost}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl font-semibold cursor-pointer transition-all bg-indigo-600 text-white flex items-center gap-1.5 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 text-xs disabled:opacity-50"
                      disabled={isUpdatingPost}
                    >
                      {isUpdatingPost ? "Saving..." : <><i className="fa-solid fa-save text-[11px]"></i> Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isUpdatingPost && (
          <div className="fixed inset-0 bg-white/70 backdrop-blur-md z-[9999] flex flex-col justify-center items-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            <h2 className="text-lg text-slate-900 font-bold tracking-tight">Updating post...</h2>
          </div>
        )}

        {/* Era Selection Modal */}
        {isEraModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" 
            onClick={() => setIsEraModalOpen(false)}
          >
            <div 
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">Set Your Current Era</h3>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setIsEraModalOpen(false)}
                >
                  <i className="fa-solid fa-xmark text-base"></i>
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Choose a vibe or write your own daily status for your boarding pass.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {ERA_PRESETS.map((p) => {
                  const label = `${p.emoji} ${p.text}`;
                  const isSelected = currentEra === label;
                  return (
                    <button
                      key={p.text}
                      type="button"
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs"
                          : "bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-white hover:border-indigo-300"
                      }`}
                      onClick={() => {
                        setCurrentEra(label);
                        localStorage.setItem("onboard_current_era", label);
                        setIsEraModalOpen(false);
                      }}
                    >
                      <span className="text-lg">{p.emoji}</span>
                      <span className="truncate">{p.text}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mb-5">
                <input
                  type="text"
                  placeholder="Or write custom status (e.g. 🎧 Deep Focus)..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                  value={customEraInput}
                  onChange={(e) => setCustomEraInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customEraInput.trim()) {
                      const newEra = customEraInput.trim();
                      setCurrentEra(newEra);
                      localStorage.setItem("onboard_current_era", newEra);
                      setCustomEraInput("");
                      setIsEraModalOpen(false);
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  onClick={() => setIsEraModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                  onClick={() => {
                    if (customEraInput.trim()) {
                      const newEra = customEraInput.trim();
                      setCurrentEra(newEra);
                      localStorage.setItem("onboard_current_era", newEra);
                      setCustomEraInput("");
                      setIsEraModalOpen(false);
                    }
                  }}
                  disabled={!customEraInput.trim()}
                >
                  Save Vibe
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── UNIFIED EDIT PROFILE MODAL ── */}
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                    <i className="fa-solid fa-user-pen"></i>
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">Edit Profile</h3>
                    <p className="text-[11px] text-slate-500">Update your account details and identity</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Modal Form Scrollable Body */}
              <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* 1. Avatar & Photo History */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="relative group/avatar shrink-0">
                    <img
                      src={newAvatarPreview || profile?.profilePhoto || Profile1}
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md bg-white"
                    />
                    <label
                      htmlFor="avatar-upload-input"
                      className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-[10px] font-semibold"
                    >
                      <i className="fa-solid fa-camera text-sm mb-0.5"></i>
                      <span>Change</span>
                    </label>
                    <input
                      id="avatar-upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Profile Photo</p>
                      <p className="text-[11px] text-slate-500">Recommended square photo (JPG, PNG)</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label
                        htmlFor="avatar-upload-input"
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                      >
                        <i className="fa-solid fa-upload text-[10px] mr-1"></i> Upload Photo
                      </label>

                      {/* Photo History Button */}
                      <button
                        type="button"
                        onClick={() => setIsPhotoHistoryOpen(true)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                        title="View your previous profile pictures with date ranges"
                      >
                        <i className="fa-solid fa-clock-rotate-left text-[10px]"></i>
                        <span>Photo History ({profile?.photoHistory?.length || 1})</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Name Row (First Name & Last Name) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="e.g. Digvijay"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="e.g. Singh"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                    />
                  </div>
                </div>

                {/* 3. Username with Live Auto-Availability Check */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Username</label>
                    {isCheckingUsername && (
                      <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1.5 animate-pulse">
                        <span className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        Checking availability...
                      </span>
                    )}
                    {!isCheckingUsername && usernameStatus && (
                      <span
                        className={`text-[10px] font-bold flex items-center gap-1 transition-all ${
                          usernameStatus.available ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        <i className={`fa-solid ${usernameStatus.available ? "fa-check" : "fa-xmark"}`}></i>
                        {usernameStatus.message}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold pointer-events-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={editUserName}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="username"
                      className={`w-full pl-8 pr-10 py-2 bg-slate-50 border rounded-xl text-xs outline-none focus:bg-white text-slate-900 transition-all ${
                        usernameStatus && !usernameStatus.available
                          ? "border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/10"
                          : usernameStatus && usernameStatus.available
                          ? "border-emerald-400 focus:border-emerald-500 ring-2 ring-emerald-500/10"
                          : isCheckingUsername
                          ? "border-indigo-400 focus:border-indigo-500 ring-2 ring-indigo-500/10"
                          : "border-slate-200 focus:border-indigo-600"
                      }`}
                    />
                    {/* Live Auto-Availability Status Icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {isCheckingUsername ? (
                        <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                      ) : usernameStatus?.available ? (
                        <i className="fa-solid fa-circle-check text-emerald-500 text-sm"></i>
                      ) : usernameStatus && !usernameStatus.available ? (
                        <i className="fa-solid fa-circle-xmark text-rose-500 text-sm"></i>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Unique handle for your profile URL and mentions.</p>
                </div>

                {/* 4. Bio */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Bio</label>
                    <span className="text-[10px] text-slate-400">{editBio.length}/150</span>
                  </div>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                    placeholder="Tell your crew a little about yourself, hobbies, or what you're creating..."
                    rows={2}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900 resize-none"
                  />
                </div>

                {/* 5. Gender & Pronouns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 text-slate-900 cursor-pointer"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-Binary</option>
                      <option value="custom">Other / Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pronouns</label>
                    <select
                      value={
                        isCustomPronouns
                          ? "custom"
                          : ["", "he/him", "she/her", "they/them", "he/they", "she/they", "any pronouns"].includes(editPronouns)
                          ? editPronouns
                          : "custom"
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setIsCustomPronouns(true);
                          if (["", "he/him", "she/her", "they/them", "he/they", "she/they", "any pronouns"].includes(editPronouns)) {
                            setEditPronouns("");
                          }
                        } else {
                          setIsCustomPronouns(false);
                          setEditPronouns(val);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 text-slate-900 cursor-pointer"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="he/him">he/him</option>
                      <option value="she/her">she/her</option>
                      <option value="they/them">they/them</option>
                      <option value="he/they">he/they</option>
                      <option value="she/they">she/they</option>
                      <option value="any pronouns">any pronouns</option>
                      <option value="custom">Other / Custom...</option>
                    </select>
                    {isCustomPronouns && (
                      <input
                        type="text"
                        value={editPronouns}
                        onChange={(e) => setEditPronouns(e.target.value)}
                        placeholder="Enter custom pronouns (e.g. ze/zir)"
                        className="w-full mt-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                {/* 6. Birthday & 3-Hour Crew Reminder */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <i className="fa-solid fa-cake-candles text-amber-600"></i>
                      <span>Birthday</span>
                    </label>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      🎉 Crew Alert Feature
                    </span>
                  </div>

                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                  />

                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    ✨ Your boarded crew members will automatically receive a celebration alert <strong>3 hours before</strong> your birthday so they can send you their warmest wishes!
                  </p>

                  <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isTestingBirthday}
                      onClick={handleTriggerBirthdayAlert}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {isTestingBirthday ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <i className="fa-solid fa-bell text-[10px]"></i>
                      )}
                      <span>Test Birthday Alert to Crew</span>
                    </button>
                    {birthdayAlertMessage && (
                      <span className="text-[11px] font-semibold text-emerald-700 animate-fade-in">
                        {birthdayAlertMessage}
                      </span>
                    )}
                  </div>
                </div>

                {/* 7. Account Privacy (Public vs Private Cabin) */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-xs ${
                        editIsPrivate ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}>
                        <i className={`fa-solid ${editIsPrivate ? "fa-lock" : "fa-globe"}`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800">Account Privacy</label>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            editIsPrivate ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            {editIsPrivate ? "Private Cabin" : "Public Cabin"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {editIsPrivate
                            ? "Only approved crew members can view your posts and boarding updates."
                            : "Anyone on OnBoard can view your posts and explore your cabin."}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={editIsPrivate}
                      onClick={() => setEditIsPrivate(!editIsPrivate)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        editIsPrivate ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      title={editIsPrivate ? "Switch to Public" : "Switch to Private"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          editIsPrivate ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* 8. Contact Information & Privacy Toggles */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <i className="fa-solid fa-address-book text-indigo-600"></i>
                    <span>Contact Information (Optional)</span>
                  </p>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">Email Address</label>
                    <input
                      type="email"
                      value={editContactEmail}
                      onChange={(e) => setEditContactEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 text-slate-900"
                    />
                    <label className="flex items-center gap-2 pt-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editShowEmail}
                        onChange={(e) => setEditShowEmail(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="text-[11px] text-slate-600">Show email on my public profile</span>
                    </label>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600">Phone Number</label>
                    <input
                      type="tel"
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 text-slate-900"
                    />
                    <label className="flex items-center gap-2 pt-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editShowPhone}
                        onChange={(e) => setEditShowPhone(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="text-[11px] text-slate-600">Show phone number on my public profile</span>
                    </label>
                  </div>
                </div>

                {/* Form Footer Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk text-[11px]"></i>
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── PROFILE PHOTO HISTORY MODAL (PRIVATE TO USER) ── */}
        {isPhotoHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">Profile Photo History</h3>
                    <p className="text-[11px] text-slate-500">🔒 Only you can view your photo timeline</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoHistoryOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Photos Timeline List */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {profile?.photoHistory && profile.photoHistory.length > 0 ? (
                  profile.photoHistory
                    .slice()
                    .reverse()
                    .map((item, idx) => {
                      const isCurrent = !item.endedAt;
                      const startDate = item.startedAt
                        ? new Date(item.startedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Earlier";
                      const endDate = item.endedAt
                        ? new Date(item.endedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Present";

                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
                            isCurrent
                              ? "bg-indigo-50/60 border-indigo-200 shadow-xs"
                              : "bg-slate-50/70 border-slate-200 hover:bg-white"
                          }`}
                        >
                          <img
                            src={item.url || Profile1}
                            alt="Historical Avatar"
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-xs shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <i className="fa-solid fa-circle text-[6px]"></i> Currently Active
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                  Past Avatar
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-800 mt-1">
                              {startDate} – {endDate}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {isCurrent ? "Your live picture visible to the community" : "Archived profile picture"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <i className="fa-regular fa-image text-3xl mb-2 text-slate-300"></i>
                    <p className="text-xs">No previous profile photos recorded yet.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPhotoHistoryOpen(false)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Privacy Confirmation Overlay Modal */}
        {isPrivacyModalOpen && (
          <div
            className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 z-[9999] animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isTogglingPrivacy) {
                setIsPrivacyModalOpen(false);
              }
            }}
          >
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              {/* Modal Visual Header */}
              <div className="p-6 text-center">
                <div
                  className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-4 ${
                    profile?.isPrivate
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs"
                      : "bg-amber-50 text-amber-600 border border-amber-100 shadow-xs"
                  }`}
                >
                  <i className={profile?.isPrivate ? "fa-solid fa-globe" : "fa-solid fa-lock"}></i>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                  {profile?.isPrivate ? "Switch to Public Account?" : "Switch to Private Account?"}
                </h3>

                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {profile?.isPrivate
                    ? "Anyone on OnBoard will be able to see your shared posts, photos, and onboard directly with you."
                    : "Only approved crew members will be able to see your posts and photo gallery."}
                </p>

                {/* Explanatory Info Card */}
                <div className="mt-4 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-left text-xs text-slate-600 space-y-2.5">
                  {profile?.isPrivate ? (
                    <>
                      <div className="flex items-start gap-2.5">
                        <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5 text-[11px] shrink-0"></i>
                        <span>Your photos and posts will be visible to everyone on Explore.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5 text-[11px] shrink-0"></i>
                        <span>New members can board directly without waiting for approval.</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5">
                        <i className="fa-solid fa-shield-halved text-amber-600 mt-0.5 text-[11px] shrink-0"></i>
                        <span>Your photos and posts will be hidden from non-crew members.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <i className="fa-solid fa-user-check text-indigo-600 mt-0.5 text-[11px] shrink-0"></i>
                        <span>New connections must send a boarding request that you approve.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <i className="fa-solid fa-id-card text-slate-400 mt-0.5 text-[11px] shrink-0"></i>
                        <span>Your name, username, bio, and profile photo remain visible.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isTogglingPrivacy}
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isTogglingPrivacy}
                  onClick={handleConfirmTogglePrivacy}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    profile?.isPrivate
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {isTogglingPrivacy ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Updating...</span>
                    </>
                  ) : profile?.isPrivate ? (
                    <>
                      <i className="fa-solid fa-globe text-[11px]"></i>
                      <span>Yes, Make Public</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-lock text-[11px]"></i>
                      <span>Yes, Make Private</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Privacy Toast Feedback */}
        {privacyToast && (
          <div className="fixed bottom-6 right-6 z-[10000] animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm">
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold ${
                privacyToast.type === "success"
                  ? "bg-slate-900 text-white border-slate-800"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <i
                className={`text-sm shrink-0 ${
                  privacyToast.type === "success"
                    ? "fa-solid fa-circle-check text-emerald-400"
                    : "fa-solid fa-triangle-exclamation text-rose-500"
                }`}
              ></i>
              <span className="leading-snug">{privacyToast.message}</span>
              <button
                type="button"
                onClick={() => setPrivacyToast(null)}
                className="ml-auto text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
              >
                <i className="fa-solid fa-xmark text-[11px]"></i>
              </button>
            </div>
          </div>
        )}
        {/* Photo Cropper Modal for Avatar Editing */}
        {/* Photo Cropper Modal for Avatar Editing */}
        <PhotoCropperModal
          isOpen={isAvatarCropOpen}
          imageSrc={rawAvatarForCrop}
          onClose={() => setIsAvatarCropOpen(false)}
          onCropComplete={handleAvatarCropComplete}
          initialAspect={1}
          lockAspect={true}
          circularCrop={true}
          title="Crop Profile Picture"
        />

        {/* Unified Account Settings, Community Safety & Supporter Badges Hub */}
        <AccountSettingsModal
          isOpen={isAccountSettingsOpen}
          onClose={() => setIsAccountSettingsOpen(false)}
          currentUser={profile}
          onProfileUpdate={(updates) => setProfile((prev) => ({ ...prev, ...updates }))}
          onOpenVerification={() => setIsVerifyModalOpen(true)}
        />

        {/* Official Blue Tick Verification Modal */}
        <OfficialTickModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          currentUser={profile}
          onVerificationSuccess={(verifiedData) =>
            setProfile((prev) => ({
              ...prev,
              isOfficialVerified: true,
              officialVerifiedAt: verifiedData.officialVerifiedAt,
            }))
          }
        />

        {/* Crew & Following Overlay Modal */}
        <CrewFollowingModal
          isOpen={crewModalOpen}
          onClose={() => setCrewModalOpen(false)}
          initialTab={crewModalTab}
          targetIdentifier="me"
          isOwnProfile={true}
          onCountChange={() => {
            // Re-fetch profile to refresh counts
            axios
              .get("http://localhost:3000/api/profile/get-me", { withCredentials: true })
              .then((res) => {
                if (res.data.profile) setProfile(res.data.profile);
              })
              .catch(() => {});
          }}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareTargetPost(null);
          }}
          post={shareTargetPost}
          onShareSuccess={(postId) => {
            sharePost(postId);
          }}
        />

        {/* Create / Edit Chapter Modal */}
        <CreateChapterModal
          isOpen={isCreateChapterOpen}
          onClose={() => {
            setIsCreateChapterOpen(false);
            setEditingChapter(null);
          }}
          userPosts={posts}
          initialChapter={editingChapter}
          onChapterCreated={(newChap) => {
            fetchChapters();
            if (selectedChapter && selectedChapter._id === newChap._id) {
              setSelectedChapter(newChap);
            }
          }}
        />

        {/* Chapter Detail / Photo Album Modal */}
        <ChapterDetailModal
          isOpen={!!selectedChapter}
          chapter={selectedChapter}
          isOwner={true}
          onClose={() => setSelectedChapter(null)}
          userPosts={posts}
          onSelectPost={(post) => {
            setSelectedChapter(null);
            setSelectedPost(post);
          }}
          onEditChapter={(chap) => {
            setSelectedChapter(null);
            setEditingChapter(chap);
            setIsCreateChapterOpen(true);
          }}
          onChapterDeleted={(chapId) => {
            setChapters((prev) => prev.filter((c) => c._id !== chapId));
            setSelectedChapter(null);
          }}
          onChapterUpdated={(updatedChap) => {
            setSelectedChapter(updatedChap);
            setChapters((prev) =>
              prev.map((c) => (c._id === updatedChap._id ? updatedChap : c))
            );
          }}
        />
      </div>
    </>
  );
};

export default MyProfile;
