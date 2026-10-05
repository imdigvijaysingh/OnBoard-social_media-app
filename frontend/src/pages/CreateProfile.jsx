import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PhotoCropperModal from '../components/PhotoCropperModal';

const CreateProfile = () => {
  const [image, setImage] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [rawImageForCrop, setRawImageForCrop] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userNameError, setuserNameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const usernameDebounceRef = useRef(null);

  const navigate = useNavigate();

  // Live Auto-Check Username Availability as soon as user types
  useEffect(() => {
    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current);
    }

    const trimmed = (username || "").trim();
    if (!trimmed) {
      setUsernameStatus(null);
      setIsCheckingUsername(false);
      return;
    }

    if (trimmed.length < 3) {
      setUsernameStatus({ available: false, message: "Must be at least 3 characters" });
      setIsCheckingUsername(false);
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) {
      setUsernameStatus({ available: false, message: "Only letters, numbers, underscores & dots" });
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameStatus(null);

    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/profile/check-username/${encodeURIComponent(trimmed)}`,
          { withCredentials: true }
        );
        setUsernameStatus(res.data);
      } catch (err) {
        setUsernameStatus({ available: false, message: "Could not verify username" });
      } finally {
        setIsCheckingUsername(false);
      }
    }, 280);

    return () => {
      if (usernameDebounceRef.current) {
        clearTimeout(usernameDebounceRef.current);
      }
    };
  }, [username]);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageForCrop(reader.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (blob, previewUrl) => {
    setCroppedBlob(blob);
    setImage(previewUrl);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    if (croppedBlob) {
      formData.append("profilePhoto", croppedBlob, "profile-photo.jpg");
    } else if (fileInputRef.current?.files?.[0]) {
      formData.append("profilePhoto", fileInputRef.current.files[0]);
    }
    formData.append("userName", username);
    formData.append("dob", dob);

    axios
      .post("http://localhost:3000/api/profile/create", formData, { withCredentials: true })
      .then((res) => {
        setIsSuccess(true);
        setIsAnimating(true);
        setTimeout(() => {
          navigate('/feed');
        }, 2000);
      })
      .catch((err) => {
        const message = err.response?.data?.message;
        if (message === "This username is taken. Try a different one.") {
          setuserNameError(message);
        }
        setIsLoading(false);
      });
    
    setuserNameError("");
  };

  return (
    <>
      <div className={`min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden transition-all duration-500 ${isAnimating ? 'blur-sm' : ''}`}>
        {/* Ambient background glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-300">
          <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
            Setup Your Profile
          </h1>
          <p className="text-center text-sm text-slate-500 mt-2 mb-8">
            Let's get you ready for the journey
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Avatar section */}
            <div className="flex flex-col items-center justify-center">
              <div 
                className={`w-28 h-28 rounded-full border-2 ${
                  image ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-dashed border-slate-300 hover:border-indigo-600'
                } flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 bg-slate-50 overflow-hidden group shadow-inner relative`} 
                onClick={handleImageClick}
                title={image ? "Click to change or re-crop photo" : "Upload avatar"}
              >
                {image ? (
                  <>
                    <img src={image} alt="Profile Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                      <i className="fa-solid fa-crop-simple text-sm"></i>
                      <span>Edit Crop</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                    <span className="text-xs font-semibold">Upload</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden"
              />
            </div>

            {/* Username Input with Live Auto-Availability Check */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="username" className="text-sm font-semibold text-slate-700">Username</label>
                {isCheckingUsername && (
                  <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    Checking availability...
                  </span>
                )}
                {!isCheckingUsername && usernameStatus && (
                  <span
                    className={`text-[11px] font-bold flex items-center gap-1 transition-all ${
                      usernameStatus.available ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    <i className={`fa-solid ${usernameStatus.available ? "fa-check" : "fa-xmark"}`}></i>
                    {usernameStatus.message}
                  </span>
                )}
              </div>
              <div className="relative group">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input 
                  type="text" 
                  id="username"
                  name="userName"
                  placeholder="Choose a username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                  required
                  className={`w-full pl-11 pr-10 py-3.5 rounded-xl border transition-all outline-none text-slate-800 text-sm bg-slate-50/50 focus:bg-white ${
                    usernameStatus && !usernameStatus.available
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      : usernameStatus && usernameStatus.available
                      ? "border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      : isCheckingUsername
                      ? "border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      : "border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  }`}
                />
                {/* Live Auto-Availability Status Icon */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  {isCheckingUsername ? (
                    <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  ) : usernameStatus?.available ? (
                    <i className="fa-solid fa-circle-check text-emerald-500 text-base"></i>
                  ) : usernameStatus && !usernameStatus.available ? (
                    <i className="fa-solid fa-circle-xmark text-rose-500 text-base"></i>
                  ) : null}
                </div>
              </div>
              {userNameError && <p className="text-red-500 text-xs mt-1">{userNameError}</p>}
            </div>

            {/* Date of Birth Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dob" className="text-sm font-semibold text-slate-700">Date of Birth</label>
              <div className="relative group">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <input 
                  type="date" 
                  id="dob"
                  name="dob"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>CREATING...</span>
                </>
              ) : (
                "CREATE PROFILE"
              )}
            </button>
          </form>
        </div>
      </div>
      
      {isAnimating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-slate-900 animate-in slide-in-from-bottom-2 duration-300">
            Creating profile...
          </h2>
        </div>
      )}

      {/* Interactive Photo Cropper Modal for Avatar */}
      <PhotoCropperModal
        isOpen={isCropModalOpen}
        imageSrc={rawImageForCrop}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        initialAspect={1}
        lockAspect={true}
        circularCrop={true}
        title="Crop Profile Avatar"
      />
    </>
  );
};

export default CreateProfile;