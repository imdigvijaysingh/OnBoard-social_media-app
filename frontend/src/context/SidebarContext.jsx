import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("onboard_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("onboard_sidebar_collapsed", String(next));
      } catch {
        // Ignore localStorage access errors
      }
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      isCollapsed: false,
      setIsCollapsed: () => {},
      toggleCollapse: () => {},
    };
  }
  return context;
};

export default SidebarContext;
