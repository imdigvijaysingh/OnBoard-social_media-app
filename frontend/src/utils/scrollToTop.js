/**
 * Utility to reliably scroll the window, document, and any scrollable container to top.
 */
export const scrollToTop = (options = {}) => {
  const behavior = options?.behavior || "instant";

  // 1. Scroll window
  try {
    window.scrollTo({ top: 0, left: 0, behavior });
  } catch (err) {
    window.scrollTo(0, 0);
  }

  // 2. Scroll document / body
  if (typeof document !== "undefined") {
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 3. Scroll all app containers and modal containers
    const selectors = [
      "#root",
      ".app-layout",
      ".main-content",
      ".feed-column",
      ".suggestions-column",
      ".notifications-container",
      ".lp-root",
      ".create-post-form",
      ".create-post-modal",
      ".delete-modal-card",
      ".lightbox-post-card",
      ".edit-post-modal",
    ];

    const elements = document.querySelectorAll(selectors.join(", "));
    elements.forEach((el) => {
      try {
        el.scrollTop = 0;
      } catch (e) {
        // ignore if not scrollable
      }
    });
  }
};

/**
 * Scroll a specific element to the top
 */
export const scrollToTopElement = (element, options = {}) => {
  if (!element) return;
  const behavior = options?.behavior || "instant";
  try {
    element.scrollTo({ top: 0, left: 0, behavior });
  } catch (err) {
    element.scrollTop = 0;
  }
};
