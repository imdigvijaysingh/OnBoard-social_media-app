import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const OverlayCardContext = createContext(null);

// Global dispatcher to allow calling overlayCard methods from anywhere,
// including outside React component render cycles and in legacy callbacks.
let globalOverlayDispatcher = null;

export const overlayCard = {
  success: (message, options = {}) => {
    if (globalOverlayDispatcher) {
      return globalOverlayDispatcher.show({
        type: "success",
        title: options.title || "Success",
        message: typeof message === "string" ? message : options.message || "Action completed successfully",
        buttonText: options.buttonText || "Awesome",
        autoCloseMs: options.autoCloseMs !== undefined ? options.autoCloseMs : 4000,
        ...options,
      });
    } else {
      console.log("[OverlayCard:Success]", message);
    }
  },
  error: (message, options = {}) => {
    if (globalOverlayDispatcher) {
      return globalOverlayDispatcher.show({
        type: "error",
        title: options.title || "Action Failed",
        message: typeof message === "string" ? message : options.message || "An unexpected error occurred",
        buttonText: options.buttonText || "Dismiss",
        autoCloseMs: options.autoCloseMs !== undefined ? options.autoCloseMs : 5000,
        ...options,
      });
    } else {
      console.error("[OverlayCard:Error]", message);
    }
  },
  info: (message, options = {}) => {
    if (globalOverlayDispatcher) {
      return globalOverlayDispatcher.show({
        type: "info",
        title: options.title || "Notice",
        message: typeof message === "string" ? message : options.message || "",
        buttonText: options.buttonText || "Got it",
        autoCloseMs: options.autoCloseMs !== undefined ? options.autoCloseMs : 3500,
        ...options,
      });
    } else {
      console.log("[OverlayCard:Info]", message);
    }
  },
  alert: (message, options = {}) => {
    // Intelligent type detection based on message text
    const text = typeof message === "string" ? message : options.message || "";
    const isError = /fail|error|wrong|invalid|cannot|denied/i.test(text);
    const isSuccess = /success|copied|saved|updated|pinned|completed|verified|✨|🎉|📋/i.test(text);

    if (isError) {
      return overlayCard.error(text, options);
    } else if (isSuccess) {
      return overlayCard.success(text, options);
    }
    return overlayCard.info(text, options);
  },
  confirm: (options) => {
    if (globalOverlayDispatcher) {
      return globalOverlayDispatcher.confirm(options);
    }
    return Promise.resolve(false);
  },
};

