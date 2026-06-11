import React, { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/LandingPage.css";

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
    <div className="lp-root">
      {/* ── NAVBAR ── */}
      <nav className="lp-nav">
        <span className="lp-nav-logo">OnBoard</span>
        <div className="lp-nav-actions">
          <button className="lp-nav-link" onClick={() => navigate("/auth")}>
            Sign In
          </button>
          <button className="lp-cta-btn" onClick={() => navigate("/auth")}>
            Get Started <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-blob lp-blob-1" />
        <div className="lp-hero-blob lp-blob-2" />
        <div className="lp-hero-blob lp-blob-3" />

        <div className="lp-hero-content">
          <div className="lp-badge">
            <i className="fa-solid fa-bolt"></i> The social platform reimagined
          </div>

          <h1 className="lp-hero-title">
            Connect, Share &amp;
            <br />
            <span className="lp-gradient-text">Build Your Network</span>
          </h1>

          <p className="lp-hero-sub">
            A clean, distraction-free social space built for real conversations
            and genuine connections. No algorithms. No noise. Just you and your
            people.
          </p>

          <div className="lp-hero-btns">
            <button className="lp-cta-btn lp-cta-large" onClick={() => navigate("/auth")}>
              Start for Free <i className="fa-solid fa-arrow-right"></i>
            </button>
            <button className="lp-ghost-btn" onClick={() => navigate("/auth")}>
              <i className="fa-regular fa-circle-play"></i> See how it works
            </button>
          </div>

          {/* Mini social proof */}
          <div className="lp-proof">
            <div className="lp-proof-avatars">
              {["V", "R", "C", "H", "D"].map((l, i) => (
                <span key={i} className="lp-avatar-chip" style={{ zIndex: 5 - i }}>
                  {l}
                </span>
              ))}
            </div>
            <p>
              <strong>10,000+</strong> people already on board
            </p>
          </div>
        </div>

        {/* Hero visual card */}
        <div className="lp-hero-visual">
          <div className="lp-app-mockup">
            <div className="lp-mockup-bar">
              <span className="lp-dot lp-dot-red" />
              <span className="lp-dot lp-dot-yellow" />
              <span className="lp-dot lp-dot-green" />
              <span className="lp-mockup-url">onboard.social / feed</span>
            </div>
            <div className="lp-mockup-body">
              <div className="lp-mockup-sidebar">
                <div className="lp-ms-logo" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="lp-ms-item" />
                ))}
              </div>
              <div className="lp-mockup-feed">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="lp-mockup-post">
                    <div className="lp-mp-header">
                      <div className="lp-mp-avatar" />
                      <div className="lp-mp-meta">
                        <div className="lp-mp-name" />
                        <div className="lp-mp-handle" />
                      </div>
                    </div>
                    <div className="lp-mp-img" style={{ height: i === 0 ? 80 : 60 }} />
                    <div className="lp-mp-actions">
                      <span><i className="fa-regular fa-thumbs-up" /></span>
                      <span><i className="fa-regular fa-comment" /></span>
                      <span><i className="fa-solid fa-share" /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating chips */}
          <div className="lp-chip lp-chip-1">
            <i className="fa-solid fa-heart" style={{ color: "#f43f5e" }} /> 2.4k Likes
          </div>
          <div className="lp-chip lp-chip-2">
            <i className="fa-solid fa-user-plus" style={{ color: "#5445FF" }} /> +38 Followers
          </div>
          <div className="lp-chip lp-chip-3">
            <i className="fa-solid fa-comment" style={{ color: "#10b981" }} /> New comment
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="lp-stats">
        {STATS.map((s, i) => (
          <div key={i} className="lp-stat-item">
            <span className="lp-stat-value">{s.value}</span>
            <span className="lp-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features">
        <div className="lp-section-label">Why OnBoard?</div>
        <h2 className="lp-section-title">
          Everything you need,
          <br />
          <span className="lp-gradient-text">nothing you don't</span>
        </h2>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="lp-feature-card">
              <div className="lp-feature-icon">
                <i className={f.icon}></i>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-banner">
        <div className="lp-cta-blob" />
        <div className="lp-cta-inner">
          <h2>Ready to get on board?</h2>
          <p>Join thousands of people who chose a better social experience.</p>
          <button className="lp-cta-btn lp-cta-large lp-cta-white" onClick={() => navigate("/auth")}>
            Create Free Account <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <span className="lp-nav-logo lp-footer-logo">OnBoard</span>
        <div className="lp-footer-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
        <p className="lp-footer-copy">© 2026 OnBoard Social. Built for creators.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
