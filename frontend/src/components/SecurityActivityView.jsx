import React, { useEffect, useState } from "react";
import axios from "axios";

const SecurityActivityView = ({ onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [auditHistory, setAuditHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/notifications/security/activity", {
        withCredentials: true,
      });
      setSessions(res.data.sessions || []);
      setAuditHistory(res.data.auditHistory || []);
    } catch (err) {
      console.error("Failed to fetch security activity:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/notifications/security/sessions/${sessionId}/revoke`,
        {},
        { withCredentials: true }
      );
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      setActionMessage("Session successfully terminated.");
      setTimeout(() => setActionMessage(""), 3500);
      fetchSecurityData();
    } catch (err) {
      console.error("Failed to revoke session:", err);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3000/api/notifications/security/sessions/revoke-others",
        {},
        { withCredentials: true }
      );
      setActionMessage(`Logged out ${res.data.count || "all other"} sessions.`);
      setTimeout(() => setActionMessage(""), 3500);
      fetchSecurityData();
    } catch (err) {
      console.error("Failed to revoke other sessions:", err);
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
        <button 
          type="button" 
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer mb-4" 
          onClick={onBack}
        >
          <i className="fa-solid fa-arrow-left text-[11px]"></i> Back to Notifications
        </button>
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <i className="fa-solid fa-shield-halved text-indigo-600"></i> Security &amp; Session Activity
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2 max-w-2xl">
            Review active logins, recent security alerts, and device sessions. Security audit history is strictly immutable and cannot be deleted.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <i className="fa-solid fa-check-circle"></i> {actionMessage}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium text-slate-400">Auditing security log...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Sessions Panel */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-laptop text-indigo-600"></i> Active Sessions ({sessions.length})
              </h4>
              {sessions.length > 1 && (
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  onClick={handleRevokeAllOtherSessions}
                >
                  <i className="fa-solid fa-right-from-bracket text-[10px]"></i> Log Out Other Sessions
                </button>
              )}
            </div>

            <div className="space-y-3 flex-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No active sessions found.</p>
              ) : (
                sessions.map((sess, idx) => (
                  <div key={sess._id} className="bg-slate-50/70 rounded-2xl p-4 flex items-center gap-3.5 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shrink-0">
                      <i
                        className={`fa-solid ${
                          sess.userAgent?.includes("Mobile") ? "fa-mobile-screen" : "fa-laptop"
                        }`}
                      ></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {sess.userAgent?.includes("Chrome")
                            ? "Chrome Browser"
                            : sess.userAgent?.includes("Safari")
                            ? "Safari Browser"
                            : "Web Browser"}
                        </span>
                        {idx === 0 && (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            Active Session
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                        IP: {sess.ip || "127.0.0.1"} • Started {formatTimestamp(sess.createdAt)}
                      </span>
                    </div>
                    {idx !== 0 && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                        onClick={() => handleRevokeSession(sess._id)}
                      >
                        Log out
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Immutable Security Audit Trail */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-indigo-600"></i> Security Audit Trail
              </h4>
              <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                Immutable Record
              </span>
            </div>

            <div className="space-y-3.5 flex-1 max-h-[480px] overflow-y-auto pr-1">
              {auditHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No security events recorded yet.</p>
              ) : (
                auditHistory.map((event) => (
                  <div key={event._id} className="relative pl-6 pb-3 last:pb-0 border-l-2 border-indigo-100 last:border-transparent">
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-white"></span>
                    <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900">
                          {event.eventType === "LOGIN_SUCCESS" && "Successful sign-in"}
                          {event.eventType === "LOGIN_FAILED" && "Failed login attempt"}
                          {event.eventType === "LOGIN_NEW_DEVICE" && "New device recognized"}
                          {event.eventType === "PASSWORD_CHANGED" && "Password updated"}
                          {event.eventType === "SESSION_REVOKED" && "Session terminated"}
                          {event.eventType === "LOGIN_FAILED_THRESHOLD" && "Multiple failed attempts"}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatTimestamp(event.timestamp)}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block leading-relaxed">
                        {event.device} • {event.browser} • {event.approximateLocation} (IP: {event.ip})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityActivityView;
