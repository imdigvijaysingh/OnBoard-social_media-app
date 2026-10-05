import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MemberBadge from "./MemberBadge";
import CommunityStandingBadge from "./CommunityStandingBadge";
import ReportModal from "./ReportModal";
import pulse from "../utils/pulseEngine";

const CABIN_THEMES = [
  { id: "default", name: "Classic Indigo", bg: "bg-indigo-600", border: "border-indigo-600", text: "text-indigo-600" },
  { id: "gold", name: "Royal Gold", bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-500" },
  { id: "violet", name: "Cosmic Violet", bg: "bg-purple-600", border: "border-purple-600", text: "text-purple-600" },
  { id: "cyan", name: "Cyan Diamond", bg: "bg-cyan-500", border: "border-cyan-500", text: "text-cyan-500" },
  { id: "rose", name: "Rose Quartz", bg: "bg-rose-500", border: "border-rose-500", text: "text-rose-500" },
  { id: "emerald", name: "Midnight Emerald", bg: "bg-emerald-600", border: "border-emerald-600", text: "text-emerald-600" },
];

const MEMBERSHIP_TIERS = [
  {
    id: "standard",
    name: "Passenger",
    price: "Free",
    period: "Forever",
    icon: "fa-solid fa-passport",
    color: "from-slate-700 to-slate-900",
    badgeTier: "standard",
    perks: [
      "Standard feed browsing & boarding",
      "Direct & group cabin messaging",
      "Standard profile photo history",
    ],
  },
  {
    id: "creator_pro",
    name: "Creator Pro",
    price: "$4.99",
    period: "/ month",
    icon: "fa-solid fa-rocket",
    color: "from-indigo-600 via-purple-600 to-pink-500",
    badgeTier: "creator_pro",
    popular: true,
    perks: [
      "🚀 Electric Creator Pro badge next to username",
      "Pinned posts (up to 3 pinned cards)",
      "Custom VIP bio flair text",
      "Priority message delivery & double-tap reach",
    ],
  },
  {
    id: "gold_vip",
    name: "Gold VIP",
    price: "$9.99",
    period: "/ month",
    icon: "fa-solid fa-crown",
    color: "from-amber-400 via-yellow-400 to-amber-600",
    badgeTier: "gold_vip",
    perks: [
      "👑 Shimmering Gold VIP badge next to username",
      "Royal Gold profile card glow & themes",
      "Unlimited pinned posts on profile",
      "Exclusive Gold supporter flair in chat cabins",
    ],
  },
  {
    id: "diamond",
    name: "First Class",
    price: "$19.99",
    period: "/ month",
    icon: "fa-solid fa-gem",
    color: "from-cyan-400 via-sky-300 to-blue-600",
    badgeTier: "diamond",
    perks: [
      "💎 Radiant First Class diamond badge with sparkling glow",
      "Access to all 6 custom cabin theme accents",
      "Elite VIP profile flair & verified status",
      "Early beta access to next-gen cabin features",
    ],
  },
];

const AccountSettingsModal = ({
  isOpen,
  onClose,
  initialTab = "account",
  currentUser = null,
  onProfileUpdate = null,
  onOpenSecurityAudit = null,
  onOpenVerification = null,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Email form state
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [pulseSoundActive, setPulseSoundActive] = useState(() => pulse.isSoundActive());
  const [pulseHapticActive, setPulseHapticActive] = useState(() => pulse.isHapticActive());

  // Delete account state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isWipingData, setIsWipingData] = useState(false);

  // Safety status state
  const [safetyStatus, setSafetyStatus] = useState({
    standing: "good_standing",
    trustScore: 100,
    safetyBadges: ["Verified Crew", "Anti-Spam Guardian", "Clean Record"],
    blockedCount: 0,
    activeAlerts: [],
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Membership & Perks state
  const [selectedTier, setSelectedTier] = useState("standard");
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [vipFlair, setVipFlair] = useState("");
  const [isSavingMembership, setIsSavingMembership] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null);

  // Google & Cloud Photo Backup state
  const [cloudBackupEnabled, setCloudBackupEnabled] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isUpdatingBackup, setIsUpdatingBackup] = useState(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCurrentEmail(currentUser?.contactEmail || currentUser?.email || "");
      setSelectedTier(currentUser?.membershipTier || "standard");
      setSelectedTheme(currentUser?.cabinTheme || "default");
      setVipFlair(currentUser?.vipFlair || "");
      setIsGoogleConnected(
        currentUser?.authProvider === "google" || Boolean(currentUser?.googleId)
      );
      if (currentUser?.cloudBackupEnabled !== undefined) {
        setCloudBackupEnabled(currentUser.cloudBackupEnabled);
      }
      fetchCloudBackupStatus();
      fetchSafetyData();
      fetchBlockedUsers();
    }
  }, [isOpen, initialTab, currentUser]);

  const fetchCloudBackupStatus = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/auth/cloud-backup", {
        withCredentials: true,
      });
      if (res.data) {
        setCloudBackupEnabled(res.data.cloudBackupEnabled ?? true);
        setIsGoogleConnected(
          res.data.googleConnected || currentUser?.authProvider === "google"
        );
      }
    } catch (err) {
      console.warn("Could not fetch cloud backup status:", err);
    }
  };

  const handleToggleCloudBackup = async () => {
    try {
      setIsUpdatingBackup(true);
      const nextVal = !cloudBackupEnabled;
      const res = await axios.put(
        "http://localhost:3000/api/auth/cloud-backup",
        { enabled: nextVal },
        { withCredentials: true }
      );
      setCloudBackupEnabled(res.data.cloudBackupEnabled);
      setBackupStatusMessage(
        res.data.cloudBackupEnabled
          ? "Cloud photo backup enabled! Your photos are automatically backed up."
          : "Cloud photo backup paused."
      );
      setTimeout(() => setBackupStatusMessage(""), 4000);
    } catch (err) {
      console.error("Failed to toggle cloud backup:", err);
    } finally {
      setIsUpdatingBackup(false);
    }
  };

  const fetchSafetyData = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/safety/status", {
        withCredentials: true,
      });
      setSafetyStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch safety status:", err);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      setIsLoadingBlocked(true);
      const res = await axios.get("http://localhost:3000/api/safety/blocked", {
        withCredentials: true,
      });
      setBlockedUsers(res.data.blockedUsers || []);
    } catch (err) {
      console.error("Failed to fetch blocked users:", err);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || !emailPassword) {
      setEmailStatus({ success: false, message: "Please enter your new email and current password." });
      return;
    }

    try {
      setIsUpdatingEmail(true);
      setEmailStatus(null);

      const res = await axios.put(
        "http://localhost:3000/api/account/email",
        { newEmail, currentPassword: emailPassword },
        { withCredentials: true }
      );

      setCurrentEmail(res.data.email);
      setNewEmail("");
      setEmailPassword("");
      setEmailStatus({ success: true, message: res.data.message });

      if (onProfileUpdate) {
        onProfileUpdate({ contactEmail: res.data.email, email: res.data.email });
      }
    } catch (err) {
      console.error("Update email error:", err);
      setEmailStatus({
        success: false,
        message: err.response?.data?.message || "Failed to update email address.",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ success: false, message: "Please fill in all password fields." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ success: false, message: "New password must be at least 6 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: "New passwords do not match." });
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordStatus(null);

      const res = await axios.put(
        "http://localhost:3000/api/account/password",
        { currentPassword, newPassword },
        { withCredentials: true }
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus({ success: true, message: res.data.message });
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordStatus({
        success: false,
        message: err.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/safety/unblock/${userId}`,
        {},
        { withCredentials: true }
      );
      setBlockedUsers((prev) => prev.filter((u) => u.userId !== userId));
      fetchSafetyData();
    } catch (err) {
      console.error("Unblock user error:", err);
    }
  };

  const handleSaveMembership = async () => {
    try {
      setIsSavingMembership(true);
      setMembershipStatus(null);

      const res = await axios.put(
        "http://localhost:3000/api/profile/membership",
        {
          membershipTier: selectedTier,
          cabinTheme: selectedTheme,
          vipFlair,
        },
        { withCredentials: true }
      );

      setMembershipStatus({ success: true, message: res.data.message });

      if (onProfileUpdate) {
        onProfileUpdate({
          membershipTier: res.data.membershipTier,
          cabinTheme: res.data.cabinTheme,
          vipFlair: res.data.vipFlair,
        });
      }

      setTimeout(() => setMembershipStatus(null), 3500);
    } catch (err) {
      console.error("Save membership error:", err);
      setMembershipStatus({
        success: false,
        message: err.response?.data?.message || "Failed to update membership.",
      });
    } finally {
      setIsSavingMembership(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") {
      setDeleteError("You must type 'DELETE' exactly.");
      return;
    }
    if (!deletePassword) {
      setDeleteError("Please enter your current password to authorize deletion.");
      return;
    }

    try {
      setIsDeletingAccount(true);
      setDeleteError("");

      await axios.delete("http://localhost:3000/api/account/delete", {
        data: {
          confirmation: deleteConfirmationText.trim(),
          password: deletePassword,
        },
        withCredentials: true,
      });

      setIsDeleteModalOpen(false);
      setIsWipingData(true);

      setTimeout(() => {
        window.location.href = "/";
      }, 2500);
    } catch (err) {
      console.error("Delete account error:", err);
      setDeleteError(err.response?.data?.message || "Failed to delete account. Incorrect password.");
      setIsDeletingAccount(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-md shadow-indigo-600/30">
                <i className="fa-solid fa-sliders"></i>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Account Settings &amp; Safety
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Account credentials, community safety badges &amp; supporter perks
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`py-3.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "account"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="fa-solid fa-user-shield text-xs"></i>
              <span>Account Control</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("safety")}
              className={`py-3.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "safety"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="fa-solid fa-shield-halved text-xs"></i>
              <span>Community Safety</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("membership")}
              className={`py-3.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "membership"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="fa-solid fa-crown text-xs"></i>
              <span>Supporter Badges</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded-full">
                VIP
              </span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* TAB 1: ACCOUNT CONTROL */}
            {activeTab === "account" && (
              <div className="space-y-6">
                {/* Email Update Card */}
                <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <i className="fa-solid fa-envelope text-indigo-600"></i> Primary Login Email
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your registered login address: <strong className="text-slate-800">{currentEmail || "Not set"}</strong>
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                      <i className="fa-solid fa-circle-check text-[10px]"></i> Verified
                    </span>
                  </div>

                  {emailStatus && (
                    <div
                      className={`p-3 rounded-2xl text-xs font-semibold mb-3 flex items-center gap-2 ${
                        emailStatus.success
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      <i className={emailStatus.success ? "fa-solid fa-check" : "fa-solid fa-circle-exclamation"}></i>
                      <span>{emailStatus.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateEmail} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          New Email Address
                        </label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="e.g. pilot@onboard.social"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          placeholder="Verify your password"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        type="submit"
                        disabled={isUpdatingEmail || !newEmail || !emailPassword}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingEmail ? "Updating..." : "Update Email"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Password Change Card */}
                <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80">
                  <div className="mb-4">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <i className="fa-solid fa-key text-indigo-600"></i> Change Password
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ensure your account is protected with a strong, distinct password
                    </p>
                  </div>

                  {passwordStatus && (
                    <div
                      className={`p-3 rounded-2xl text-xs font-semibold mb-3 flex items-center gap-2 ${
                        passwordStatus.success
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      <i className={passwordStatus.success ? "fa-solid fa-check" : "fa-solid fa-circle-exclamation"}></i>
                      <span>{passwordStatus.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        type="submit"
                        disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
                      >
                        {isChangingPassword ? "Saving..." : "Change Password"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Connected Accounts & Cloud Photo Backup */}
                <div className="bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/50 rounded-3xl p-5 border border-indigo-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center text-lg shadow-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          Connected Accounts &amp; Cloud Backup
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Google account linkage &amp; cloud storage backup for photos
                        </p>
                      </div>
                    </div>
                    {isGoogleConnected ? (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                        <i className="fa-solid fa-check text-[10px]"></i> Connected
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                        <i className="fa-solid fa-link text-[10px]"></i> Email Account
                      </span>
                    )}
                  </div>

                  {backupStatusMessage && (
                    <div className="p-3 rounded-2xl text-xs font-semibold mb-3 flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 animate-in fade-in duration-200">
                      <i className="fa-solid fa-cloud-arrow-up text-emerald-600"></i>
                      <span>{backupStatusMessage}</span>
                    </div>
                  )}

                  <div className="bg-white/80 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-sm">
                          <i className="fa-solid fa-cloud"></i>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Cloud Photo Backup
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Automatically backup cabin uploads &amp; avatar history to cloud storage
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleCloudBackup}
                        disabled={isUpdatingBackup}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          cloudBackupEnabled ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                        role="switch"
                        aria-checked={cloudBackupEnabled}
                        title="Toggle Cloud Photo Backup"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            cloudBackupEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <i className="fa-solid fa-shield-halved text-indigo-500 text-[11px]"></i>
                        <span>Encrypted Cloud Sync</span>
                      </span>
                      <span className="font-semibold text-slate-700">
                        Status:{" "}
                        <span
                          className={
                            cloudBackupEnabled
                              ? "text-emerald-600 font-bold"
                              : "text-amber-600 font-bold"
                          }
                        >
                          {cloudBackupEnabled
                            ? "Active (High-speed Cloud)"
                            : "Paused"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* OnBoard Pulse™ Interaction Feedback */}
                <div className="bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/60 rounded-3xl p-5 border border-purple-100/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-sm shadow-indigo-500/25">
                        <i className="fa-solid fa-wave-square"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          OnBoard Pulse™ System
                          <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            V1
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Coordinated micro-sound, haptics, and connection motion
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <i className="fa-solid fa-volume-high text-indigo-600 text-sm"></i>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Sound Effects</span>
                          <span className="text-[10px] text-slate-400 block">Micro audio feedback</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const state = pulse.toggleSound();
                          setPulseSoundActive(state);
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          pulseSoundActive ? "bg-indigo-600" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                            pulseSoundActive ? "left-6" : "left-1"
                          }`}
                        ></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <i className="fa-solid fa-mobile-screen text-indigo-600 text-sm"></i>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Haptic Pulses</span>
                          <span className="text-[10px] text-slate-400 block">Gentle mobile taps</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const state = pulse.toggleHaptic();
                          setPulseHapticActive(state);
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          pulseHapticActive ? "bg-indigo-600" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                            pulseHapticActive ? "left-6" : "left-1"
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Test Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-bold text-slate-600">Test Pulse Signature:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => pulse.messageSent()}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-all cursor-pointer hover:border-indigo-400"
                      >
                        💬 Tuk
                      </button>
                      <button
                        type="button"
                        onClick={() => pulse.like()}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-all cursor-pointer hover:border-indigo-400"
                      >
                        ❤️ Pop
                      </button>
                      <button
                        type="button"
                        onClick={() => pulse.boardAccepted({ targetName: "@friend" })}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-bold text-indigo-700 transition-all cursor-pointer"
                      >
                        🫂 Connection Chord
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Sessions & Security Activity */}
                <div className="bg-indigo-50/60 rounded-3xl p-5 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">
                      <i className="fa-solid fa-laptop-code"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Device Sessions &amp; Security Log
                      </h4>
                      <p className="text-xs text-slate-500">
                        View active devices, IP addresses, and recent login events
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenSecurityAudit) {
                        onOpenSecurityAudit();
                      } else {
                        navigate("/notifications");
                      }
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                  >
                    View Devices →
                  </button>
                </div>

                {/* Danger Zone: Permanent Account Deletion */}
                <div className="bg-rose-50/60 rounded-3xl p-5 border border-rose-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                        Danger Zone
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Permanently Delete Account
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                        Permanently delete your profile, posts, photo galleries, messages, and social data. This action is irreversible.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-rose-600/30 cursor-pointer shrink-0"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMMUNITY SAFETY */}
            {activeTab === "safety" && (
              <div className="space-y-6">
                {/* Standing Card */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white rounded-3xl p-6 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30 shrink-0">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-slate-900">Community Standing</h4>
                        <CommunityStandingBadge standing={safetyStatus.standing} trustScore={safetyStatus.trustScore} />
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Your account has zero safety flags, clean spam score, and verified crew standing.
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-emerald-700">{safetyStatus.trustScore}%</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trust Score</div>
                  </div>
                </div>

                {/* Safety Badges Showcase */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Your Safety &amp; Trust Badges
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {safetyStatus.safetyBadges.map((badge, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-xs"
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">
                          <i className="fa-solid fa-award"></i>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{badge}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Community Alerts */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Community Guidelines &amp; Active Alerts
                  </h4>
                  <div className="space-y-2.5">
                    {safetyStatus.activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                          alert.level === "warning"
                            ? "bg-amber-50/80 border-amber-200 text-amber-900"
                            : alert.level === "success"
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                            : "bg-indigo-50/50 border-indigo-100 text-indigo-950"
                        }`}
                      >
                        <div className="font-extrabold text-sm mb-1">{alert.title}</div>
                        <p className="text-xs opacity-90">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blocked Users Section */}
                <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <i className="fa-solid fa-user-slash text-rose-500"></i> Blocked Members
                      </h4>
                      <p className="text-xs text-slate-500">
                        Blocked members cannot board your profile or message you
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                      {blockedUsers.length}
                    </span>
                  </div>

                  {isLoadingBlocked ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading blocked list...</div>
                  ) : blockedUsers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium">
                      <i className="fa-solid fa-hand-holding-heart text-lg text-emerald-400 block mb-1.5"></i>
                      No blocked members. Your cabin space is peaceful.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {blockedUsers.map((b) => (
                        <div
                          key={b.userId}
                          className="bg-white p-2.5 px-3.5 rounded-2xl border border-slate-200/70 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={b.profilePhoto}
                              alt={b.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900">{b.name}</div>
                              <div className="text-[11px] text-slate-400">@{b.userName}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnblockUser(b.userId)}
                            className="px-3 py-1 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Report Action */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-flag text-rose-500"></i>
                    <span>Submit a Safety or Spam Report</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: SUPPORTER BADGES & CREATOR PERKS */}
            {activeTab === "membership" && (
              <div className="space-y-6">
                {/* Live Preview Header Card */}
                <div
                  className={`rounded-3xl p-5 border transition-all ${
                    selectedTheme === "gold"
                      ? "bg-gradient-to-r from-amber-500/15 via-yellow-50 to-white border-amber-300 shadow-md shadow-amber-500/10"
                      : selectedTheme === "violet"
                      ? "bg-gradient-to-r from-purple-500/15 via-indigo-50 to-white border-purple-300 shadow-md shadow-purple-500/10"
                      : selectedTheme === "cyan"
                      ? "bg-gradient-to-r from-cyan-500/15 via-sky-50 to-white border-cyan-300 shadow-md shadow-cyan-500/10"
                      : selectedTheme === "rose"
                      ? "bg-gradient-to-r from-rose-500/15 via-pink-50 to-white border-rose-300 shadow-md shadow-rose-500/10"
                      : selectedTheme === "emerald"
                      ? "bg-gradient-to-r from-emerald-500/15 via-teal-50 to-white border-emerald-300 shadow-md shadow-emerald-500/10"
                      : "bg-gradient-to-r from-indigo-500/10 via-slate-50 to-white border-indigo-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Live Profile Preview
                    </span>
                    <MemberBadge tier={selectedTier} size="md" showLabel={true} />
                  </div>
                  <div className="flex items-center gap-3.5">
                    <img
                      src={currentUser?.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">
                          {currentUser?.name || currentUser?.userName || "Your Name"}
                        </span>
                        {currentUser?.isOfficialVerified && (
                          <span
                            className="inline-flex items-center text-indigo-600 text-sm"
                            title="Official Verified Tick"
                          >
                            <i className="fa-solid fa-circle-check"></i>
                          </span>
                        )}
                        <MemberBadge tier={selectedTier} size="sm" />
                      </div>
                      <div className="text-xs text-slate-400 font-medium">@{currentUser?.userName || "pilot"}</div>
                      {vipFlair && (
                        <div className="text-[11px] font-extrabold text-indigo-600 bg-white/80 px-2 py-0.5 rounded-full inline-block mt-1 shadow-xs border border-indigo-100">
                          ✨ {vipFlair}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {membershipStatus && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                      membershipStatus.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    <i className={membershipStatus.success ? "fa-solid fa-check" : "fa-solid fa-circle-exclamation"}></i>
                    <span>{membershipStatus.message}</span>
                  </div>
                )}

                {/* Official Blue Tick Status Card */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-4 border border-indigo-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-slate-900">
                          Official Verified Blue Tick
                        </h4>
                        {currentUser?.isOfficialVerified ? (
                          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            Not Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {currentUser?.isOfficialVerified
                          ? "Your identity is authenticated with an authentic blue tick beside your name."
                          : "Subscribe to unlock an authentic official blue tick beside your name everywhere."}
                      </p>
                    </div>
                  </div>
                  {!currentUser?.isOfficialVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenVerification) onOpenVerification();
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Get Verified
                    </button>
                  )}
                </div>

                {/* Tier Selection Cards */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Select Your Supporter Membership
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MEMBERSHIP_TIERS.map((tier) => {
                      const isSelected = selectedTier === tier.id;
                      return (
                        <div
                          key={tier.id}
                          onClick={() => setSelectedTier(tier.id)}
                          className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-600/10"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          {tier.popular && (
                            <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-sm">
                              Popular
                            </span>
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tier.color} text-white flex items-center justify-center text-sm shadow-sm`}
                              >
                                <i className={tier.icon}></i>
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-slate-900">{tier.name}</h5>
                                <div className="text-[11px] text-slate-500 font-semibold">
                                  <strong className="text-slate-900 font-extrabold">{tier.price}</strong> {tier.period}
                                </div>
                              </div>
                            </div>
                            <ul className="space-y-1.5 my-3">
                              {tier.perks.map((p, i) => (
                                <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                                  <i className="fa-solid fa-check text-emerald-500 text-[10px] mt-0.5 shrink-0"></i>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="pt-2">
                            <div
                              className={`w-full py-1.5 rounded-xl text-xs font-bold text-center transition-all ${
                                isSelected
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {isSelected ? "Active Tier ✓" : "Choose Tier"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cabin Theme Accent Picker */}
                <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cabin Theme Glow (Supporter Exclusive)
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Choose the accent glow for your member card and badges
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CABIN_THEMES.map((theme) => {
                      const isSelected = selectedTheme === theme.id;
                      return (
                        <div
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? `${theme.border} bg-white shadow-sm ring-2 ring-indigo-500/20`
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full ${theme.bg} shadow-sm shrink-0`}></div>
                          <span className="text-xs font-bold text-slate-800">{theme.name}</span>
                          {isSelected && <i className="fa-solid fa-check text-indigo-600 text-xs ml-auto"></i>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* VIP Bio Flair Editor */}
                <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Custom VIP Tagline / Flair
                  </h4>
                  <p className="text-xs text-slate-500 mb-2.5">
                    Displays below your username across profiles and cabins
                  </p>
                  <input
                    type="text"
                    value={vipFlair}
                    onChange={(e) => setVipFlair(e.target.value)}
                    maxLength={40}
                    placeholder="e.g. Cabin Pioneer ✨ or First Class Explorer 💎"
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="text-right text-[10px] text-slate-400 mt-1">
                    {vipFlair.length}/40 characters
                  </div>
                </div>

                {/* Save Membership Button */}
                <div className="text-right pt-2">
                  <button
                    type="button"
                    onClick={handleSaveMembership}
                    disabled={isSavingMembership}
                    className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 shadow-md shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingMembership ? "Saving Perks..." : "Save Supporter Perks"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Sub-Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl mb-4 shadow-sm shadow-rose-500/20">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">
              Permanently Delete Your Account?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              All your posts, bookmarks, photos, messages, and cabin history will be wiped forever. This action <strong>cannot</strong> be undone.
            </p>

            {deleteError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-2xl text-xs font-semibold mb-3 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Type <span className="text-rose-600 font-black">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full text-xs p-2.5 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Enter Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteError("");
                    setDeleteConfirmationText("");
                    setDeletePassword("");
                  }}
                  disabled={isDeletingAccount}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount || deleteConfirmationText.trim().toUpperCase() !== "DELETE" || !deletePassword}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingAccount ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cinematic Wiping Screen */}
      {isWipingData && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 text-white animate-in fade-in duration-500">
          <div className="w-16 h-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-black tracking-tight mb-2">Erasing Cabin Data...</h2>
          <p className="text-xs text-slate-400">Account and all personal content removed forever.</p>
        </div>
      )}

      {/* Standalone Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="user"
        targetId={currentUser?.userId || currentUser?._id}
        targetName={currentUser?.userName || "General Platform"}
        onReportSuccess={() => {
          fetchSafetyData();
        }}
      />
    </>
  );
};

export default AccountSettingsModal;
