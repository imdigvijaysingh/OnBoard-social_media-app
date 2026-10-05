import React, { useState } from "react";

const SelectOrganizeBar = ({
  selectedCount,
  onReply,
  onPin,
  onCreateChapter,
  onTurnInto,
  onCopy,
  onDelete,
  onClearSelection,
}) => {
  const [showTurnIntoMenu, setShowTurnIntoMenu] = useState(false);

  if (selectedCount === 0) return null;

  const handleAction = (type) => {
    setShowTurnIntoMenu(false);
    if (onTurnInto) onTurnInto(type);
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl p-2 px-4 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-700/80 max-w-[90vw] overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0">
        <span className="bg-indigo-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-slate-400">selected</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {selectedCount === 1 && (
          <button
            type="button"
            className="px-3 py-1.5 hover:bg-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-200 hover:text-white"
            title="Reply to message"
            onClick={onReply}
          >
            <i className="fa-solid fa-reply text-[11px]"></i>
            <span>Reply</span>
          </button>
        )}

        {/* Turn into... Object Hub */}
        <div className="relative">
          <button
            type="button"
            className="px-3 py-1.5 hover:bg-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-indigo-300 hover:text-white"
            title="Turn selected message(s) into a living object"
            onClick={() => setShowTurnIntoMenu(!showTurnIntoMenu)}
          >
            <i className="fa-solid fa-wand-magic-sparkles text-[11px]"></i>
            <span>Turn into...</span>
            <i className="fa-solid fa-chevron-up text-[9px] ml-1"></i>
          </button>

          {showTurnIntoMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-52 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-100 p-1.5 flex flex-col gap-0.5 z-50 animate-in zoom-in-95 duration-150">
              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                onClick={() => handleAction("checklist")}
              >
                <span>📋</span> Task / Checklist
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                onClick={() => handleAction("poll")}
              >
                <span>📊</span> Native Poll
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                onClick={() => handleAction("meeting_point")}
              >
                <span>📍</span> Meeting Point
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                onClick={() => handleAction("experience")}
              >
                <span>🌴</span> Experience / Outing
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                onClick={() => handleAction("chapter")}
              >
                <span>🗂</span> Chapter
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                onClick={() => handleAction("moment")}
              >
                <span>✨</span> Preserved Moment
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          title="Package selected into Chapter"
          onClick={onCreateChapter}
        >
          <i className="fa-solid fa-box-archive text-[11px]"></i>
          <span>Chapter</span>
        </button>

        <button
          type="button"
          className="px-3 py-1.5 hover:bg-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-200 hover:text-white"
          title="Copy message text"
          onClick={onCopy}
        >
          <i className="fa-regular fa-copy text-[11px]"></i>
          <span>Copy</span>
        </button>

        <button
          type="button"
          className="px-3 py-1.5 hover:bg-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-200 hover:text-white"
          title="Pin message"
          onClick={onPin}
        >
          <i className="fa-solid fa-thumbtack text-[11px]"></i>
          <span>Pin</span>
        </button>

        <button
          type="button"
          className="px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Delete selected"
          onClick={onDelete}
        >
          <i className="fa-regular fa-trash-can text-[11px]"></i>
          <span>Delete</span>
        </button>

        <button
          type="button"
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
          title="Cancel selection"
          onClick={onClearSelection}
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
    </div>
  );
};

export default SelectOrganizeBar;
