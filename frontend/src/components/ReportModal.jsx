import React, { useState } from "react";
import axios from "axios";

const REPORT_REASONS = [
  {
    id: "spam",
    icon: "fa-solid fa-ban",
    title: "Spam or Scam",
    desc: "Unsolicited promotional links, automated spam, or phishing attempts",
  },
  {
    id: "harassment",
    icon: "fa-solid fa-hand",
    title: "Harassment or Bullying",
    desc: "Targeted attacks, threats, insults, or persistent unwanted contact",
  },
  {
    id: "inappropriate_media",
    icon: "fa-solid fa-eye-slash",
    title: "Inappropriate Media",
    desc: "Explicit imagery, non-consensual sharing, or violent material",
  },
  {
    id: "hate_speech",
    icon: "fa-solid fa-triangle-exclamation",
    title: "Hate Speech or Hostility",
    desc: "Attacks based on identity, discrimination, or abusive symbols",
  },
  {
    id: "impersonation",
    icon: "fa-solid fa-masks-theater",
    title: "Impersonation",
    desc: "Pretending to be someone else or deceptive profile credentials",
  },
  {
    id: "other",
    icon: "fa-solid fa-flag",
    title: "Other Community Violation",
    desc: "Other activity that breaches the friendly cabin code",
  },
];

const ReportModal = ({
  isOpen,
  onClose,
  targetType = "post",
  targetId,
  targetName = "Content",
  onReportSuccess = null,
}) => {
  const [selectedReason, setSelectedReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [blockTarget, setBlockTarget] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetId) {
      setErrorMessage("Missing report target identifier.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await axios.post(
        "http://localhost:3000/api/safety/report",
        {
          targetType,
          targetId,
          reason: selectedReason,
          details,
          blockTarget,
        },
        { withCredentials: true }
      );

      setIsSuccess(true);
      if (onReportSuccess) {
        onReportSuccess({ targetType, targetId, reason: selectedReason });
      }

      setTimeout(() => {
        setIsSuccess(false);
        setDetails("");
        setSelectedReason("spam");
        setBlockTarget(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Report submit error:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to submit report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsSuccess(false);
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/60 via-white to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg shadow-sm shadow-rose-500/20">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Report to Safety Crew
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Keep OnBoard friendly, authentic, and spam-free
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-4 shadow-md shadow-emerald-500/20 animate-bounce">
              <i className="fa-solid fa-check"></i>
            </div>
            <h4 className="text-xl font-extrabold text-slate-900 mb-2">
              Report Received
            </h4>
            <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
              Thank you for keeping OnBoard safe. Our Trust & Safety team has received your flag and is investigating.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Target Info */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 text-xs text-slate-600 font-medium">
              <i className="fa-solid fa-circle-info text-indigo-600 text-sm"></i>
              <span>
                You are reporting: <strong className="text-slate-900">{targetName}</strong> ({targetType})
              </span>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Reason Options */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Why are you reporting this?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {REPORT_REASONS.map((r) => {
                  const isSelected = selectedReason === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReason(r.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 text-left ${
                        isSelected
                          ? "bg-indigo-50/70 border-indigo-500 shadow-sm shadow-indigo-500/10"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs mt-0.5 shrink-0 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <i className={r.icon}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          <span>{r.title}</span>
                          {isSelected && (
                            <i className="fa-solid fa-circle-check text-indigo-600 text-xs"></i>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          {r.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional details */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide context or specific details to help our safety crew..."
                rows={3}
                maxLength={500}
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 resize-none"
              ></textarea>
              <div className="text-right text-[10px] text-slate-400 mt-1">
                {details.length}/500
              </div>
            </div>

            {/* Optional block user checkbox */}
            {targetType === "user" && (
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockTarget}
                  onChange={(e) => setBlockTarget(e.target.checked)}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs text-rose-900 font-semibold">
                  Also block this member (removes from crew and prevents messages)
                </span>
              </label>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-md shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-flag"></i>
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
