import React from "react";
import { useNavigate, Link } from "react-router-dom";
import useSEO from "../utils/useSEO";
import ProfilePhoto from "../assets/profile.jpg";

const Developer = () => {
  const navigate = useNavigate();

  // SEO Optimization
  useSEO({
    title: "About the Developer - Digvijay Singh",
    description: "Meet Digvijay Singh, the creator, full-stack engineer, and UI/UX designer behind OnBoard. Learn about the tech stack, architectural decisions, and vision behind the platform.",
    keywords: "Digvijay Singh, OnBoard developer, MERN stack engineer, social media architecture, React developer, Node.js",
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-800 flex justify-center p-4 sm:p-8 md:py-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl flex flex-col gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
        
        {/* Header & Breadcrumbs */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <h1 
            className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent bg-white px-5 py-1.5 rounded-full shadow-lg cursor-pointer tracking-tight"
            onClick={() => navigate("/")} 
            title="OnBoard Homepage"
          >
            OnBoard
          </h1>
          <nav className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md" aria-label="Breadcrumb">
            <button
              onClick={() => navigate("/")}
              className="bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white px-3.5 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Back to Homepage"
            >
              <i className="fa-solid fa-arrow-left text-[10px]"></i>
              <span>Back to Home</span>
            </button>
            <span className="text-white/60">
              <i className="fa-solid fa-chevron-right text-[9px]"></i>
            </span>
            <span className="bg-white text-slate-800 px-3 py-1 rounded-full font-semibold shadow-sm">Developer</span>
          </nav>
        </header>

        {/* ── HERO PROFILE CARD ── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/80">
          <div className="h-36 sm:h-44 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 relative overflow-hidden">
            <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
          </div>
          
          <div className="px-6 sm:px-10 pb-8 sm:pb-10 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-16 sm:-mt-20 mb-6 gap-4">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-1.5 shadow-xl relative shrink-0">
                <img
                  src={ProfilePhoto}
                  alt="Digvijay Singh - Developer of OnBoard"
                  className="w-full h-full rounded-full object-cover bg-indigo-600"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hidden items-center justify-center text-3xl font-bold">
                  DS
                </div>
              </div>

              <div className="flex gap-2.5 flex-wrap">
                <a
                  href="https://github.com/imdigvijaysingh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-600 hover:bg-white hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  <i className="fa-brands fa-github text-sm"></i> GitHub
                </a>
                <a
                  href="https://linkedin.com/in/imdigvijaysingh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-600 hover:bg-white hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  <i className="fa-brands fa-linkedin text-sm"></i> LinkedIn
                </a>
                <a
                  href="mailto:onboardofficial@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 transition-all shadow-md shadow-indigo-600/25"
                >
                  <i className="fa-solid fa-envelope text-sm"></i> Contact Me
                </a>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Digvijay Singh</h1>
              <p className="text-sm sm:text-base font-medium text-slate-500 mt-1 mb-4">
                Creator, Full-Stack Developer &amp; UI/UX Designer of OnBoard
              </p>
              
              <div className="flex gap-2 flex-wrap mb-5">
                <span className="bg-indigo-50 text-indigo-700 px-3.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-indigo-100">
                  <i className="fa-solid fa-code text-[11px]"></i> Full-Stack MERN
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-3.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-indigo-100">
                  <i className="fa-solid fa-paint-brush text-[11px]"></i> UI/UX Design
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-3.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-indigo-100">
                  <i className="fa-solid fa-bolt text-[11px]"></i> System Architecture
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-3.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-indigo-100">
                  <i className="fa-solid fa-shield-halved text-[11px]"></i> Privacy-First
                </span>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
                Hi, I'm Digvijay Singh. I designed and built OnBoard from scratch to solve real social media fatigue. 
                As a developer passionate about performance, clean aesthetics, and user-centric systems, my goal was to engineer a platform where Gen Z can genuinely connect with their crew without algorithmic noise or privacy invasions.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: ABOUT THE CREATOR & VISION ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3.5 pb-4 mb-6 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-compass"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">1. The Vision &amp; Philosophy Behind OnBoard</h2>
          </div>
          <div className="text-sm sm:text-base text-slate-600 leading-relaxed space-y-4">
            <p>
              Traditional social platforms have evolved into algorithmic slot machines engineered to maximize time-on-screen rather than genuine human connection. With OnBoard, I wanted to strip away the vanity metrics, the dark UX patterns, and the endless commercial noise.
            </p>
            <div className="bg-slate-50 border-l-4 border-indigo-600 p-4 rounded-r-xl italic text-slate-800 font-medium">
              "I designed OnBoard with a single principle: Social media shouldn't feel like a high-pressure stage where you perform for strangers. It should feel like a comfortable living room where you share moments with your Crew."
            </div>
            <p>
              By replacing the one-way "follower" model with mutually accepted <strong className="text-slate-900">"Crew Members"</strong> and offering a 100% chronological timeline, OnBoard creates a digital sanctuary where users can post without anxiety.
            </p>
          </div>
        </section>

        {/* ── SECTION 2: TECH STACK & SYSTEM ARCHITECTURE ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3.5 pb-4 mb-6 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">2. Engineering Stack &amp; Architecture</h2>
          </div>
          <div className="text-sm sm:text-base text-slate-600 leading-relaxed">
            <p>
              OnBoard is engineered using the modern <strong className="text-slate-900">MERN</strong> ecosystem, optimized for sub-second page transitions, fast media processing, and hardened security.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-200 rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-2.5">
                  <i className="fa-brands fa-react text-2xl text-indigo-600"></i>
                  <h3 className="text-base font-bold text-slate-900">Frontend Core</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Built with React 19 and bundled via Vite for lightning-fast HMR and minimal client bundles.
                </p>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">React.js</span>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Vite</span>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Tailwind CSS</span>
                </div>
              </div>

              <div className="bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-200 rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-2.5">
                  <i className="fa-brands fa-node-js text-2xl text-emerald-600"></i>
                  <h3 className="text-base font-bold text-slate-900">Backend API</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Node.js &amp; Express.js powering high-throughput REST endpoints with atomic MongoDB updates.
                </p>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Node.js</span>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Express</span>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Mongoose</span>
                </div>
              </div>

              <div className="bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-200 rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-2.5">
                  <i className="fa-solid fa-shield-halved text-2xl text-indigo-600"></i>
                  <h3 className="text-base font-bold text-slate-900">Security &amp; Auth</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Stateless JWT tokens stored strictly in HttpOnly, SameSite cookies to eliminate XSS/CSRF vulnerabilities.
                </p>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">JWT</span>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">HttpOnly</span>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Bcrypt</span>
                </div>
              </div>

              <div className="bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-200 rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-2.5">
                  <i className="fa-solid fa-wand-magic-sparkles text-2xl text-purple-600"></i>
                  <h3 className="text-base font-bold text-slate-900">Styling &amp; Design</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Clean design system featuring fluid glassmorphism, responsive Tailwind utility tokens, and subtle micro-animations.
                </p>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Tailwind</span>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Glassmorphic</span>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Responsive</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: KEY ENGINEERED FEATURES ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3.5 pb-4 mb-6 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-gears"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">3. Key Features Engineered by Digvijay</h2>
          </div>
          <div className="text-sm sm:text-base text-slate-600 leading-relaxed">
            <p>
              Every interactive element in OnBoard was carefully architected to provide an intuitive, dopamine-hitting user experience:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <span className="inline-block bg-indigo-50 text-indigo-600 text-[11px] font-bold px-2.5 py-1 rounded-lg mb-3">
                  Media Pipeline
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">Client-Side Canvas Cropper</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Implemented an in-browser image cropping engine utilizing HTML5 Canvas. Users can adjust crops in real-time, compressing images on the client before dispatching to save user bandwidth.
                </p>
              </div>

              <div className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <span className="inline-block bg-indigo-50 text-indigo-600 text-[11px] font-bold px-2.5 py-1 rounded-lg mb-3">
                  Social Logic
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">Crew Boarding System</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  A multi-state connection architecture (requested, boarded, unboarded) built with atomic database operations to eliminate race conditions across simultaneous friend requests.
                </p>
              </div>

              <div className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <span className="inline-block bg-indigo-50 text-indigo-600 text-[11px] font-bold px-2.5 py-1 rounded-lg mb-3">
                  UX Optimization
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">Universal Scroll Restoration</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Engineered custom router listeners and a MutationObserver to ensure smooth auto-scroll to top whenever switching routes or opening modals, no matter where the user was on the page.
                </p>
              </div>

              <div className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <span className="inline-block bg-indigo-50 text-indigo-600 text-[11px] font-bold px-2.5 py-1 rounded-lg mb-3">
                  Interactive UI
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">Post Detail Lightbox</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Full-screen modal viewer with keyboard accessibility, inline comments, real-time like updates, and responsive card sizing for desktop and mobile.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: ROADMAP, OPEN SOURCE & CONTACT ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3.5 pb-4 mb-6 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-rocket"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">4. What's Next &amp; Get in Touch</h2>
          </div>
          <div className="text-sm sm:text-base text-slate-600 leading-relaxed">
            <p>
              OnBoard is continually evolving. Here is a glimpse of the features currently in development:
            </p>

            <ul className="space-y-4 my-6">
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">
                  <i className="fa-solid fa-check"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Core Social Feed &amp; Profile Engine</h4>
                  <p className="text-xs text-slate-500">Completed: Full post sharing, canvas cropping, likes, comments, and profile editing.</p>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">
                  <i className="fa-solid fa-spinner animate-spin"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">SEO Blog Engine &amp; Developer Hub</h4>
                  <p className="text-xs text-slate-500">In Progress: Editorial platform to share insights on Gen Z tech and social design.</p>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  <i className="fa-regular fa-circle"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Voice Notes &amp; Crew Lounges</h4>
                  <p className="text-xs text-slate-500">Upcoming: 5-second audio reaction comments and 2-hour spontaneous hangout rooms.</p>
                </div>
              </li>
            </ul>

            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Want to collaborate or discuss a project?</h3>
                <p className="text-xs text-slate-300">I'm always open to talking tech, full-stack opportunities, or design partnerships.</p>
              </div>
              <a 
                href="mailto:onboardofficial@gmail.com" 
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-xs inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 shrink-0"
              >
                <i className="fa-solid fa-paper-plane"></i> Send an Email
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="text-center py-4 text-xs text-slate-400 space-y-1">
          <p>
            Designed &amp; Developed with ❤️ by <strong className="text-white font-semibold">Digvijay Singh</strong> &copy; {new Date().getFullYear()} OnBoard.
          </p>
          <p className="space-x-3">
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 underline">Home</Link>
            <span>•</span>
            <Link to="/blogs" className="text-indigo-400 hover:text-indigo-300 underline">Blog</Link>
            <span>•</span>
            <Link to="/privacy-policy" className="text-indigo-400 hover:text-indigo-300 underline">Privacy Policy</Link>
          </p>
        </footer>

      </div>
    </div>
  );
};

export default Developer;
