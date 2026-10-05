import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import pulse from "../utils/pulseEngine";

const API_BASE = "http://localhost:3000/api/profile";

const UserSearchDropdown = ({ onBoardStatusChange }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [boardedStatusMap, setBoardedStatusMap] = useState({});
  const [isActionLoading, setIsActionLoading] = useState({});

  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/search?q=${encodeURIComponent(query.trim())}`, {
          withCredentials: true,
        });
        const users = res.data.users || [];
        setResults(users);
        setIsOpen(true);

        // Populate initial board status map from results
        const statusMap = {};
        users.forEach((u) => {
          statusMap[u.userId] = u.boardStatus;
        });
        setBoardedStatusMap((prev) => ({ ...prev, ...statusMap }));
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleToggleBoard = async (e, userId) => {
    e.stopPropagation();
    try {
      const prevStatus = boardedStatusMap[userId] || "none";
      const desiredAction =
        prevStatus === "requested"
          ? "cancel"
          : prevStatus === "boarded"
          ? "unboard"
          : "request";
      const optimisticStatus = desiredAction === "request" ? "requested" : "none";

      if (optimisticStatus === "requested") {
        pulse.boardRequested();
      } else {
        pulse.boardRejected();
      }

      setBoardedStatusMap((prev) => ({ ...prev, [userId]: optimisticStatus }));
      setIsActionLoading((prev) => ({ ...prev, [userId]: true }));

      const res = await axios.post(`${API_BASE}/${userId}/board`, { action: desiredAction }, { withCredentials: true });
      const newStatus = res.data.status;
      if (newStatus === "boarded") {
        pulse.boardAccepted();
      }
      const finalStatus = newStatus === "cancelled" || newStatus === "unboarded" ? "none" : newStatus;
      setBoardedStatusMap((prev) => ({ ...prev, [userId]: finalStatus }));
      if (onBoardStatusChange) {
        onBoardStatusChange(userId, finalStatus);
      }
    } catch (err) {
      console.error("Failed to board user:", err);
      setBoardedStatusMap((prev) => ({ ...prev, [userId]: prevStatus }));
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" && query.trim()) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm md:max-w-md">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <i className="fa-solid fa-magnifying-glass absolute left-3.5 text-slate-400 text-xs pointer-events-none"></i>
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search people, crews, boards, experiences..."
          className="w-full pl-9 pr-12 py-2 rounded-2xl border border-slate-200/80 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none text-xs transition-all placeholder:text-slate-400"
        />

        {/* Loading Spinner, Command Badge, or Clear Button */}
        <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 pointer-events-auto p-1 cursor-pointer"
            >
              <i className="fa-solid fa-circle-xmark text-xs"></i>
            </button>
          ) : (
            <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Floating Search Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Crew Matches</span>
            <span>{results.length} found</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading && results.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <span>Searching onboarded crew...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2 text-sm">
                  <i className="fa-solid fa-user-slash"></i>
                </div>
                <p className="font-semibold text-slate-700">No crew members found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different name or @handle</p>
              </div>
            ) : (
              results.map((user) => {
                const currentStatus = boardedStatusMap[user.userId] || user.boardStatus;
                const isWorking = isActionLoading[user.userId];

                return (
                  <div
                    key={user.userId}
                    className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <img
                          src={user.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt={user.userName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        {currentStatus === "boarded" && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {user.name}
                          </h4>
                          <span className="text-[11px] text-indigo-600 font-medium">
                            @{user.userName}
                          </span>
                        </div>

                        {user.bio && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {user.bio}
                          </p>
                        )}

                        {user.mutualCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
                            <i className="fa-solid fa-user-group text-[9px]"></i>
                            {user.mutualCount} mutual crew
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Direct Onboard / Action Button */}
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={(e) => handleToggleBoard(e, user.userId)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                          currentStatus === "boarded"
                            ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200"
                            : currentStatus === "requested"
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                            : currentStatus === "incoming_request"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                        }`}
                      >
                        {isWorking ? (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        ) : currentStatus === "boarded" ? (
                          <>
                            <i className="fa-solid fa-check text-[10px]"></i>
                            <span>Crew</span>
                          </>
                        ) : currentStatus === "requested" ? (
                          <>
                            <i className="fa-solid fa-clock text-[10px]"></i>
                            <span>Requested</span>
                          </>
                        ) : currentStatus === "incoming_request" ? (
                          <>
                            <i className="fa-solid fa-user-check text-[10px]"></i>
                            <span>Accept</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-user-plus text-[10px]"></i>
                            <span>Board</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation */}
          {results.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <span>Explore all crew results for "{query.trim()}"</span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearchDropdown;
