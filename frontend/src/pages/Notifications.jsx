import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationCard from "../components/NotificationCard";
import SecurityActivityView from "../components/SecurityActivityView";
import NotificationSettingsModal from "../components/NotificationSettingsModal";
import { useSidebar } from "../context/SidebarContext";

const Notifications = () => {
  const { isCollapsed } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("tab") || "all";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [showSecurityView, setShowSecurityView] = useState(initialCategory === "security_view");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasVisitedWithUnread, setHasVisitedWithUnread] = useState(false);

  // Sync category param with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "security") {
      setShowSecurityView(true);
    } else if (tab) {
      setActiveCategory(tab);
      setShowSecurityView(false);
    }
  }, [searchParams]);

  // Offline / Online listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/notifications", {
        params: { category: activeCategory, limit: 50 },
        withCredentials: true,
      });

      const items = res.data.notifications || [];
      setNotifications(items);
      setUnreadCount(res.data.unreadCount || 0);

      if (items.some((n) => n.status === "unread")) {
        setHasVisitedWithUnread(true);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (!showSecurityView) {
      fetchNotifications();
    }
  }, [activeCategory, showSecurityView, fetchNotifications]);

  // Mark single as read
  const handleMarkRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, status: "read", readAt: new Date() } : n))
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));

    try {
      await axios.patch(
        `http://localhost:3000/api/notifications/${id}/read`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  }, []);

  // Mark single as unread
  const handleMarkUnread = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, status: "unread", readAt: null } : n))
    );
    setUnreadCount((prev) => prev + 1);

    try {
      await axios.patch(
        `http://localhost:3000/api/notifications/${id}/unread`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to mark unread:", err);
    }
  }, []);

  // Mark all as read
  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "read", readAt: new Date() }))
    );
    setUnreadCount(0);
    setHasVisitedWithUnread(false);

    try {
      await axios.patch(
        "http://localhost:3000/api/notifications/read-all",
        { category: activeCategory },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      fetchNotifications();
    }
  };

  // Perform inline action
  const handleAction = async (id, action) => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/notifications/${id}/action`,
        { action },
        { withCredentials: true }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, status: "actioned", actionResult: res.data.result?.action || action }
            : n
        )
      );
    } catch (err) {
      console.error("Failed to perform action:", err);
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await axios.delete(`http://localhost:3000/api/notifications/${id}`, {
        withCredentials: true,
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
      fetchNotifications();
    }
  };

  // Group notifications chronologically
  const groupedSections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      newActivity: [],
      today: [],
      yesterday: [],
      earlier: [],
    };

    notifications.forEach((item) => {
      const itemDate = new Date(item.createdAt);

      if (item.status === "unread" && hasVisitedWithUnread) {
        groups.newActivity.push(item);
      } else if (itemDate >= today) {
        groups.today.push(item);
      } else if (itemDate >= yesterday) {
        groups.yesterday.push(item);
      } else {
        groups.earlier.push(item);
      }
    });

    return groups;
  }, [notifications, hasVisitedWithUnread]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabChange = (cat) => {
    setActiveCategory(cat);
    setShowSecurityView(false);
    setSearchParams(cat === "all" ? {} : { tab: cat });
  };

  const openSecurityView = () => {
    setShowSecurityView(true);
    setSearchParams({ tab: "security" });
  };

  const closeSecurityView = () => {
    setShowSecurityView(false);
    setActiveCategory("all");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      <div className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
      }`}>
        {/* Top Navbar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              className="lg:hidden text-slate-700 text-lg p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={toggleSidebar}
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm shadow-indigo-600/30">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
              title="Security & Session Activity"
              onClick={openSecurityView}
            >
              <i className="fa-solid fa-shield-halved text-indigo-600"></i>
              <span className="hidden sm:inline">Security</span>
            </button>
            <button
              type="button"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              title="Notification Settings"
              onClick={() => setIsSettingsOpen(true)}
            >
              <i className="fa-solid fa-gear text-sm"></i>
            </button>
          </div>
        </div>

        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-6 py-2.5 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-wifi-slash"></i> You are currently offline. Showing cached notifications.
          </div>
        )}

        <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
          {showSecurityView ? (
            <SecurityActivityView onBack={closeSecurityView} />
          ) : (
            <>
              {/* Category Filter Pills & Mark All Read Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: "all", label: "All" },
                    { id: "social", label: "Social" },
                    { id: "crews", label: "Crews" },
                    { id: "chats", label: "Chats" },
                    { id: "activity", label: "Activity" },
                    { id: "security", label: "Security" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        activeCategory === tab.id
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                          : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
                      }`}
                      onClick={() => handleTabChange(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                    onClick={handleMarkAllRead}
                  >
                    <i className="fa-solid fa-check-double text-[11px]"></i> Mark all as read
                  </button>
                )}
              </div>

              {/* Feed Content */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 animate-pulse">
                      <div className="w-11 h-11 rounded-full bg-slate-200 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-1/3 h-3 bg-slate-200 rounded"></div>
                        <div className="w-2/3 h-2.5 bg-slate-100 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 max-w-md mx-auto my-8">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mx-auto mb-4">
                    <i className="fa-regular fa-bell"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">You're all caught up!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    When someone boards your Crew, reacts, shares location, or an experience is planned, you'll find it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* "NEW ACTIVITY" Section */}
                  {groupedSections.newActivity.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl w-fit">
                        <i className="fa-solid fa-sparkles text-[11px]"></i> New Activity
                      </div>
                      <div className="space-y-2.5">
                        {groupedSections.newActivity.map((notif) => (
                          <NotificationCard
                            key={notif._id}
                            notification={notif}
                            onMarkRead={handleMarkRead}
                            onMarkUnread={handleMarkUnread}
                            onAction={handleAction}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* "Today" Section */}
                  {groupedSections.today.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Today
                      </div>
                      <div className="space-y-2.5">
                        {groupedSections.today.map((notif) => (
                          <NotificationCard
                            key={notif._id}
                            notification={notif}
                            onMarkRead={handleMarkRead}
                            onMarkUnread={handleMarkUnread}
                            onAction={handleAction}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* "Yesterday" Section */}
                  {groupedSections.yesterday.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Yesterday
                      </div>
                      <div className="space-y-2.5">
                        {groupedSections.yesterday.map((notif) => (
                          <NotificationCard
                            key={notif._id}
                            notification={notif}
                            onMarkRead={handleMarkRead}
                            onMarkUnread={handleMarkUnread}
                            onAction={handleAction}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* "Earlier" Section */}
                  {groupedSections.earlier.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Earlier
                      </div>
                      <div className="space-y-2.5">
                        {groupedSections.earlier.map((notif) => (
                          <NotificationCard
                            key={notif._id}
                            notification={notif}
                            onMarkRead={handleMarkRead}
                            onMarkUnread={handleMarkUnread}
                            onAction={handleAction}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notification Preferences Modal */}
      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Notifications;
