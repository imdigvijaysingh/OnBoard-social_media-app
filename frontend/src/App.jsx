import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { OverlayCardProvider } from "./context/OverlayCardContext";
import { SidebarProvider } from "./context/SidebarContext";
import CreatePost from "./pages/CreatePost";
import Feed from "./pages/Feed";
import Authentication from "./pages/Authentication";
import CreateProfile from "./pages/CreateProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LandingPage from "./pages/LandingPage";
import MyProfile from "./pages/MyProfile";
import Notifications from "./pages/Notifications";
import ScrollToTop from "./components/ScrollToTop";
import Developer from "./pages/Developer";
import Blogs from "./pages/Blogs";
import Chats from "./pages/Chats";
import SearchCrew from "./pages/SearchCrew";
import UserProfile from "./pages/UserProfile";
import Discover from "./pages/Discover";
import Squads from "./pages/Squads";
import DualDeck from "./pages/DualDeck";
import PulseVisualHost from "./components/PulseVisualHost";

const App = () => {
  const location = useLocation();

  return (
    <OverlayCardProvider>
      <SidebarProvider>
        <ScrollToTop />
        <PulseVisualHost />
        <div key={location.pathname} className="page-slide-in min-h-screen">
          <Routes location={location}>
            <Route path="/auth" element={<Authentication />} />
            <Route path="/profile" element={<CreateProfile />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/squads" element={<Squads />} />
            <Route path="/dual-deck" element={<DualDeck />} />
            <Route path="/search" element={<SearchCrew />} />
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/developer" element={<Developer />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:slug" element={<Blogs />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </div>
      </SidebarProvider>
    </OverlayCardProvider>
  );
};

export default App;
