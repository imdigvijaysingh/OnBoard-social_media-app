import React, { useEffect, useState } from "react";
import axios from "axios";

const NotificationSettingsModal = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState({
    messages: { direct: true, mentions: true, replies: true, reactions: true },
    social: { likes: true, comments: true, mentions: true },
    crews: { boardingRequests: true, invitations: true, roleChanges: true, announcements: true },
    location: { current: true, live: true, expiration: true },
    activity: { experiences: true, polls: true, checklists: true, boards: true, lounges: true },
    security: { newLogin: true, passwordChanged: true, sessionRevoked: true },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const fetchPreferences = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/notifications/settings", {
        withCredentials: true,
      });
      if (res.data?.preferences) {
        setPreferences((prev) => ({
          ...prev,
          ...res.data.preferences,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    }
  };

  const handleToggle = (category, subfield) => {
    if (category === "security") return;

    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subfield]: !prev[category]?.[subfield],
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.patch(
        "http://localhost:3000/api/notifications/settings",
        preferences,
        { withCredentials: true }
      );
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to save notification preferences:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[1000] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-sliders text-indigo-600 text-base"></i> Notification Preferences
          </h3>
          <button 
            type="button" 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" 
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            Customize which in-app notification alerts you receive. Critical security alerts are permanently active to safeguard your OnBoard flight pass.
          </p>

          {/* Social */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <i className="fa-solid fa-heart text-pink-500"></i> Social &amp; Reactions
            </h4>
            <div className="bg-slate-50/60 rounded-2xl p-4 divide-y divide-slate-100 border border-slate-100">
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Likes &amp; Double-taps</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.social?.likes}
                  onChange={() => handleToggle("social", "likes")}
                />
              </label>
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Comments &amp; Discussions</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.social?.comments}
                  onChange={() => handleToggle("social", "comments")}
                />
              </label>
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Mentions &amp; Tags</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.social?.mentions}
                  onChange={() => handleToggle("social", "mentions")}
                />
              </label>
            </div>
          </div>

          {/* Crews & Boarding */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <i className="fa-solid fa-users text-indigo-600"></i> Crew &amp; Boarding
            </h4>
            <div className="bg-slate-50/60 rounded-2xl p-4 divide-y divide-slate-100 border border-slate-100">
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Boarding Requests</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.crews?.boardingRequests}
                  onChange={() => handleToggle("crews", "boardingRequests")}
                />
              </label>
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Crew Invitations</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.crews?.invitations}
                  onChange={() => handleToggle("crews", "invitations")}
                />
              </label>
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Announcements &amp; Badges</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.crews?.announcements}
                  onChange={() => handleToggle("crews", "announcements")}
                />
              </label>
            </div>
          </div>

          {/* Cabin Chats */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <i className="fa-solid fa-comments text-blue-500"></i> Cabin Chats
            </h4>
            <div className="bg-slate-50/60 rounded-2xl p-4 divide-y divide-slate-100 border border-slate-100">
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Direct &amp; Crew Messages</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.messages?.direct}
                  onChange={() => handleToggle("messages", "direct")}
                />
              </label>
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Chat Emoji Reactions</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.messages?.reactions}
                  onChange={() => handleToggle("messages", "reactions")}
                />
              </label>
            </div>
          </div>

          {/* Location Coordination */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-emerald-500"></i> Location Coordination
            </h4>
            <div className="bg-slate-50/60 rounded-2xl p-4 divide-y divide-slate-100 border border-slate-100">
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Live Location Shares</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.location?.live}
                  onChange={() => handleToggle("location", "live")}
                />
              </label>
              <label className="flex items-center justify-between py-2 text-sm text-slate-700 cursor-pointer font-medium">
                <span>Expiration Alerts</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={preferences.location?.expiration}
                  onChange={() => handleToggle("location", "expiration")}
                />
              </label>
            </div>
          </div>

          {/* Security (Permanently enforced) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-rose-500"></i> Account Security
              </h4>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                <i className="fa-solid fa-lock text-[10px]"></i> Always Active
              </span>
            </div>
            <div className="bg-slate-50/60 rounded-2xl p-4 divide-y divide-slate-100 border border-slate-100 opacity-75">
              <div className="flex items-center justify-between py-2 text-sm text-slate-600 font-medium">
                <span>New Device Recognition</span>
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked disabled />
              </div>
              <div className="flex items-center justify-between py-2 text-sm text-slate-600 font-medium">
                <span>Password Changes &amp; Session Alerts</span>
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked disabled />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <button 
            type="button" 
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors text-xs cursor-pointer" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;
