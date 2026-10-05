import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import CreateSquadModal from "../components/CreateSquadModal";
import SquadDetailModal from "../components/SquadDetailModal";
import { useSidebar } from "../context/SidebarContext";

const SQUAD_CATEGORIES = [
  "All",
  "Technology",
  "Fitness",
  "Design",
  "Gaming",
  "Music",
  "Photography",
  "Coding",
  "Startups",
];

const Squads = () => {
  const { isCollapsed } = useSidebar();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("recommended"); // "recommended" | "mine" | "explore"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSquadId, setSelectedSquadId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [joinActionId, setJoinActionId] = useState(null);

  const fetchSquads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};

      if (activeTab === "mine") {
        params.filter = "mine";
      } else if (activeTab === "recommended") {
        params.filter = "recommended";
      }

      if (selectedCategory && selectedCategory !== "All") {
        params.category = selectedCategory.toLowerCase();
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await axios.get("http://localhost:3000/api/squads", {
        params,
        withCredentials: true,
      });

      setSquads(res.data.squads || []);
    } catch (err) {
      console.error("Failed to fetch squads:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchSquads();
  }, [fetchSquads]);

  const handleOpenSquad = (squadId) => {
    setSelectedSquadId(squadId);
    setIsDetailOpen(true);
  };

  const handleQuickJoin = async (e, squadId) => {
    e.stopPropagation();
    setJoinActionId(squadId);
    try {
      await axios.post(
        `http://localhost:3000/api/squads/${squadId}/join`,
        {},
        { withCredentials: true }
      );
      // Refresh list
      fetchSquads();
    } catch (err) {
      console.error("Quick join error:", err);
    } finally {
      setJoinActionId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Container */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
      }`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <i className="fa-solid fa-bars text-lg"></i>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>⚓ Squads & Fleets</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 hidden sm:inline-block">
                  Communities
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Discover interest communities, lead as Captain, and chat with your squad.
              </p>
            </div>
          </div>

          {/* Create Squad Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Create Squad</span>
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Hero Banner with Nautical Theme */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-300 text-xs font-semibold mb-3 border border-white/10">
                <span>🧭</span>
                <span>Tailored Interest Recommendations</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                Sail Together in Topic-Driven Squads
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect with accounts passionate about the same crafts. Create public or invite-only squads, broadcast as Captain, assign Co-Captains, and spark group discussions.
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Search Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab("recommended")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "recommended"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>✨ Recommended</span>
              </button>

              <button
                onClick={() => setActiveTab("mine")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "mine"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>⚓ My Squads</span>
              </button>

              <button
                onClick={() => setActiveTab("explore")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "explore"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🧭 Explore All</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search squads by name, tags..."
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills (Explore mode) */}
          {activeTab === "explore" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SQUAD_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Squads Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-500"></i>
              <span className="text-xs font-medium">Navigating the fleet...</span>
            </div>
          ) : squads.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
                ⚓
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {activeTab === "mine"
                  ? "You haven't joined any squads yet"
                  : activeTab === "recommended"
                  ? "No matching recommended squads yet"
                  : "No squads found"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                {activeTab === "mine"
                  ? "Explore squads with topics you love or launch your own fleet as Captain!"
                  : "Try clearing search filters or create a squad for your favorite interest."}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
              >
                + Create First Squad
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {squads.map((squad) => {
                const isQuickJoining = joinActionId === squad._id;

                return (
                  <div
                    key={squad._id}
                    onClick={() => handleOpenSquad(squad._id)}
                    className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col group"
                  >
                    {/* Card Banner */}
                    <div className="relative h-24 bg-slate-900 overflow-hidden">
                      <img
                        src={squad.banner || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80"}
                        alt={squad.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                      {/* Privacy & Member count badge */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10">
                          {squad.privacy === "invite_only" ? "🔒 Invite" : "🌐 Public"}
                        </span>
                      </div>

                      {/* Role badge if member */}
                      {squad.isMember && (
                        <div className="absolute top-2.5 left-2.5">
                          {squad.myRole === "captain" ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center gap-1 shadow-xs">
                              👑 Captain
                            </span>
                          ) : squad.myRole === "co_captain" ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500 text-white flex items-center gap-1 shadow-xs">
                              ⭐ Co-Captain
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                              ⚓ Crew
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Avatar & Title */}
                        <div className="flex items-start gap-3 -mt-7 mb-2">
                          <img
                            src={squad.avatar || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80"}
                            alt={squad.name}
                            className="w-12 h-12 rounded-2xl border-2 border-white object-cover shadow-sm bg-white shrink-0"
                          />
                          <div className="min-w-0 pt-3">
                            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {squad.name}
                            </h3>
                            <span className="text-[11px] text-slate-400 block truncate">
                              @{squad.handle}
                            </span>
                          </div>
                        </div>

                        {/* Tagline / Description */}
                        {squad.tagline && (
                          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                            {squad.tagline}
                          </p>
                        )}

                        {/* Category Tags */}
                        {squad.categoryTags && squad.categoryTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {squad.categoryTags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                              >
                                #{tag}
                              </span>
                            ))}
                            {squad.categoryTags.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{squad.categoryTags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer: Captain info & Action */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <i className="fa-solid fa-users text-indigo-500"></i>
                          <span>
                            {squad.membersCount} Member{squad.membersCount === 1 ? "" : "s"}
                          </span>
                        </div>

                        {squad.isMember ? (
                          <span className="text-indigo-600 font-bold flex items-center gap-1 text-xs group-hover:translate-x-0.5 transition-transform">
                            <span>Open Deck</span>
                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleQuickJoin(e, squad._id)}
                            disabled={isQuickJoining}
                            className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-xs font-bold transition-all shadow-2xs"
                          >
                            {isQuickJoining ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              "Join"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateSquadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSquadCreated={(newSquad) => {
          fetchSquads();
          handleOpenSquad(newSquad._id);
        }}
      />

      <SquadDetailModal
        isOpen={isDetailOpen}
        squadId={selectedSquadId}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSquadId(null);
        }}
        onSquadUpdated={fetchSquads}
      />
    </div>
  );
};

export default Squads;
