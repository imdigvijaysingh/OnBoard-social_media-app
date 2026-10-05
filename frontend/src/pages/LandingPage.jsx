import React, { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "fa-solid fa-users",
    title: "Build Your Network",
    desc: "Connect with like-minded people, follow creators, and grow a community that actually matters to you.",
  },
  {
    icon: "fa-solid fa-images",
    title: "Share Moments",
    desc: "Post photos with rich captions and let your story unfold in a clean, distraction-free feed.",
  },
  {
    icon: "fa-solid fa-comments",
    title: "Real Conversations",
    desc: "Comment, react, and engage in meaningful threads — not an algorithmic noise machine.",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "Privacy First",
    desc: "Your data belongs to you. No hidden tracking, no shady ad targeting — just a clean social space.",
  },
];

const STATS = [
  { value: "10K+", label: "Active Users" },
  { value: "50K+", label: "Posts Shared" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "User Rating" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  // Subtle parallax on hero blobs
  useEffect(() => {
    const handleMouse = (e) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const xPct = (clientX / innerWidth - 0.5) * 20;
      const yPct = (clientY / innerHeight - 0.5) * 20;
      heroRef.current.style.setProperty("--mx", `${xPct}px`);
      heroRef.current.style.setProperty("--my", `${yPct}px`);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-4 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/60">
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <img 
            src="/favicon.svg" 
            alt="OnBoard" 
            className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300"
          />
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            OnBoard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer" 
            onClick={() => navigate("/auth")}
          >
            Sign In
          </button>
          <button 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate("/auth")}
          >
            <span>Get Started</span>
            <i className="fa-solid fa-arrow-right text-xs"></i>
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col lg:flex-row items-center justify-between gap-12 px-6 sm:px-12 pt-12 pb-8 max-w-full mx-auto" ref={heroRef}>
        {/* Animated gradient blobs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-2xl text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-6 shadow-sm">
            <i className="fa-solid fa-bolt text-xs"></i> The social platform reimagined
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            Connect, Share &amp;
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
              Build Your Network
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
            A clean, distraction-free social space built for real conversations
            and genuine connections. No algorithms. No noise. Just you and your
            people.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-10">
            <button 
              className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer" 
              onClick={() => navigate("/auth")}
            >
              <span>Start for Free</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
            <button 
              className="px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-base transition-all shadow-sm hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer" 
              onClick={() => navigate("/auth")}
            >
              <i className="fa-regular fa-circle-play text-indigo-600 text-lg"></i>
              <span>See how it works</span>
            </button>
          </div>

          {/* Mini social proof */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2.5">
              {[
                { name: "Elena Rostova", src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
                { name: "Chloe Chen", src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
                { name: "Maya Lin", src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80" },
                { name: "Sarah Mitchell", src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80" },
              ].map((user, i) => (
                <img 
                  key={i} 
                  src={user.src}
                  alt={user.name}
                  title={user.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-100"
                />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              <strong className="text-slate-900 font-bold">10,000+</strong> people already on board
            </p>
          </div>
        </div>

        {/* Hero visual card */}
        <div className="relative z-10 w-full max-w-md lg:max-w-lg mx-auto flex-1">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-indigo-500/10">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-slate-400 ml-2">onboard.social / feed</span>
            </div>
            <div className="p-4 bg-slate-50/50 flex gap-4">
              <div className="w-16 flex flex-col gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 mb-2"></div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 w-full rounded-md bg-slate-200"></div>
                ))}
              </div>
              <div className="flex-1 space-y-3">
                {[
                  {
                    name: "Elena Rostova",
                    handle: "@elenarostova",
                    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80",
                    likes: "1.2k",
                  },
                  {
                    name: "Chloe Chen",
                    handle: "@chloechen",
                    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
                    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80",
                    likes: "894",
                  },
                ].map((postItem, i) => (
                  <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <img 
                        src={postItem.avatar} 
                        alt={postItem.name} 
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-800 leading-tight">{postItem.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{postItem.handle}</div>
                      </div>
                    </div>
                    <img 
                      src={postItem.image} 
                      alt="Post visual" 
                      className="w-full object-cover rounded-xl" 
                      style={{ height: i === 0 ? 95 : 75 }} 
                    />
                    <div className="flex items-center justify-between pt-1 text-slate-400 text-xs px-1">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-rose-500 font-semibold"><i className="fa-solid fa-heart text-xs"></i> {postItem.likes}</span>
                        <span className="hover:text-slate-600"><i className="fa-regular fa-comment"></i></span>
                        <span className="hover:text-slate-600"><i className="fa-solid fa-share"></i></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating chips */}
          <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-100 text-xs font-bold text-slate-800 flex items-center gap-2 animate-bounce duration-1000">
            <i className="fa-solid fa-heart text-red-500"></i> 2.4k Likes
          </div>
          <div className="absolute top-1/2 -left-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-100 text-xs font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-user-plus text-indigo-600"></i> +38 Crew
          </div>
          <div className="absolute -bottom-4 right-10 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-100 text-xs font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-comment text-emerald-500"></i> New comment
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="max-w-6xl mx-auto px-6 py-14 border-y border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {STATS.map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {s.value}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-block text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3.5 py-1 rounded-full mb-3 border border-indigo-100">
          Why OnBoard?
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-14">
          Everything you need,
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            nothing you don't
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {FEATURES.map((f, i) => (
            <div 
              key={i} 
              className="bg-white p-7 rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-xl mb-5 transition-colors shadow-sm">
                <i className={f.icon}></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Ready to get on board?</h2>
            <p className="text-sm sm:text-base text-indigo-100 mb-8 leading-relaxed">
              Join thousands of people who chose a better, distraction-free social experience.
            </p>
            <button 
              className="px-8 py-4 bg-white text-indigo-700 hover:bg-slate-50 font-bold rounded-2xl text-base shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all inline-flex items-center gap-2 cursor-pointer" 
              onClick={() => navigate("/auth")}
            >
              <span>Create Free Account</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-6 text-center">
        <span 
          className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent cursor-pointer inline-block mb-4" 
          onClick={() => navigate("/")}
        >
          OnBoard
        </span>
        <div className="flex gap-6 justify-center items-center flex-wrap text-sm font-semibold text-slate-600 mb-6">
          <Link to="/blogs" className="hover:text-indigo-600 transition-colors">Blog</Link>
          <Link to="/developer" className="hover:text-indigo-600 transition-colors">Developer</Link>
          <Link to="/privacy-policy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
        </div>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} OnBoard Social • Created &amp; Designed by{" "}
          <Link to="/developer" className="text-slate-600 hover:text-indigo-600 underline font-semibold transition-colors">
            Digvijay Singh
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
