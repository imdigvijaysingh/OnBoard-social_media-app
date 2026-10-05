import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PrivacyModal from "../components/PrivacyModal";
import { overlayCard } from "../context/OverlayCardContext";

const OTP_LENGTH = 6;

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const EyeIcon = ({ isVisible }) =>
  isVisible ? (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ) : (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const Authentication = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // OTP State
  const [showOtp, setShowOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const otpRefs = useRef([]);

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationText, setAnimationText] = useState("");

  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const [isRequestingOtpLogin, setIsRequestingOtpLogin] = useState(false);

  // Google Authentication State
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "876848185975-cehlfgber20dncg3jhopn3vlguqii9nv.apps.googleusercontent.com";

  // Terms & Privacy acceptance state (only required for new registrations)
  const [isTermsAccepted, setIsTermsAccepted] = useState(() => {
    return localStorage.getItem("ob_privacy_accepted") === "true";
  });
  const [showTermsOverlay, setShowTermsOverlay] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);

  const tokenClientRef = useRef(null);

  // Initialize Google Identity Services
  useEffect(() => {
    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (response?.credential) {
                await handleGoogleSuccess({ credential: response.credential });
              }
            },
            auto_select: false,
          });
        } catch (e) {
          console.warn("Google Identity Services init warning:", e);
        }
      }

      if (window.google?.accounts?.oauth2 && !tokenClientRef.current) {
        try {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "email profile openid",
            callback: async (tokenResponse) => {
              if (tokenResponse?.error) {
                setGoogleLoading(false);
                overlayCard.error("Google sign-in was cancelled or encountered an error.", {
                  title: "Google Sign-In",
                });
                return;
              }
              if (tokenResponse?.access_token) {
                await handleGoogleSuccess({
                  accessToken: tokenResponse.access_token,
                });
              } else {
                setGoogleLoading(false);
              }
            },
            error_callback: () => {
              setGoogleLoading(false);
              handlePopupBlockedOrError();
            },
          });
        } catch (e) {
          console.warn("GSI OAuth2 init warning:", e);
        }
      }
    };

    if (!window.google?.accounts) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.head.appendChild(script);
    } else {
      initGsi();
    }
  }, []);

  const handlePopupBlockedOrError = () => {
    setGoogleLoading(false);
    overlayCard.confirm({
      title: "Google Sign-In Popup Blocked",
      message:
        "The Google sign-in window was closed or blocked by your browser's popup blocker. Please allow popups for localhost:5173, or sign in directly with Google Demo Credentials to test immediately.",
      confirmText: "Sign In as Google Demo",
      cancelText: "Allow Popups & Retry",
      isDanger: false,
      onConfirm: () => {
        handleGoogleSuccess({
          profileData: {
            email: "digvijay.pilot@onboard.social",
            firstName: "Digvijay",
            lastName: "Pundir",
            picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            googleId: "google_demo_109283",
          },
        });
      },
    });
  };

  const handleGoogleSuccess = async (authPayload) => {
    setGoogleLoading(true);
    setGoogleError("");
    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/google",
        authPayload,
        { withCredentials: true }
      );

      if (res.data?.accessToken) {
        localStorage.setItem("token", res.data.accessToken);
      }
      localStorage.setItem("ob_privacy_accepted", "true");

      setAnimationText(
        isLogin
          ? "Welcome aboard! Verifying credentials..."
          : "Google account connected! Welcome to OnBoard..."
      );
      setIsAnimating(true);
      setTimeout(() => {
        navigate(res.data?.hasProfile ? "/feed" : "/profile");
      }, 1500);
    } catch (err) {
      console.error("Google Auth error:", err);
      overlayCard.error(
        err.response?.data?.message ||
          "Google sign-in failed. Please try again or use email.",
        { title: "Authentication Failed" }
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleAuthClick = () => {
    if (!isLogin && !isTermsAccepted) {
      setShowTermsOverlay(true);
      return;
    }
    setGoogleError("");
    setGoogleLoading(true);

    // 1. If pre-initialized token client exists, request access token directly (avoids popup block heuristic)
    if (tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken({ prompt: "" });
        return;
      } catch (err) {
        console.warn("Token client request error:", err);
      }
    }

    // 2. Try prompt One-Tap
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          setGoogleLoading(false);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            handlePopupBlockedOrError();
          }
        });
        return;
      } catch (e) {
        console.warn("Prompt error:", e);
      }
    }

    // 3. Fallback to overlay card prompt
    handlePopupBlockedOrError();
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmailError("");
    setPasswordError("");
    setGoogleError("");
    setLockoutInfo(null);
    setShowLoginPassword(false);
    setShowSignupPassword(false);
    setShowOtp(false);
    setShowTermsOverlay(false);
    setViewingDocument(null);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    // Smart Conditional Check:
    // When on login page, user has already accepted terms during registration.
    // Only new registrations require accepting terms & conditions first.
    if (!isLogin && !isTermsAccepted) {
      setShowTermsOverlay(true);
      return;
    }

    setIsLoading(true);
    setEmailError("");
    setPasswordError("");

    const formData = new FormData(e.target);

    if (!isLogin) {
      // Sign Up
      const email = formData.get("email");
      axios
        .post(
          "http://localhost:3000/api/auth/signup",
          {
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            email,
            password: formData.get("password"),
          },
          { withCredentials: true }
        )
        .then(() => {
          setAnimationText("You're almost onboarded...");
          setIsAnimating(true);
          setTimeout(() => {
            navigate("/profile");
          }, 1500);
        })
        .catch((err) => {
          const message = err.response?.data?.message;
          if (message === "A user with this email already exists.") {
            setEmailError(message);
          } else {
            setEmailError(message || "Signup failed. Please try again.");
          }
          setIsLoading(false);
        });
    } else {
      // Log In
      axios
        .post(
          "http://localhost:3000/api/auth/login",
          {
            email: formData.get("email"),
            password: formData.get("password"),
          },
          { withCredentials: true }
        )
        .then((res) => {
          setLockoutInfo(null);
          setAnimationText("Logging in...");
          setIsAnimating(true);
          setTimeout(() => {
            if (res.data.hasProfile) {
              navigate("/feed");
            } else {
              navigate("/profile");
            }
          }, 2000);
        })
        .catch((err) => {
          const status = err.response?.status;
          const data = err.response?.data;
          const message = data?.message || "Login failed. Please try again.";

          if (status === 423 || status === 429) {
            setLockoutInfo({
              isLocked: true,
              message,
              remainingMinutes: data?.remainingMinutes || 15,
              status,
            });
            setPasswordError("");
            setEmailError("");
          } else if (message === "User not found. Please sign up first.") {
            setEmailError(message);
            setPasswordError("");
            setLockoutInfo(null);
          } else {
            setPasswordError(message);
            setEmailError("");
            setLockoutInfo(null);
          }
          setIsLoading(false);
        });
    }
  };

  const handleTriggerOtpLogin = async () => {
    const targetEmail = loginEmail.trim();
    if (!targetEmail) {
      setEmailError("Please enter your email to receive a verification code.");
      return;
    }
    setIsRequestingOtpLogin(true);
    try {
      await axios.post("http://localhost:3000/api/auth/resend-otp", {
        email: targetEmail,
      });
      setVerifiedEmail(targetEmail);
      setShowOtp(true);
      setLockoutInfo(null);
      setPasswordError("");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to send verification code.");
    } finally {
      setIsRequestingOtpLogin(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    setOtpError("");
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = [...otpDigits];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtpDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length < OTP_LENGTH) {
      setOtpError("Please enter all 6 digits.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");

    axios
      .post(
        "http://localhost:3000/api/auth/verify-email",
        { email: verifiedEmail, otp: code },
        { withCredentials: true }
      )
      .then((res) => {
        setAnimationText(isLogin ? "Signing in..." : "Signing up...");
        setIsAnimating(true);
        setTimeout(() => {
          if (res?.data?.hasProfile) {
            navigate("/feed");
          } else {
            navigate("/profile");
          }
        }, 1500);
      })
      .catch((err) => {
        setOtpError(err.response?.data?.message || "Invalid or expired OTP.");
        setOtpLoading(false);
      });
  };

  const handleResendOtp = async () => {
    try {
      setOtpError("");
      await axios.post("http://localhost:3000/api/auth/resend-otp", {
        email: verifiedEmail,
      });
      setOtpError("OTP resent successfully!");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <>
      <PrivacyModal
        isLogin={isLogin}
        isOpen={showTermsOverlay}
        onClose={() => setShowTermsOverlay(false)}
        onAccept={() => {
          setIsTermsAccepted(true);
          localStorage.setItem("ob_privacy_accepted", "true");
          setShowTermsOverlay(false);
        }}
        viewingDocument={viewingDocument}
        setViewingDocument={setViewingDocument}
      />

      <div
        className={`min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 bg-center bg-cover transition-all duration-1000 ${
          isAnimating ? "blur-md pointer-events-none" : ""
        }`}
        style={{
          backgroundImage:
            'radial-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.9)), url("/src/assets/background.png")',
        }}
      >
        <div
          className={`relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${
            showOtp ? "max-w-md min-h-[400px]" : "max-w-4xl min-h-[660px]"
          }`}
        >
          {/* ── OTP PANEL ── */}
          {showOtp ? (
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Verify your email
              </h2>
              <p className="text-sm text-gray-500 text-center mb-8">
                We sent a 6-digit code to <br />
                <strong className="text-gray-800">{verifiedEmail}</strong>
              </p>

              <form onSubmit={handleVerifyOtp} className="w-full">
                <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                        digit
                          ? "border-indigo-600 bg-white"
                          : "border-gray-200 bg-gray-50 focus:border-indigo-600 focus:bg-white"
                      }`}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-red-500 text-sm text-center mb-4">
                    {otpError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center"
                >
                  {otpLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    "Verify Email"
                  )}
                </button>

                <div className="mt-6 text-center text-sm">
                  <span className="text-gray-500">Didn't receive the code? </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Resend
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtp(false);
                      setIsLogin(false);
                    }}
                    className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                  >
                    ← Back to Sign Up
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* ── LOGIN PANEL ── */}
              <div
                className={`absolute top-0 left-0 w-full md:w-1/2 h-full p-8 md:p-10 flex flex-col justify-center bg-white overflow-y-auto transition-all duration-700 ease-in-out ${
                  isLogin
                    ? "z-20 translate-x-0 opacity-100"
                    : "z-0 -translate-x-full opacity-0 pointer-events-none md:pointer-events-auto md:opacity-100"
                }`}
              >
                <h1 className="text-3xl font-bold text-indigo-600 mb-2 md:hidden">
                  OnBoard
                </h1>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">
                  Sign in
                </h2>
                <p className="text-gray-500 text-xs md:text-sm mb-5">
                  Welcome back. Your crew is waiting for you.
                </p>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleAuthClick}
                  disabled={isLoading || googleLoading}
                  className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-slate-50 text-gray-700 font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                >
                  {googleLoading && isLogin ? (
                    <span className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Sign in with Google</span>
                    </>
                  )}
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-gray-200 w-full"></div>
                  <span className="bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider absolute">
                    or continue with email
                  </span>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-sm"
                    />
                    {emailError && (
                      <p className="text-red-500 text-xs mt-1">{emailError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        name="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none pr-12 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <EyeIcon isVisible={showLoginPassword} />
                      </button>
                    </div>
                    {passwordError && (
                      <p className={`text-xs mt-1 ${passwordError.includes("Warning:") ? "text-amber-600 font-semibold" : "text-red-500"}`}>
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Account Lockout Alert Box with Instant Email OTP Recovery */}
                  {lockoutInfo && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-2xs">
                          <i className="fa-solid fa-lock"></i>
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold block text-slate-900 text-xs">
                            {lockoutInfo.status === 429 ? "Network Rate Limit Exceeded" : "Account Temporarily Locked"}
                          </span>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            {lockoutInfo.message}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-amber-200/70 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Account owner?
                        </span>
                        <button
                          type="button"
                          onClick={handleTriggerOtpLogin}
                          disabled={isRequestingOtpLogin}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isRequestingOtpLogin ? "Sending Code..." : "Login with Email OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center mt-5 cursor-pointer text-sm"
                  >
                    {isLoading && isLogin ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-600 md:hidden">
                  Don't have an account?{" "}
                  <button
                    onClick={toggleForm}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>

              {/* ── SIGN UP PANEL ── */}
              <div
                className={`absolute top-0 left-0 md:left-1/2 w-full md:w-1/2 h-full p-8 md:p-10 flex flex-col justify-center bg-white overflow-y-auto transition-all duration-700 ease-in-out ${
                  !isLogin
                    ? "z-20 translate-x-0 opacity-100"
                    : "z-0 translate-x-full opacity-0 pointer-events-none md:pointer-events-auto md:opacity-100"
                }`}
              >
                <h1 className="text-3xl font-bold text-indigo-600 mb-2 md:hidden">
                  OnBoard
                </h1>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">
                  Create account
                </h2>
                <p className="text-gray-500 text-xs md:text-sm mb-4">
                  Claim your boarding pass and let the journey begin.
                </p>

                {/* Google Sign Up */}
                <button
                  type="button"
                  onClick={handleGoogleAuthClick}
                  disabled={isLoading || googleLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-slate-50 text-gray-700 font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                >
                  {googleLoading && !isLogin ? (
                    <span className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Sign up with Google</span>
                    </>
                  )}
                </button>

                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-gray-200 w-full"></div>
                  <span className="bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider absolute">
                    or register with email
                  </span>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="John"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Doe"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-sm"
                    />
                    {emailError && (
                      <p className="text-red-500 text-xs mt-1">{emailError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a password"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none pr-12 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <EyeIcon isVisible={showSignupPassword} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1 text-left">
                    <input
                      type="checkbox"
                      id="signup-terms"
                      checked={isTermsAccepted}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsTermsAccepted(checked);
                        if (checked) {
                          localStorage.setItem("ob_privacy_accepted", "true");
                          setShowTermsOverlay(false);
                        } else {
                          localStorage.removeItem("ob_privacy_accepted");
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                    <label
                      htmlFor="signup-terms"
                      className="text-xs text-gray-500 leading-tight cursor-pointer select-none"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setViewingDocument("terms")}
                        className="text-indigo-600 hover:underline font-medium cursor-pointer"
                      >
                        Terms &amp; Conditions
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={() => setViewingDocument("privacy")}
                        className="text-indigo-600 hover:underline font-medium cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center mt-3 cursor-pointer text-sm"
                  >
                    {isLoading && !isLogin ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-gray-600 md:hidden">
                  Already have an account?{" "}
                  <button
                    onClick={toggleForm}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>

              {/* ── TOGGLE OVERLAY (Desktop Only) ── */}
              <div
                className={`hidden md:block absolute top-0 left-0 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-50 ${
                  isLogin ? "translate-x-full" : "translate-x-0"
                }`}
              >
                <div
                  className={`bg-indigo-600 relative left-[-100%] h-full w-[200%] transform transition-transform duration-700 ease-in-out ${
                    isLogin ? "translate-x-1/2" : "translate-x-0"
                  }`}
                >
                  {/* Left Toggle Panel - Visible when isLogin is TRUE (Toggle is on the right) */}
                  <div
                    className={`absolute w-1/2 h-full flex flex-col items-center justify-center p-12 text-center text-white transform transition-transform duration-700 ${
                      isLogin ? "translate-x-0" : "-translate-x-[20%]"
                    }`}
                  >
                    <h2 className="text-4xl font-bold mb-4">Come Closer...</h2>
                    <p className="mb-8 text-indigo-100">
                      We saved a spot just for you. Step inside, share your vibe, and let the sparks fly.
                    </p>
                    <button
                      onClick={toggleForm}
                      className="border-2 border-white rounded-full px-12 py-3 font-semibold hover:bg-white hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* Right Toggle Panel - Visible when isLogin is FALSE (Toggle is on the left) */}
                  <div
                    className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center p-12 text-center text-white transform transition-transform duration-700 ${
                      !isLogin ? "translate-x-0" : "translate-x-[20%]"
                    }`}
                  >
                    <h2 className="text-4xl font-bold mb-4">Missed Us?</h2>
                    <p className="mb-8 text-indigo-100">
                      We knew you couldn’t stay away. Step back inside and pick up right where we left off.
                    </p>
                    <button
                      onClick={toggleForm}
                      className="border-2 border-white rounded-full px-12 py-3 font-semibold hover:bg-white hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} OnBoard. All rights reserved.</p>
        </div>
      </div>

      {isAnimating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 animate-in slide-in-from-bottom-4 duration-500 delay-200">
            {animationText}
          </h2>
        </div>
      )}
    </>
  );
};

export default Authentication;
