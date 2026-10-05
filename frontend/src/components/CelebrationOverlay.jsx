import React, { useEffect, useRef } from "react";

export const CELEBRATION_TYPES = [
  {
    id: "birthday",
    label: "Birthday Party",
    icon: "🎂",
    colors: ["#ec4899", "#8b5cf6", "#3b82f6", "#f59e0b", "#10b981"],
    emojis: ["🎂", "🎈", "🎉", "🥳", "✨"],
    title: "Happy Birthday! 🎂🎈",
  },
  {
    id: "anniversary",
    label: "Anniversary & Milestone",
    icon: "🥂",
    colors: ["#fbbf24", "#f59e0b", "#d97706", "#fef08a", "#ffffff"],
    emojis: ["🥂", "✨", "💍", "💫", "💛"],
    title: "Celebrating Milestones! 🥂✨",
  },
  {
    id: "diwali",
    label: "Diwali Sparkles",
    icon: "🪔",
    colors: ["#f59e0b", "#ef4444", "#fbbf24", "#f97316", "#ffd700"],
    emojis: ["🪔", "✨", "🎆", "🎇", "🪅"],
    title: "Happy Diwali! 🪔✨",
  },
  {
    id: "holi",
    label: "Holi Colors",
    icon: "🎨",
    colors: ["#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    emojis: ["🎨", "🟣", "🟡", "🟢", "🔴", "✨"],
    title: "Happy Holi! Vibrant Colors 🎨✨",
  },
  {
    id: "eid",
    label: "Eid Mubarak",
    icon: "🌙",
    colors: ["#10b981", "#059669", "#34d399", "#fbbf24", "#fef08a"],
    emojis: ["🌙", "⭐", "✨", "🕌", "💚"],
    title: "Eid Mubarak! 🌙✨",
  },
  {
    id: "congrats",
    label: "Congratulations",
    icon: "🎉",
    colors: ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"],
    emojis: ["🎉", "🎊", "🏆", "🔥", "⚡"],
    title: "Congratulations! 🎉🔥",
  },
];

const CelebrationOverlay = ({ type, onComplete }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!type) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const celebrationConfig =
      CELEBRATION_TYPES.find((c) => c.id === type) || CELEBRATION_TYPES[0];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle system
    const particleCount = prefersReducedMotion ? 20 : 80;
    const particles = [];

    const colors = celebrationConfig.colors;
    const emojis = celebrationConfig.emojis;

    for (let i = 0; i < particleCount; i++) {
      const isEmoji = Math.random() < 0.35;
      particles.push({
        x: width * 0.1 + Math.random() * (width * 0.8),
        y: height + Math.random() * 50,
        vx: (Math.random() - 0.5) * 5,
        vy: -(Math.random() * 8 + 7),
        size: isEmoji ? Math.random() * 18 + 18 : Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        isEmoji,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15,
        gravity: 0.18,
        opacity: 1,
      });
    }

    const startTime = performance.now();
    const duration = 3200; // 3.2 seconds total budget

    const render = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vRot;
        p.opacity = Math.max(0, 1 - progress * 1.15);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;

        if (p.isEmoji) {
          ctx.font = `${p.size}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration + 100);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [type, onComplete]);

  if (!type) return null;

  const config =
    CELEBRATION_TYPES.find((c) => c.id === type) || CELEBRATION_TYPES[0];

  return (
    <div className="celebration-overlay-container" style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div className="celebration-banner-pill" style={styles.banner}>
        <span style={{ fontSize: "1.5rem" }}>{config.icon}</span>
        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{config.title}</span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: 99999,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "24px",
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  banner: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(15, 23, 42, 0.88)",
    backdropFilter: "blur(16px)",
    color: "#ffffff",
    padding: "10px 22px",
    borderRadius: "9999px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(84, 69, 255, 0.4)",
    animation: "celebrationSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  },
};

export default CelebrationOverlay;
