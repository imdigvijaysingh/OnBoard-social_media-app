import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BLOG_POSTS } from "../data/blogData";
import useSEO from "../utils/useSEO";
import ProfilePhoto from "../assets/profile.jpg";

const CATEGORIES = ["All", "Culture", "Engineering", "Product", "Privacy"];

const Blogs = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copied, setCopied] = useState(false);

  // If a slug is present, find the article
  const currentArticle = slug
    ? BLOG_POSTS.find((p) => p.slug === slug)
    : null;

  // SEO setup
  useSEO({
    title: currentArticle
      ? `${currentArticle.title}`
      : "Blogs & Stories - The OnBoard Publication",
    description: currentArticle
      ? currentArticle.metaDescription
      : "Read the latest essays, engineering deep-dives, and social media culture commentary from the creators of OnBoard.",
    keywords: currentArticle
      ? currentArticle.tags.join(", ")
      : "OnBoard blog, Gen Z social media, anti-algorithm, tech essays, Digvijay Singh",
    author: currentArticle ? currentArticle.author : "Digvijay Singh",
  });

  // Filter articles for directory view
  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  // Handle share article
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to parse basic markdown content into structured JSX
  const renderFormattedContent = (content) => {
    const lines = content.trim().split("\n");
    const elements = [];
    let inList = false;
    let listItems = [];
    let inCode = false;
    let codeLines = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-6 my-4 space-y-2 text-slate-700">
            {listItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushCode = () => {
      if (inCode && codeLines.length > 0) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto font-mono text-xs my-6">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCode = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Code blocks
      if (trimmed.startsWith("```")) {
        if (inCode) {
          flushCode();
        } else {
          flushList();
          inCode = true;
        }
        return;
      }

      if (inCode) {
        codeLines.push(line);
        return;
      }

      // Horizontal Rule
      if (trimmed === "---") {
        flushList();
        elements.push(<hr key={`hr-${idx}`} className="border-t border-slate-200 my-8" />);
        return;
      }

      // Headers
      if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(<h3 key={`h3-${idx}`} className="text-xl font-bold text-slate-900 mt-8 mb-3 tracking-tight">{trimmed.replace("### ", "")}</h3>);
        return;
      }
      if (trimmed.startsWith("#### ")) {
        flushList();
        elements.push(<h4 key={`h4-${idx}`} className="text-lg font-bold text-slate-800 mt-6 mb-2">{trimmed.replace("#### ", "")}</h4>);
        return;
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        flushList();
        elements.push(
          <blockquote key={`quote-${idx}`} className="bg-slate-50 border-l-4 border-indigo-600 px-5 py-3 my-5 rounded-r-xl text-base italic text-slate-800">
            {trimmed.replace("> ", "").replace(/"/g, "")}
          </blockquote>
        );
        return;
      }

      // Unordered lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        listItems.push(trimmed.substring(2));
        return;
      }

      // Ordered lists (e.g. 1. )
      if (/^\d+\.\s/.test(trimmed)) {
        inList = true;
        listItems.push(trimmed.replace(/^\d+\.\s/, ""));
        return;
      }

      // Empty line
      if (!trimmed) {
        flushList();
        return;
      }

      // Normal paragraph
      flushList();
      elements.push(<p key={`p-${idx}`} className="text-slate-600 leading-relaxed mb-4 text-base">{trimmed}</p>);
    });

    flushList();
    flushCode();

    return elements;
  };

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

          <nav className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md max-w-full overflow-hidden" aria-label="Breadcrumb">
            <button
              onClick={() => navigate("/")}
              className="bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white px-3.5 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
              title="Back to Homepage"
            >
              <i className="fa-solid fa-arrow-left text-[10px]"></i>
              <span>Home</span>
            </button>
            <span className="text-white/60">
              <i className="fa-solid fa-chevron-right text-[9px]"></i>
            </span>

            {currentArticle ? (
              <>
                <button
                  onClick={() => navigate("/blogs")}
                  className="bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white px-3.5 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  Blogs
                </button>
                <span className="text-white/60">
                  <i className="fa-solid fa-chevron-right text-[9px]"></i>
                </span>
                <span className="text-white font-semibold truncate max-w-[180px] sm:max-w-xs">
                  {currentArticle.title}
                </span>
              </>
            ) : (
              <span className="bg-white text-slate-800 px-3 py-1 rounded-full font-semibold shadow-sm shrink-0">Blogs &amp; Stories</span>
            )}
          </nav>
        </header>

        {/* ── CONDITIONAL VIEW: ARTICLE READER VS DIRECTORY ── */}
        {currentArticle ? (
          /* ── SINGLE ARTICLE READER ── */
          <article className="bg-white rounded-3xl p-6 sm:p-12 shadow-2xl border border-slate-100">
            <header className="mb-8 pb-6 border-b border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => navigate("/blogs")}
                  className="bg-slate-100 hover:bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-left text-[11px]"></i> All Articles
                </button>
                <button 
                  onClick={handleShare} 
                  className="border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <i className="fa-solid fa-share-nodes text-xs"></i>
                  {copied ? "Link Copied!" : "Share"}
                </button>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-500 mb-3">
                <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                  {currentArticle.category}
                </span>
                <span>•</span>
                <time dateTime={currentArticle.isoDate}>
                  {currentArticle.date}
                </time>
                <span>•</span>
                <span>{currentArticle.readTime}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
                {currentArticle.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-6">
                {currentArticle.subtitle}
              </p>

              <div className="flex items-center gap-3.5 pt-2">
                <img
                  src={ProfilePhoto}
                  alt={currentArticle.author}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-600 bg-indigo-600 shrink-0"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white hidden items-center justify-center font-bold text-sm shrink-0">
                  DS
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">
                    {currentArticle.author}
                  </span>
                  <span className="text-xs text-slate-500">
                    {currentArticle.authorRole}
                  </span>
                </div>
              </div>
            </header>

            {/* Article Content */}
            <main className="prose prose-slate max-w-none">
              {renderFormattedContent(currentArticle.content)}
            </main>

            {/* Author Attribution Card */}
            <aside className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 mt-12 flex items-start gap-4 flex-col sm:flex-row">
              <img
                src={ProfilePhoto}
                alt="Digvijay Singh"
                className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-indigo-600"
              />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 mb-1">Written by Digvijay Singh</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Full-stack software engineer &amp; creator of OnBoard. Passionate about web performance, clean UX, and engineering human-centered social apps.
                </p>
                <Link to="/developer" className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1.5">
                  View Developer Profile &amp; Architecture <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </div>
            </aside>
          </article>
        ) : (
          /* ── BLOGS DIRECTORY VIEW ── */
          <>
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-100 text-center">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border border-indigo-100">
                <i className="fa-solid fa-newspaper text-xs"></i> The OnBoard Publication
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                Stories, Culture &amp; Engineering
              </h1>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed mb-8">
                Deep-dives into youth culture, the death of traditional algorithms, and the full-stack engineering behind the OnBoard platform.
              </p>

              <div className="max-w-xl mx-auto flex flex-col gap-4">
                <div className="relative w-full">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none text-sm transition-all"
                    placeholder="Search articles by title, tag, or topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex justify-center gap-2 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        selectedCategory === cat 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Articles Grid */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-100 flex flex-col transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl cursor-pointer"
                    onClick={() => navigate(`/blogs/${post.slug}`)}
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                        {post.category}
                      </span>
                      <span>•</span>
                      <time dateTime={post.isoDate}>{post.date}</time>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4 grow">
                      {post.excerpt}
                    </p>

                    <div className="flex gap-1.5 flex-wrap mb-4">
                      {post.tags.map((tag, i) => (
                        <span key={i} className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold mt-auto">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <i className="fa-solid fa-pen-nib text-indigo-600 text-xs"></i>
                        <span>{post.author}</span>
                      </div>
                      <span className="text-indigo-600 inline-flex items-center gap-1">
                        Read Story <i className="fa-solid fa-arrow-right text-[10px]"></i>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-slate-100">
                <i className="fa-regular fa-folder-open text-4xl text-slate-300 mb-3"></i>
                <h3 className="text-base font-bold text-slate-900 mb-1">No articles match your search</h3>
                <p className="text-xs text-slate-500">Try adjusting your search terms or selecting a different category.</p>
              </div>
            )}
          </>
        )}

        {/* ── Footer ── */}
        <footer className="text-center py-4 text-xs text-slate-400 space-y-1">
          <p>
            &copy; {new Date().getFullYear()} OnBoard Social • Developed by{" "}
            <strong className="text-white font-semibold">Digvijay Singh</strong>.
          </p>
          <p className="space-x-3">
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 underline">Home</Link>
            <span>•</span>
            <Link to="/developer" className="text-indigo-400 hover:text-indigo-300 underline">Developer</Link>
            <span>•</span>
            <Link to="/privacy-policy" className="text-indigo-400 hover:text-indigo-300 underline">Privacy Policy</Link>
          </p>
        </footer>

      </div>
    </div>
  );
};

export default Blogs;
