import { useNavigate, Link } from "react-router-dom";

const sections = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This includes:`,
    bullets: [
      "Name, email address, and password when you register",
      "Profile information such as a bio, profile photo, and social links",
      "Content you post, including text, images, and interactions",
      "Communications you send us via support or feedback channels",
    ],
  },
  {
    id: "how-we-use",
    title: "2. How We Use Your Information",
    content: `We use the information we collect to operate, maintain, and improve OnBoard. Specifically, we use it to:`,
    bullets: [
      "Provide, personalize, and improve our platform and services",
      "Send transactional emails such as account verification and notifications",
      "Monitor and analyze usage patterns to improve user experience",
      "Detect, investigate, and prevent fraudulent or unauthorized activity",
    ],
  },
  {
    id: "sharing",
    title: "3. Sharing of Information",
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following limited circumstances:`,
    bullets: [
      "With your consent or at your direction",
      "With service providers who assist us in operating our platform",
      "To comply with legal obligations or respond to lawful requests",
      "In connection with a merger, acquisition, or sale of assets",
    ],
  },
  {
    id: "cookies",
    title: "4. Cookies & Tracking",
    content: `OnBoard uses cookies and similar tracking technologies to enhance your experience. These include:`,
    bullets: [
      "Session cookies to keep you logged in securely",
      "Preference cookies to remember your settings",
      "Analytics cookies to understand how users interact with our platform",
      "You may disable cookies through your browser settings, though some features may be affected",
    ],
  },
  {
    id: "data-security",
    title: "5. Data Security",
    content: `We take the security of your personal information seriously. We implement industry-standard measures including:`,
    bullets: [
      "Encrypted data transmission via HTTPS/TLS",
      "Hashed and salted password storage — we never store plaintext passwords",
      "Regular security audits and vulnerability assessments",
      "Strict internal access controls on user data",
    ],
  },
  {
    id: "your-rights",
    title: "6. Your Rights",
    content: `Depending on your location, you may have certain rights regarding your personal data, including:`,
    bullets: [
      "The right to access and receive a copy of your data",
      "The right to correct inaccurate or incomplete information",
      "The right to request deletion of your account and associated data",
      "The right to opt out of certain types of data processing",
    ],
  },
  {
    id: "changes",
    title: "7. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. When we make material changes, we will notify you by email or via a prominent notice on our platform. We encourage you to review this page periodically.`,
    bullets: [],
  },
  {
    id: "contact",
    title: "8. Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please reach out to us at:`,
    bullets: ["Email: onboardofficial@gmail.com"],
  },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-800 flex items-start justify-center p-4 sm:p-8 md:py-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-6 sm:px-10 border-b border-slate-100 gap-4 flex-wrap bg-white">
          <h1 
            className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent cursor-pointer tracking-tight"
            onClick={() => navigate("/")} 
            title="OnBoard Homepage"
          >
            OnBoard
          </h1>
          <nav className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm" aria-label="Breadcrumb">
            <button
              onClick={() => navigate("/")}
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Back to Homepage"
            >
              <i className="fa-solid fa-arrow-left text-[11px]"></i>
              <span>Back to Home</span>
            </button>
            <span className="text-slate-300">
              <i className="fa-solid fa-chevron-right text-[9px]"></i>
            </span>
            <span className="text-slate-700">Privacy Policy</span>
          </nav>
        </header>

        {/* Hero Banner */}
        <div className="p-8 sm:p-12 text-center border-b border-slate-100 bg-gradient-to-b from-indigo-50/60 to-white">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
              <path
                d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2Z"
                stroke="#4F46E5"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#4F46E5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Your Privacy Matters
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            At OnBoard, we are committed to protecting your personal information
            and being transparent about how we use it. This policy was last
            updated on <strong className="text-indigo-600 font-semibold">April 19, 2026</strong>.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="p-6 sm:px-10 border-b border-slate-100 bg-slate-50/60">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Jump to section
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a 
                key={s.id} 
                href={`#${s.id}`} 
                className="text-xs font-semibold text-indigo-600 bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-600 hover:text-white px-3.5 py-1.5 rounded-full transition-all shadow-sm"
              >
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Sections Content */}
        <div className="p-6 sm:p-10 divide-y divide-slate-100 bg-white">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="py-8 first:pt-0 last:pb-0 scroll-mt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2.5 before:content-[''] before:w-1 before:h-5 before:bg-indigo-600 before:rounded-full">
                {s.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {s.content}
              </p>
              {s.bullets.length > 0 && (
                <ul className="mt-4 space-y-2.5">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="p-6 sm:px-10 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} OnBoard • Created by{" "}
            <Link to="/developer" className="text-slate-700 font-semibold underline hover:text-indigo-600 transition-colors">
              Digvijay Singh
            </Link>
          </p>
          <div className="flex gap-4 items-center flex-wrap justify-center font-medium">
            <Link to="/" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              Home
            </Link>
            <Link to="/blogs" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              Blog
            </Link>
            <Link to="/developer" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              Developer
            </Link>
            <button 
              className="border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
              onClick={() => navigate(-1)}
            >
              ← Go Back
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
