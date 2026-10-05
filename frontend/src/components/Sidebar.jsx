import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { scrollToTop } from "../utils/scrollToTop";
import AccountSettingsModal from "./AccountSettingsModal";
import { useSidebar } from "../context/SidebarContext";

const Sidebar = ({ isOpen, onClose }) => {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/profile", { withCredentials: true })
      .then((res) => {
        if (res.data) setProfile(res.data);
      })
      .catch(() => {});
  }, []);

  const prevCountRef = useRef(0);
  const toastTimeoutRef = useRef(null);

  // Periodic polling for unread count + adaptive focus sync
  useEffect(() => {
    let intervalId = null;

    const fetchUnreadCount = async () => {
      if (document.hidden) return;

      try {
        const res = await axios.get("http://localhost:3000/api/notifications/unread-count", {
          withCredentials: true,
        });

        const newCount = res.data.unreadCount || 0;
        const latest = res.data.latestNotification;

        if (newCount > prevCountRef.current && prevCountRef.current !== 0) {
          const diff = newCount - prevCountRef.current;
          if (pathname !== "/notifications" && latest) {
            triggerFloatingToast(diff, latest);
          }
        }

        prevCountRef.current = newCount;
        setNotificationCount(newCount);
      } catch (err) {
        // Silently catch in polling loop
      }
    };

    fetchUnreadCount();
    intervalId = setInterval(fetchUnreadCount, 8000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [pathname]);

  const triggerFloatingToast = (newArrivedCount, latestNotif) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    let toastData = {
      count: newArrivedCount,
      title: latestNotif.title,
      body: latestNotif.body,
      actorName: latestNotif.actor?.firstName || "Someone",
      deepLink: latestNotif.deepLink || "/notifications",
      type: latestNotif.type,
    };

    if (newArrivedCount === 1) {
      toastData.displayText = `${toastData.actorName} ${latestNotif.body}`;
    } else if (newArrivedCount <= 4) {
      toastData.displayText = `${newArrivedCount} new notifications: ${toastData.actorName} ${latestNotif.body}`;
    } else {
      toastData.displayText = `${newArrivedCount} new notifications`;
    }

    setActiveToast(toastData);

    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 4500);
  };

  const handleToastClick = () => {
    if (activeToast?.deepLink) {
      navigate(activeToast.deepLink);
    } else {
      navigate("/notifications");
    }
    setActiveToast(null);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await axios.post(
        "http://localhost:3000/api/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setTimeout(() => {
        navigate("/");
      }, 1200);
    }
  };

  const handleNavClick = () => {
    scrollToTop();
    if (onClose) onClose();
  };

  const moreMenuRef = useRef(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Close more menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setIsMoreOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  // Close popover when collapsing/expanding or navigating
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname, isCollapsed]);

  const navItems = [
    { to: "/feed", label: "Feed", icon: "fa-solid fa-house" },
    { to: "/discover", label: "Discover", icon: "fa-solid fa-compass" },
    { to: "/search", label: "Search Crew", icon: "fa-solid fa-users" },
    { to: "/squads", label: "Squads", icon: "fa-solid fa-anchor" },
    { to: "/dual-deck", label: "Dual Deck", icon: "fa-solid fa-table-columns" },
    { to: "/chats", label: "Chats", icon: "fa-solid fa-comments" },
    {
      to: "/notifications",
      label: "Notifications",
      icon: "fa-solid fa-bell",
      badge: notificationCount > 0 ? (notificationCount > 9 ? "9+" : notificationCount) : null,
      badgeColor: "bg-rose-500 text-white",
      isNotification: true,
    },
    { to: "/my-profile", label: "Profile", icon: "fa-solid fa-user" },
  ];

  // Renders a single nav link (expanded mode)
  const renderExpandedLink = (item) => {
    const isActive = pathname === item.to;
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={handleNavClick}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
          isActive
            ? "bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25"
            : "text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <i
            className={`${item.icon} text-base w-5 text-center ${
              isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-600"
            }`}
          ></i>
          <span className="truncate">{item.label}</span>
        </div>

        {item.badge && (
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              isActive ? "bg-white/25 text-white" : item.badgeColor || "bg-indigo-100 text-indigo-700"
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  // Renders a single nav icon (collapsed mode)
  const renderCollapsedLink = (item) => {
    const isActive = pathname === item.to;
    return (
      <div key={item.to} className="relative w-full flex justify-center py-1">
        <Link
          to={item.to}
          onClick={handleNavClick}
          title={item.label}
          className={`flex items-center justify-center w-11 h-11 rounded-2xl text-base transition-all duration-200 relative cursor-pointer ${
            isActive
              ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 scale-105"
              : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70"
          }`}
          aria-label={item.label}
        >
          <i className={`${item.icon} text-base`}></i>
          {item.badge && (
            <span
              className={`absolute -top-1 -right-1 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs ${
                item.isNotification ? "bg-rose-500" : "bg-indigo-600"
              }`}
            >
              {item.badge}
            </span>
          )}
        </Link>
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200/80 flex flex-col z-50 transition-all duration-300 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${
          isCollapsed ? "w-20 px-2.5 py-5" : "w-64 p-5"
        }`}
      >
        {/* Header: Expanded vs Collapsed */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between mb-5 shrink-0 px-1">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={handleNavClick}
            >
              <img
                src="/favicon.svg"
                alt="OnBoard"
                className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300 shrink-0"
              />
              <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent tracking-tight">
                OnBoard
              </h1>
            </div>
            <div className="flex items-center gap-1">
              {/* Desktop Hamburger Button to minimize panel */}
              <button
                type="button"
                className="hidden lg:flex text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/70 p-2 rounded-xl transition-all cursor-pointer"
                onClick={toggleCollapse}
                title="Minimise sidebar to icons"
                aria-label="Minimise sidebar"
              >
                <i className="fa-solid fa-bars text-base"></i>
              </button>
              {/* Mobile Close Button */}
              <button
                className="lg:hidden text-slate-400 hover:text-slate-700 text-lg p-1 rounded-lg transition-colors cursor-pointer"
                onClick={onClose}
                aria-label="Close Sidebar"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mb-3 shrink-0">
            {/* Desktop Hamburger Button to expand panel */}
            <button
              type="button"
              className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 p-2 rounded-2xl transition-all cursor-pointer"
              onClick={toggleCollapse}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <i className="fa-solid fa-bars text-base"></i>
            </button>
            {/* Official OnBoard Favicon Logo */}
            <button
              type="button"
              className="w-9 h-9 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/70 flex items-center justify-center p-1.5 shadow-xs hover:shadow-md cursor-pointer hover:scale-105 transition-all group"
              onClick={handleNavClick}
              title="OnBoard Home"
              aria-label="OnBoard Home"
            >
              <img
                src="/favicon.svg"
                alt="OnBoard"
                className="w-full h-full object-contain group-hover:rotate-12 transition-transform duration-300"
              />
            </button>
          </div>
        )}

        {/* Navigation list (Real OnBoard features with comfortable, spacious sizing) */}
        <nav
          className={`flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto scrollbar-none ${
            isCollapsed ? "items-center overflow-visible" : "pr-0.5"
          }`}
        >
          {navItems.map((item, idx) => (
            <React.Fragment key={item.to}>
              {/* Insert divider before Profile */}
              {item.to === "/my-profile" && !isCollapsed && (
                <div className="my-1.5 border-t border-slate-100 mx-1"></div>
              )}
              {isCollapsed ? renderCollapsedLink(item) : renderExpandedLink(item)}
            </React.Fragment>
          ))}

          {/* Settings & Safety */}
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(true);
                if (onClose) onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80 transition-all cursor-pointer text-left"
            >
              <i className="fa-solid fa-gear text-base w-5 text-center text-slate-500"></i>
              <span>Settings &amp; Safety</span>
            </button>
          ) : (
            <div className="relative w-full flex justify-center py-1">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(true);
                  if (onClose) onClose();
                }}
                title="Settings & Safety"
                className="flex items-center justify-center w-11 h-11 rounded-2xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-gear text-base"></i>
              </button>
            </div>
          )}
        </nav>

        {/* Pinned Bottom Elements (Spacious, clean, and never cut off) */}
        <div className="shrink-0 mt-auto pt-3 border-t border-slate-100 flex flex-col gap-2">
          {!isCollapsed ? (
            <>
              {/* User Profile Mini Card */}
              <Link
                to="/my-profile"
                onClick={handleNavClick}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/90 hover:bg-slate-100 border border-slate-200/70 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={profile?.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                      {profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : (profile?.userName || "Digvijay")}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">View Profile</span>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors pr-1"></i>
              </Link>

              {/* Log Out Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer text-left"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-sm w-4 text-center"></i>
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              title="Log Out"
              aria-label="Log Out"
              className="flex items-center justify-center w-11 h-11 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer mx-auto"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-base"></i>
            </button>
          )}
        </div>
      </aside>

      {/* Account Settings & Safety Hub Modal */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-slate-900 animate-in slide-in-from-bottom-2 duration-300">
            Logging out...
          </h2>
        </div>
      )}
    </>
  );
};

export default Sidebar;
