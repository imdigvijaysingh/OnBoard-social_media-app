import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MemberBadge from "../components/MemberBadge";
import { useSidebar } from "../context/SidebarContext";
import pulse from "../utils/pulseEngine";

const API_BASE = "http://localhost:3000/api/profile";

const SearchCrew = () => {
  const { isCollapsed } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'mutual' | 'available' | 'boarded'
  const [boardedStatusMap, setBoardedStatusMap] = useState({});
  const [isActionLoading, setIsActionLoading] = useState({});

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Sync state if URL query param changes
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams]);

  // Fetch users with debounce
  useEffect(() => {
    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const url = query.trim()
          ? `${API_BASE}/search?q=${encodeURIComponent(query.trim())}`
          : `${API_BASE}/search`;

        const res = await axios.get(url, { withCredentials: true });
        const list = res.data.users || [];
        setUsers(list);

        const statusMap = {};
        list.forEach((u) => {
          statusMap[u.userId] = u.boardStatus;
        });
        setBoardedStatusMap((prev) => ({ ...prev, ...statusMap }));
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleQueryChange = (e) => {
    const nextVal = e.target.value;
    setQuery(nextVal);
    if (nextVal.trim()) {
      setSearchParams({ q: nextVal });
    } else {
      setSearchParams({});
    }
  };

  const handleClearQuery = () => {
    setQuery("");
    setSearchParams({});
  };

  const handleToggleBoard = async (userId) => {
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
      setBoardedStatusMap((prev) => ({
        ...prev,
        [userId]: newStatus === "cancelled" || newStatus === "unboarded" ? "none" : newStatus,
      }));
    } catch (err) {
      console.error("Failed to board user:", err);
      setBoardedStatusMap((prev) => ({ ...prev, [userId]: prevStatus }));
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Filter results
  const filteredUsers = users.filter((u) => {
    const status = boardedStatusMap[u.userId] || u.boardStatus;
    if (activeFilter === "mutual") return (u.mutualCount || 0) > 0;
    if (activeFilter === "available") return status === "none";
    if (activeFilter === "boarded") return status === "boarded";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Docked Sidebar on Desktop, Drawer on Mobile */}
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      <main className={`flex-1 min-w-0 min-h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
      }`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden text-slate-700 text-lg p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧭</span>
              <h1 className="text-lg font-bold text-slate-900">Discover Crew</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/feed"
              className="text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-full transition-colors flex items-center gap-1.5"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Back to Feed</span>
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full flex-1 flex flex-col">
          {/* Search Hero Box */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-indigo-600/15 mb-8 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide text-indigo-100 mb-3 border border-white/20">
                <i className="fa-solid fa-sparkles text-[11px]"></i>
                OnBoard Social Network
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
                Find Your Crew
              </h2>
              <p className="text-indigo-100 text-xs sm:text-sm mb-6 leading-relaxed">
                Connect with creators, friends, and travelers. Search by name, @handle, or interests to onboard them to your network.
              </p>

              {/* Prominent Search Bar */}
              <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden bg-white text-slate-800">
                <i className="fa-solid fa-magnifying-glass absolute left-4 text-slate-400 text-sm"></i>
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search crew by full name, @username, or keywords..."
                  className="w-full pl-11 pr-10 py-3.5 sm:py-4 text-xs sm:text-sm bg-transparent outline-none focus:ring-0 placeholder:text-slate-400 text-slate-900"
                />
                {isLoading ? (
                  <div className="absolute right-4 w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                ) : query ? (
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 text-sm p-1 rounded-full transition-colors cursor-pointer"
                    aria-label="Clear query"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: "All Crew", icon: "fa-solid fa-users" },
                { id: "mutual", label: "Mutual Crew", icon: "fa-solid fa-user-group" },
                { id: "available", label: "Ready to Board", icon: "fa-solid fa-user-plus" },
                { id: "boarded", label: "My Crew", icon: "fa-solid fa-check" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeFilter === filter.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <i className={`${filter.icon} text-[11px]`}></i>
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{filteredUsers.length}</strong> {filteredUsers.length === 1 ? "member" : "members"}
            </span>
          </div>

          {/* Results Grid */}
          {isLoading && users.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs animate-pulse">
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-4/5 mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded-full w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs my-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-inner">
                <i className="fa-solid fa-compass"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {query ? `No crew found for "${query}"` : "No members found in this category"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                {query
                  ? "Try checking your spelling, searching by first or last name, or discovering new crew members without any filters."
                  : "Try clearing your filters or exploring recommended members."}
              </p>
              {query && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Clear Search & View All
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((user) => {
                const currentStatus = boardedStatusMap[user.userId] || user.boardStatus;
                const isWorking = isActionLoading[user.userId];

                return (
                  <div
                    key={user.userId}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-100 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top User Info (Clickable to view profile) */}
                      <div className="flex items-start gap-3.5 mb-3">
                        <Link
                          to={`/user/${user.userId}`}
                          className="relative flex-shrink-0 group/avatar"
                          title="View Profile"
                        >
                          <img
                            src={user.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt={user.userName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs group-hover/avatar:scale-105 transition-transform"
                          />
                          {currentStatus === "boarded" && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white"
                              title="Active Crew Member"
                            >
                              <i className="fa-solid fa-check"></i>
                            </span>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={`/user/${user.userId}`}
                              className="text-sm font-bold text-slate-900 truncate hover:text-indigo-600 transition-colors"
                            >
                              {user.name}
                            </Link>
                            <MemberBadge tier={user.membershipTier} size="xs" />
                            {user.isOfficialVerified && (
                              <span
                                className="inline-flex items-center text-indigo-600 text-xs"
                                title="Official Verified Tick"
                              >
                                <i className="fa-solid fa-circle-check"></i>
                              </span>
                            )}
                            {user.isPrivate && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200"
                                title="Private Account"
                              >
                                <i className="fa-solid fa-lock text-[9px] text-slate-400"></i>
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/user/${user.userId}`}
                            className="text-xs text-indigo-600 font-semibold truncate block hover:underline"
                          >
                            @{user.userName}
                          </Link>

                          {user.mutualCount > 0 && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <i className="fa-solid fa-user-group text-[9px]"></i>
                                {user.mutualCount} mutual crew
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 min-h-[36px]">
                        {user.bio || "Member of the OnBoard community ✨"}
                      </p>

                      {/* Stat chips */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <i className="fa-solid fa-image text-slate-400 text-[10px]"></i>
                          <strong>{user.postCount || 0}</strong> posts
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {currentStatus === "boarded" ? "Crew" : "Community"}
                        </span>
                        {user.isPrivate && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <i className="fa-solid fa-lock text-[9px]"></i> Private
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        to={`/user/${user.userId}`}
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <i className="fa-regular fa-id-card text-[11px]"></i>
                        <span>View Profile</span>
                      </Link>

                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => handleToggleBoard(user.userId)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                          currentStatus === "boarded"
                            ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200"
                            : currentStatus === "requested"
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                            : currentStatus === "incoming_request"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30"
                        }`}
                      >
                        {isWorking ? (
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        ) : currentStatus === "boarded" ? (
                          <>
                            <i className="fa-solid fa-check text-[11px]"></i>
                            <span>Boarded</span>
                          </>
                        ) : currentStatus === "requested" ? (
                          <>
                            <i className="fa-solid fa-clock text-[11px]"></i>
                            <span>Requested</span>
                          </>
                        ) : currentStatus === "incoming_request" ? (
                          <>
                            <i className="fa-solid fa-user-check text-[11px]"></i>
                            <span>Accept</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-user-plus text-[11px]"></i>
                            <span>Board Crew</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchCrew;
