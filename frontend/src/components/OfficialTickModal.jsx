import React, { useState } from "react";
import axios from "axios";
import { overlayCard } from "../context/OverlayCardContext";

const OfficialTickModal = ({
  isOpen,
  onClose,
  currentUser = null,
  onVerificationSuccess = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  if (!isOpen) return null;

  const isBypassUser =
    currentUser?.userName?.toLowerCase() === "maharaja2509singh" ||
    currentUser?.contactEmail?.toLowerCase() === "digvijaypundir915@gmail.com";

  const handleSubscribe = async () => {
    try {
      setIsSubmitting(true);
      const res = await axios.post(
        "http://localhost:3000/api/profile/subscribe-tick",
        { plan: selectedPlan },
        { withCredentials: true }
      );

      if (onVerificationSuccess) {
        onVerificationSuccess({
          isOfficialVerified: true,
          officialVerifiedAt: res.data.officialVerifiedAt || new Date().toISOString(),
        });
      }

      onClose();

      overlayCard.success(
        "Congratulations! Your Official Blue Tick is now active across your profile, feed posts, search, and comments! 🚀✨",
        {
          title: "Official Verification Activated",
          buttonText: "Awesome!",
          autoCloseMs: 5000,
        }
      );
    } catch (err) {
      console.error("Subscribe tick error:", err);
      overlayCard.error(
        err.response?.data?.message || "Failed to activate official tick. Please try again.",
        {
          title: "Subscription Failed",
          buttonText: "Dismiss",
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Gradient */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 p-6 text-white overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute right-4 bottom-2 text-indigo-400/20 text-8xl font-black select-none pointer-events-none">
            <i className="fa-solid fa-circle-check"></i>
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl shadow-inner">
                <i className="fa-solid fa-circle-check text-blue-200"></i>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                  Official Verification
                </span>
                <h3 className="text-xl font-extrabold tracking-tight mt-1 text-white">
                  Get Official Blue Tick
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Live Profile Preview */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={
                  currentUser?.profilePhoto ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/20 shadow-xs"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {currentUser?.name || "Your Name"}
                  </span>
                  <span className="inline-flex items-center text-indigo-600 text-sm">
                    <i className="fa-solid fa-circle-check"></i>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">
                  @{currentUser?.userName || "username"}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
              Preview
            </span>
          </div>

          {/* Bypass Notification if VIP */}
          {isBypassUser && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
              <i className="fa-solid fa-sparkles text-indigo-600 text-base mt-0.5"></i>
              <div>
                <h4 className="text-xs font-extrabold text-indigo-900">
                  Complimentary Creator Bypass Detected
                </h4>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Your account is eligible for permanent, free Official Verification without any active subscription fees.
                </p>
              </div>
            </div>
          )}

          {/* Benefits List */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
              Verified Perks &amp; Features
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs">
                  <i className="fa-solid fa-badge-check"></i>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    Official Verified Blue Tick
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Displayed prominently next to your name on your profile, feed posts, search, and replies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 text-xs">
                  <i className="fa-solid fa-magnifying-glass-chart"></i>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    Priority Crew Search &amp; Discovery
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Get boosted placement in search results and recommended flight crew lists.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-xs">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    Anti-Impersonation Protection
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Lock down your identity and build trusted credibility with your audience and followers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          {!isBypassUser && (
            <div>
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                Select Subscription Plan
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("monthly")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPlan === "monthly"
                      ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Monthly</span>
                    <span className="w-3.5 h-3.5 rounded-full border border-indigo-600 flex items-center justify-center">
                      {selectedPlan === "monthly" && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-lg font-black text-slate-900">$4.99</span>
                    <span className="text-xs text-slate-500"> / month</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Billed monthly. Cancel anytime.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan("annual")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    selectedPlan === "annual"
                      ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                    Save 33%
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Annual</span>
                    <span className="w-3.5 h-3.5 rounded-full border border-indigo-600 flex items-center justify-center">
                      {selectedPlan === "annual" && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-lg font-black text-slate-900">$39.99</span>
                    <span className="text-xs text-slate-500"> / year</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                    Just $3.33 / mo
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Maybe Later
          </button>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-102 active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                <span>Activating Official Tick...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-check text-xs"></i>
                <span>{isBypassUser ? "Activate VIP Official Tick" : "Subscribe & Get Tick"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficialTickModal;
