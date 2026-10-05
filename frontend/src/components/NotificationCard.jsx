import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const NotificationCard = ({
  notification,
  onMarkRead,
  onMarkUnread,
  onAction,
  onDelete,
}) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showActorsDrawer, setShowActorsDrawer] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  // 1. Dwell-Time Viewport Detection (600ms)
  useEffect(() => {
    if (notification.status !== "unread") return;

    let dwellTimer = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          dwellTimer = setTimeout(() => {
            onMarkRead(notification._id);
          }, 650);
        } else {
          if (dwellTimer) {
            clearTimeout(dwellTimer);
            dwellTimer = null;
          }
        }
      },
      { threshold: 0.7 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (dwellTimer) clearTimeout(dwellTimer);
      observer.disconnect();
    };
  }, [notification._id, notification.status, onMarkRead]);

  // Relative timestamp formatter
  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const then = new Date(dateString);
    const diffInSeconds = Math.floor((now - then) / 1000);
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getActorProfilePath = () => {
    if (notification.category === "security" || notification.actorName === "OnBoard" || notification.actorName === "Security System") {
      return null;
    }
    if (notification.actorUserName) {
      return `/profile/${notification.actorUserName}`;
    }
    const actorId = notification.actorId || notification.actor?._id || (typeof notification.actor === "string" ? notification.actor : null);
    if (actorId) {
      return `/profile/${actorId}`;
    }
    if (notification.entityType === "user" && notification.entityId) {
      const eid = typeof notification.entityId === "object" ? notification.entityId._id || notification.entityId : notification.entityId;
      return `/profile/${eid}`;
    }
    if (notification.deepLink && (notification.deepLink.startsWith("/profile/") || notification.deepLink.startsWith("/user/"))) {
      return notification.deepLink;
    }
    return null;
  };

  const handleActorClick = (e) => {
    e.stopPropagation();
    const profilePath = getActorProfilePath();
    if (profilePath) {
      if (notification.status === "unread") {
        onMarkRead(notification._id);
      }
      navigate(profilePath);
    }
  };

  const handleCardClick = (e) => {
    if (e.target.closest(".action-stop-prop") || e.target.closest(".menu-stop-prop")) {
      return;
    }
    if (notification.status === "unread") {
      onMarkRead(notification._id);
    }
    if (notification.deepLink && notification.deepLink !== "/notifications") {
      navigate(notification.deepLink);
    } else {
      const fallbackProfile = getActorProfilePath();
      if (fallbackProfile && (notification.type === "BOARDING_REQUEST" || notification.type === "BOARDING_ACCEPTED")) {
        navigate(fallbackProfile);
      }
    }
  };

  const handleAction = async (action) => {
    setIsActioning(true);
    try {
      await onAction(notification._id, action);
    } finally {
      setIsActioning(false);
    }
  };

  const getIconMeta = () => {
    switch (notification.type) {
      case "LIKE":
        return { icon: "fa-heart", emoji: "❤️", color: "bg-pink-500 text-white" };
      case "REACTION":
        return { icon: "fa-face-smile", emoji: notification.metadata?.emoji || "✨", color: "bg-amber-500 text-white" };
      case "COMMENT":
        return { icon: "fa-comment", emoji: "💬", color: "bg-blue-500 text-white" };
      case "MENTION":
        return { icon: "fa-at", emoji: "@", color: "bg-purple-500 text-white" };
      case "BOARDING_REQUEST":
        return { icon: "fa-ticket", emoji: "🎟️", color: "bg-indigo-600 text-white" };
      case "BOARDING_ACCEPTED":
        return { icon: "fa-user-group", emoji: "👥", color: "bg-emerald-500 text-white" };
      case "CREW_INVITE":
      case "CREW_ROLE":
        return { icon: "fa-crown", emoji: "👑", color: "bg-amber-500 text-white" };
      case "CREW_BIRTHDAY":
        return { icon: "fa-cake-candles", emoji: "🎂", color: "bg-gradient-to-r from-amber-500 to-rose-500 text-white" };
      case "MESSAGE":
      case "REPLY":
        return { icon: "fa-paper-plane", emoji: "💬", color: "bg-indigo-600 text-white" };
      case "CHAPTER_CREATED":
        return { icon: "fa-book-open", emoji: "📖", color: "bg-indigo-500 text-white" };
      case "MOMENT_CREATED":
        return { icon: "fa-sparkles", emoji: "✨", color: "bg-pink-500 text-white" };
      case "EXPERIENCE_INVITE":
      case "RSVP_CHANGED":
        return { icon: "fa-compass", emoji: "🌴", color: "bg-emerald-500 text-white" };
      case "LOCATION_SHARED":
      case "LIVE_LOCATION_STARTED":
        return { icon: "fa-location-dot", emoji: "📍", color: "bg-emerald-500 text-white" };
      case "LIVE_LOCATION_STOPPED":
        return { icon: "fa-location-crosshairs", emoji: "🛑", color: "bg-slate-400 text-white" };
      case "LOGIN_NEW_DEVICE":
      case "PASSWORD_CHANGED":
      case "SECURITY_WARNING":
        return { icon: "fa-shield-halved", emoji: "🔐", color: "bg-rose-500 text-white" };
      default:
        return { icon: "fa-bell", emoji: "🔔", color: "bg-indigo-600 text-white" };
    }
  };

  const iconMeta = getIconMeta();
  const isUnread = notification.status === "unread";

  const renderAvatar = () => {
    if (notification.actorAvatar) {
      return (
        <img
          src={notification.actorAvatar}
          alt={notification.actorName}
          className="w-11 h-11 rounded-full object-cover border border-slate-100 shadow-sm"
        />
      );
    }
    if (notification.category === "security") {
      return (
        <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-lg border border-rose-100 shadow-sm">
          <i className="fa-solid fa-shield-halved"></i>
        </div>
      );
    }
    if (notification.type?.includes("LOCATION")) {
      return (
        <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-lg border border-emerald-100 shadow-sm">
          <i className="fa-solid fa-location-dot"></i>
        </div>
      );
    }
    if (notification.actorName && notification.actorName !== "OnBoard") {
      const initial = notification.actorName.charAt(0).toUpperCase();
      return (
        <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100 shadow-sm">
          {initial}
        </div>
      );
    }
    return (
      <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm shadow-sm">
        <i className="fa-solid fa-paper-plane"></i>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className={`relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex items-start gap-3.5 cursor-pointer ${
        isUnread 
          ? "bg-white border-indigo-100 shadow-md hover:shadow-lg hover:border-indigo-300" 
          : "bg-white/70 hover:bg-white border-slate-100/90 shadow-sm hover:shadow-md"
      }`}
      onClick={handleCardClick}
    >
      {/* Unread Indicator Bar */}
      {isUnread && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-r-full" />
      )}

      {/* Avatar Container with Type Badge */}
      <div
        className={`relative shrink-0 ${getActorProfilePath() ? "cursor-pointer group/avatar" : ""}`}
        onClick={getActorProfilePath() ? handleActorClick : undefined}
        title={getActorProfilePath() ? `View ${notification.actorName}'s profile` : undefined}
      >
        <div className="transition-transform duration-200 group-hover/avatar:scale-105">
          {renderAvatar()}
        </div>
        <span
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-md ring-2 ring-white ${iconMeta.color}`}
        >
          <i className={`fa-solid ${iconMeta.icon}`}></i>
        </span>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="text-xs sm:text-sm text-slate-800 leading-snug">
          {notification.actorName && getActorProfilePath() ? (
            <span
              className="font-bold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer transition-colors duration-150 inline-block"
              onClick={handleActorClick}
              title={`View ${notification.actorName}'s profile`}
            >
              {notification.actorName}
            </span>
          ) : (
            <span className="font-bold text-slate-900">{notification.actorName}</span>
          )}
          <span className="text-slate-600"> {notification.body}</span>
        </div>

        {/* Snippet / Metadata preview if available */}
        {notification.metadata?.commentSnippet && (
          <div className="mt-1.5 text-xs text-slate-500 italic bg-slate-50 border-l-2 border-indigo-300 px-2.5 py-1 rounded-r-lg max-w-lg">
            "{notification.metadata.commentSnippet}"
          </div>
        )}

        {/* Grouped Actors Drawer Toggle */}
        {notification.groupCount > 1 && notification.actors?.length > 1 && (
          <div className="mt-2 action-stop-prop">
            <button
              type="button"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowActorsDrawer(!showActorsDrawer);
              }}
            >
              <span>{showActorsDrawer ? "Hide people" : `View ${notification.groupCount} people`}</span>
              <i className={`fa-solid fa-chevron-${showActorsDrawer ? "up" : "down"} text-[10px]`}></i>
            </button>

            {showActorsDrawer && (
              <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                {notification.actors.slice(-8).reverse().map((act, idx) => {
                  const actUserId = act.user?._id || act.user;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-white hover:bg-indigo-50 px-2 py-0.5 rounded-full border border-slate-200 text-[11px] font-medium text-slate-700 hover:text-indigo-600 cursor-pointer transition-colors shadow-2xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (actUserId) navigate(`/profile/${actUserId}`);
                      }}
                      title={`View ${act.name}'s profile`}
                    >
                      {act.avatar ? (
                        <img src={act.avatar} alt={act.name} className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[9px] flex items-center justify-center font-bold">
                          {act.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <span>{act.name}</span>
                    </div>
                  );
                })}
                {notification.groupCount > 8 && (
                  <span className="text-[11px] text-slate-400 self-center">+{notification.groupCount - 8} more</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamp & Tag */}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-medium">
          <span>{timeAgo(notification.createdAt)}</span>
          {notification.category === "security" && (
            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="fa-solid fa-lock text-[9px]"></i> Protected Audit
            </span>
          )}
        </div>

        {/* Inline Actions */}
        {notification.actionType === "accept_decline_board" && (
          <div className="flex items-center gap-2 mt-3 action-stop-prop">
            {notification.status === "actioned" ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                <i className="fa-solid fa-check text-[11px]"></i>{" "}
                {notification.actionResult === "accepted" ? "Boarded to Crew" : "Declined"}
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  disabled={isActioning}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction("accept");
                  }}
                >
                  <i className="fa-solid fa-check text-[11px]"></i> Accept
                </button>
                <button
                  type="button"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  disabled={isActioning}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction("decline");
                  }}
                >
                  Decline
                </button>
              </>
            )}
          </div>
        )}

        {notification.type === "CREW_BIRTHDAY" && (
          <div className="flex items-center gap-2 mt-3 action-stop-prop">
            <button
              type="button"
              className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (notification.deepLink) {
                  navigate(notification.deepLink);
                } else if (notification.metadata?.userName) {
                  navigate(`/profile/${notification.metadata.userName}`);
                }
              }}
            >
              <i className="fa-solid fa-cake-candles text-[11px]"></i>
              <span>Wish Happy Birthday! 🎉</span>
            </button>
          </div>
        )}

        {notification.actionType === "experience_rsvp" && (
          <div className="flex items-center gap-2 mt-3 action-stop-prop flex-wrap">
            {notification.status === "actioned" ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl">
                RSVP: {notification.actionResult}
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction("going");
                  }}
                >
                  Going 🟢
                </button>
                <button
                  type="button"
                  className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction("maybe");
                  }}
                >
                  Maybe 🟡
                </button>
                <button
                  type="button"
                  className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction("cant_go");
                  }}
                >
                  Can't Go 🔴
                </button>
              </>
            )}
          </div>
        )}

        {notification.actionType === "view_location" && (
          <div className="mt-3 action-stop-prop">
            <button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (notification.deepLink) navigate(notification.deepLink);
              }}
            >
              <i className="fa-solid fa-location-arrow text-[11px]"></i> View on Radar
            </button>
          </div>
        )}
      </div>

      {/* Context Menu (Three Dots) */}
      <div className="absolute top-4 right-4 menu-stop-prop">
        <button
          type="button"
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Notification options"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <i className="fa-solid fa-ellipsis"></i>
        </button>

        {showMenu && (
          <div 
            className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {isUnread ? (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer"
                onClick={() => {
                  setShowMenu(false);
                  onMarkRead(notification._id);
                }}
              >
                <i className="fa-solid fa-envelope-open text-[11px]"></i> Mark as read
              </button>
            ) : (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer"
                onClick={() => {
                  setShowMenu(false);
                  onMarkUnread(notification._id);
                }}
              >
                <i className="fa-solid fa-envelope text-[11px]"></i> Mark as unread
              </button>
            )}

            {notification.category !== "security" ? (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                onClick={() => {
                  setShowMenu(false);
                  onDelete(notification._id);
                }}
              >
                <i className="fa-solid fa-trash text-[11px]"></i> Delete
              </button>
            ) : (
              <span className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-400 font-medium cursor-not-allowed">
                <i className="fa-solid fa-lock text-[10px]"></i> Permanent audit log
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
