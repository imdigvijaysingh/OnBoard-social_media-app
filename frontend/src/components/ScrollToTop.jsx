import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToTop } from "../utils/scrollToTop";

const ScrollToTop = () => {
  const location = useLocation();

  // Route change listener: scroll to top whenever page switches
  useEffect(() => {
    scrollToTop();
  }, [location.pathname, location.search, location.key]);

  // Observer to automatically catch any pop-up / modal appearing in the DOM
  useEffect(() => {
    if (typeof MutationObserver === "undefined" || typeof document === "undefined") return;

    const modalSelectors = [
      ".create-post-overlay",
      ".delete-modal-overlay",
      ".lightbox-overlay",
      ".edit-post-modal",
      "[class*='z-[9999]']",
      "[role='dialog']",
    ];

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              const isModal = modalSelectors.some((sel) => {
                try {
                  return node.matches(sel) || node.querySelector(sel);
                } catch {
                  return false;
                }
              });

              if (isModal) {
                scrollToTop();
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};

export default ScrollToTop;
