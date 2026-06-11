import "../styles/Authentication.css";
import "../styles/CreateProfile.css";
import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const OTP_LENGTH = 6;

const Authentication = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // OTP state
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

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmailError("");
    setPasswordError("");
  };

  /* ─── Sign-up / Login handler ─── */
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailError("");
    setPasswordError("");

    const formData = new FormData(e.target);

    if (!isLogin) {
      // Sign Up
      const email = formData.get("email");
      axios
        .post("http://localhost:3000/api/auth/signup", {
          // .post("https://onboard-social-media-app-1.onrender.com/api/auth/signup", {
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email,
          password: formData.get("password"),
        })
        .then(() => {
          setVerifiedEmail(email);
          setIsLoading(false);
          setShowOtp(true); // swap to OTP panel
        })
        .catch((err) => {
          const message = err.response?.data?.message;
          if (message === "A user with this email already exists.") {
            setEmailError(message);
          }
          setIsLoading(false);
        });
    } else {
      // Log In
      axios
        .post("http://localhost:3000/api/auth/login", {
          // .post("https://onboard-social-media-app-1.onrender.com/api/auth/login", {
          email: formData.get("email"),
          password: formData.get("password"),
        }, { withCredentials: true })
        .then((res) => {
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
          const message = err.response?.data?.message;
          if (message === "User not found. Please sign up first.")
            setEmailError(message);
          if (message === "Wrong password. Please try again.")
            setPasswordError(message);
          setIsLoading(false);
        });
    }
  };

  /* ─── OTP digit handling ─── */
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

  /* ─── Verify OTP ─── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length < OTP_LENGTH) {
      setOtpError("Please enter all 6 digits.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");

    const email = verifiedEmail;
    const otp = code;

    axios
      .post("http://localhost:3000/api/auth/verify-email", {
        // .post("https://onboard-social-media-app-1.onrender.com/api/auth/verify-email", {
        email,
        otp,
      }, { withCredentials: true })
      .then(() => {
        setAnimationText("Signing up...");
        setIsAnimating(true);
        setTimeout(() => {
          navigate("/profile");
        }, 2000);
      })
      .catch((err) => {
        const message =
          err.response?.data?.message || "Invalid or expired OTP.";
        setOtpError(message);
        setOtpLoading(false);
      });
  };

  const handleResendOtp = async () => {
    try {
      setOtpError("");
      await axios.post("http://localhost:3000/api/auth/resend-otp", {
        // "https://onboard-social-media-app-1.onrender.com/api/auth/resend-otp"
        email: verifiedEmail,
      });
      setOtpError("OTP resent successfully!");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <>
    <div className={`auth-page ${isAnimating ? 'blur-background' : ''}`}>
      <div className="auth-container">
        <div className={`auth-card ${showOtp ? "otp-mode" : ""}`}>
          {/* ── LOGIN PANEL ── */}
          <div
            className={`auth-panel login-panel ${isLogin && !showOtp ? "active" : "inactive"}`}
          >
            <h1 className="logo">OnBoard</h1>
            <div className="form-content">
              <h2>Log in to Your Account</h2>
              <p className="subtitle">
                Log in to your account so you can continue building and editing
                your onboarding flows.
              </p>
              <form onSubmit={handleAuthSubmit}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    className="form-input"
                  />
                  {emailError && <p className="error-text">{emailError}</p>}
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    className="form-input"
                  />
                  {passwordError && (
                    <p className="error-text">{passwordError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading && isLogin ? (
                    <span className="spinner"></span>
                  ) : (
                    "LOG IN"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ── SIGN UP PANEL ── */}
          <div
            className={`auth-panel signup-panel ${
              !isLogin && !showOtp ? "active" : "inactive"
            } ${showOtp ? "otp-exit" : ""}`}
          >
            <h1 className="logo">OnBoard</h1>
            <div className="form-content">
              <h2>Sign Up for an Account</h2>
              <p className="subtitle">
                Let's get you all set up so you can start creating your first
                onboarding experience.
              </p>
              <form onSubmit={handleAuthSubmit}>
                <div className="name-fields">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Your first name"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name (Optional)</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Your last name"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    className="form-input"
                    required
                  />
                  {emailError && <p className="error-text">{emailError}</p>}
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter a strong password"
                    className="form-input"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading && !isLogin ? (
                    <span className="spinner"></span>
                  ) : (
                    "CREATE ACCOUNT"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ── OTP PANEL ── */}
          <div
            className={`auth-panel otp-panel ${showOtp ? "active" : "inactive"}`}
          >
            <h1 className="logo">OnBoard</h1>
            <div className="form-content otp-form-content">
              {/* Mail icon */}
              <div className="otp-icon-wrap">
                <svg className="otp-mail-icon" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="2"
                    y="4"
                    width="20"
                    height="16"
                    rx="3"
                    stroke="#5046E4"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M2 7l10 7 10-7"
                    stroke="#5046E4"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h2>Verify your email</h2>
              <p className="subtitle">
                We sent a 6-digit code to <strong>{verifiedEmail}</strong>.
                Enter it below to confirm your account.
              </p>

              <form onSubmit={handleVerifyOtp}>
                <div className="otp-inputs" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      className={`otp-box ${digit ? "otp-box--filled" : ""}`}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {otpError && <p className="error-text otp-error">{otpError}</p>}

                <button
                  type="submit"
                  className="submit-btn otp-submit-btn"
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <span className="spinner"></span>
                  ) : (
                    "VERIFY EMAIL"
                  )}
                </button>
                <div className="otp-resend" style={{ marginTop: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#666' }}>Didn't receive the code?</p>
                  <button type="button" onClick={handleResendOtp} className="resend-btn" style={{ 
                    background: 'none', border: 'none', color: '#5046e4', cursor: 'pointer', fontWeight: '600', marginTop: '8px'
                  }}>
                    Resend OTP
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── TOGGLE PANEL ── */}
          {!showOtp && (
            <div
              className={`toggle-panel ${isLogin ? "login-active" : "signup-active"}`}
            >
              <div className="toggle-content">
                {isLogin ? (
                  <>
                    <h2>Don't Have an Account Yet?</h2>
                    <p>
                      Let's get you all set up so you can start creating your
                      first onboarding experience.
                    </p>
                    <button onClick={toggleForm} className="toggle-btn">
                      SIGN UP
                    </button>
                  </>
                ) : (
                  <>
                    <h2>Already Signed up?</h2>
                    <p>
                      Log in to your account so you can continue building and
                      editing your onboarding flows.
                    </p>
                    <button onClick={toggleForm} className="toggle-btn">
                      LOG IN
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="footer">
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>
    </div>
    
    {isAnimating && (
      <div className="global-overlay">
        <div className="global-spinner"></div>
        <h2>{animationText}</h2>
      </div>
    )}
    </>
  );
};

export default Authentication;