export const OverlayCardProvider = ({ children }) => {
  const [modalState, setModalState] = useState(null);
  const timerRef = useRef(null);

  const closeModal = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setModalState((prev) => {
      if (prev?.resolvePromise) {
        prev.resolvePromise(false);
      }
      return null;
    });
  }, []);

  const show = useCallback((config) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setModalState({
      ...config,
      isConfirm: false,
    });

    if (config.autoCloseMs && config.autoCloseMs > 0) {
      timerRef.current = setTimeout(() => {
        closeModal();
      }, config.autoCloseMs);
    }

    return () => closeModal();
  }, [closeModal]);

  const confirm = useCallback((config) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    let rawMessage = "";
    let rawTitle = "Confirmation";
    let isDanger = true;
    let confirmText = "Confirm";
    let cancelText = "Cancel";

    if (typeof config === "string") {
      rawMessage = config;
    } else if (config) {
      rawMessage = config.message || "";
      rawTitle = config.title || "Confirmation";
      isDanger = config.isDanger !== undefined ? config.isDanger : true;
      confirmText = config.confirmText || "Confirm";
      cancelText = config.cancelText || "Cancel";
    }

    return new Promise((resolve) => {
      setModalState({
        type: isDanger ? "danger" : "confirm",
        isConfirm: true,
        title: rawTitle,
        message: rawMessage,
        confirmText,
        cancelText,
        resolvePromise: resolve,
        onConfirm: () => {
          if (config?.onConfirm) config.onConfirm();
          resolve(true);
          setModalState(null);
        },
        onCancel: () => {
          if (config?.onCancel) config.onCancel();
          resolve(false);
          setModalState(null);
        },
      });
    });
  }, []);

  // Register global dispatcher
  useEffect(() => {
    globalOverlayDispatcher = { show, confirm };

    // Intercept native browser alert and confirm globally to prevent ANY tab popups
    const originalAlert = typeof window !== "undefined" ? window.alert : null;
    const originalConfirm = typeof window !== "undefined" ? window.confirm : null;

    try {
      if (typeof window !== "undefined") {
        window.alert = (message) => {
          overlayCard.alert(message);
        };

        window.confirm = (message) => {
          overlayCard.confirm({
            title: "Confirmation Required",
            message: String(message || ""),
            isDanger: true,
          });
          return false;
        };
      }
    } catch (e) {
      // In case window properties are restricted
    }

    return () => {
      globalOverlayDispatcher = null;
      try {
        if (originalAlert) window.alert = originalAlert;
        if (originalConfirm) window.confirm = originalConfirm;
      } catch (e) {}
    };
  }, [show, confirm]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && modalState) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState, closeModal]);

  return (
    <OverlayCardContext.Provider value={{ overlayCard, show, confirm, closeModal }}>
      {children}

      {/* OVERLAY CARD MODAL */}
      {modalState && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !modalState.isConfirm) {
              closeModal();
            }
          }}
        >
          <div
            className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button (for non-confirm) */}
            {!modalState.isConfirm && (
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            )}

            {/* Icon & Theme Badging */}
            {modalState.type === "success" && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center text-3xl shadow-sm mb-4 shadow-emerald-500/10">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wider mb-2">
                  Success
                </span>
              </>
            )}

            {modalState.type === "error" && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100/80 flex items-center justify-center text-3xl shadow-sm mb-4 shadow-rose-500/10">
                  <i className="fa-solid fa-circle-exclamation"></i>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 tracking-wider mb-2">
                  Action Failed
                </span>
              </>
            )}

            {modalState.type === "info" && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 flex items-center justify-center text-3xl shadow-sm mb-4 shadow-indigo-500/10">
                  <i className="fa-solid fa-circle-info"></i>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 tracking-wider mb-2">
                  Notice
                </span>
              </>
            )}

            {(modalState.type === "danger" || modalState.type === "confirm") && (
              <>
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-4 ${
                    modalState.type === "danger"
                      ? "bg-rose-50 text-rose-600 border border-rose-100/80 shadow-rose-500/10"
                      : "bg-amber-50 text-amber-600 border border-amber-100/80 shadow-amber-500/10"
                  }`}
                >
                  <i
                    className={
                      modalState.type === "danger"
                        ? "fa-solid fa-triangle-exclamation"
                        : "fa-solid fa-circle-question"
                    }
                  ></i>
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider mb-2 ${
                    modalState.type === "danger"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  Confirmation Required
                </span>
              </>
            )}

            {/* Title */}
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
              {modalState.title}
            </h3>

            {/* Message */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-medium max-w-sm">
              {modalState.message}
            </p>

            {/* Action Buttons */}
            {modalState.isConfirm ? (
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={modalState.onCancel}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  {modalState.cancelText || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={modalState.onConfirm}
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                    modalState.type === "danger"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/30"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
                  }`}
                >
                  {modalState.confirmText || "Confirm"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={closeModal}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                  modalState.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
                    : modalState.type === "error"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25"
                }`}
              >
                {modalState.buttonText || "Got it"}
              </button>
            )}

            {/* Auto-close Progress Indicator for Alerts */}
            {!modalState.isConfirm && modalState.autoCloseMs > 0 && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full overflow-hidden"
              >
                <div
                  className={`h-full animate-[progress_linear_forwards] ${
                    modalState.type === "success"
                      ? "bg-emerald-500"
                      : modalState.type === "error"
                      ? "bg-rose-500"
                      : "bg-indigo-500"
                  }`}
                  style={{
                    animationDuration: `${modalState.autoCloseMs}ms`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </OverlayCardContext.Provider>
  );
};

export const useOverlayCard = () => {
  const ctx = useContext(OverlayCardContext);
  if (!ctx) {
    return { overlayCard };
  }
  return ctx;
};
