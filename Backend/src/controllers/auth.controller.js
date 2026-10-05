import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from "../models/user.model.js";
import profileModel from '../models/profile.model.js';
import config from '../config/config.js';
import { sendEmail } from '../services/email.service.js';
import { generateOtp, getOtpHtml } from '../utils/utils.js';
import otpModel from '../models/otp.model.js';
import sessionModel from '../models/session.model.js';
import { recordSecurityEvent } from '../services/notification.service.js';


export async function signup(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
      email,
    });

    if (isUserAlreadyExists) {
      if (!isUserAlreadyExists.verified) {
        const hash = await bcrypt.hash(password, 10);
        isUserAlreadyExists.password = hash;
        isUserAlreadyExists.verified = true;
        if (firstName) isUserAlreadyExists.firstName = firstName;
        if (lastName) isUserAlreadyExists.lastName = lastName;
        await isUserAlreadyExists.save();

        const refreshToken = jwt.sign(
          { id: isUserAlreadyExists._id },
          config.JWT_SECRET,
          { expiresIn: "7d" }
        );
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        const session = await sessionModel.create({
          user: isUserAlreadyExists._id,
          refreshTokenHash,
          ip: req.ip || "127.0.0.1",
          userAgent: req.headers["user-agent"] || "Unknown"
        });
        const accessToken = jwt.sign(
          { id: isUserAlreadyExists._id, sessionId: session._id },
          config.JWT_SECRET,
          { expiresIn: "15m" }
        );
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return res.status(200).json({
          message: "User signed up successfully",
          user: {
            email: isUserAlreadyExists.email,
            verified: true
          },
          accessToken
        });
      }

      return res.status(409).json({
        message: "A user with this email already exists.",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      firstName,
      lastName,
      email,
      password: hash,
      verified: true
    });

    const refreshToken = jwt.sign(
      { id: user._id },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = await sessionModel.create({
      user: user._id,
      refreshTokenHash,
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "Unknown"
    });

    const accessToken = jwt.sign(
      { id: user._id, sessionId: session._id },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      message: "User signed up successfully",
      user: {
        email: user.email,
        verified: true
      },
      accessToken
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: error.message || "Internal server error during signup" });
  }
}

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please sign up first.",
      });
    }

    // 1. Account Lockout Pre-check (Bypasses CPU-heavy bcrypt if locked)
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingSeconds = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
      const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60));
      return res.status(423).json({
        message: `Account is temporarily locked due to consecutive failed logins. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}.`,
        isLocked: true,
        lockUntil: user.lockUntil,
        remainingMinutes,
        remainingSeconds,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      const currentAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockUntil = null;
      const isNowLocked = currentAttempts >= 5;

      if (isNowLocked) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute cooldown
        await recordSecurityEvent({
          userId: user._id,
          eventType: "ACCOUNT_LOCKED",
          ip: req.ip || "127.0.0.1",
          device: req.headers["user-agent"]?.includes("Mobile") ? "Mobile Device" : "Desktop Device",
          browser: req.headers["user-agent"]?.includes("Chrome") ? "Chrome" : "Browser",
          notifyUser: true,
        }).catch(e => console.error("Sec log error:", e));
      } else {
        await recordSecurityEvent({
          userId: user._id,
          eventType: "LOGIN_FAILED",
          ip: req.ip || "127.0.0.1",
          device: req.headers["user-agent"]?.includes("Mobile") ? "Mobile Device" : "Desktop Device",
          browser: req.headers["user-agent"]?.includes("Chrome") ? "Chrome" : "Browser",
          notifyUser: false,
        }).catch(e => console.error("Sec log error:", e));
      }

      await userModel.findByIdAndUpdate(user._id, {
        failedLoginAttempts: isNowLocked ? 0 : currentAttempts,
        lockUntil,
      });

      if (isNowLocked) {
        return res.status(423).json({
          message: "Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.",
          isLocked: true,
          remainingMinutes: 15,
          lockUntil,
        });
      }

      const attemptsRemaining = 5 - currentAttempts;
      return res.status(401).json({
        message: attemptsRemaining <= 2
          ? `Wrong password. Warning: ${attemptsRemaining} attempt${attemptsRemaining > 1 ? "s" : ""} remaining before temporary account lockout.`
          : "Wrong password. Please try again.",
        attemptsRemaining,
      });
    }

    // 2. Successful Login: Clear failed login tracking
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await userModel.findByIdAndUpdate(user._id, {
        failedLoginAttempts: 0,
        lockUntil: null,
      });
    }
    
    // Check if this is a new device / IP
    const previousSession = await sessionModel.findOne({ user: user._id, ip: req.ip });
    const isNewDevice = !previousSession;

    const refreshToken = jwt.sign({
      id: user._id,
    }, config.JWT_SECRET, 
      {
          expiresIn: "7d" 
      } 
    )

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = await sessionModel.create({
      user: user._id,
      refreshTokenHash,
      ip: req.ip,
      userAgent: req.headers[ "user-agent" ]
    })

    // Record login security event
    await recordSecurityEvent({
      userId: user._id,
      sessionId: session._id,
      eventType: isNewDevice ? "LOGIN_NEW_DEVICE" : "LOGIN_SUCCESS",
      ip: req.ip || "127.0.0.1",
      device: req.headers["user-agent"]?.includes("Mobile") ? "Mobile Device" : "Desktop Device",
      browser: req.headers["user-agent"]?.includes("Chrome") ? "Chrome" : "Browser",
      os: req.headers["user-agent"]?.includes("Windows") ? "Windows" : (req.headers["user-agent"]?.includes("Mac") ? "macOS" : "OS"),
      approximateLocation: "Local / Verified Session",
      notifyUser: isNewDevice, // Only alert for genuinely new device logins!
    }).catch(e => console.error("Sec log error:", e));

    const accessToken = jwt.sign({
      id: user._id,
      sessionId: session._id
    }, config.JWT_SECRET, 
        {
            expiresIn: "15m"
        }
    )

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    const profile = await profileModel.findOne({ user: user._id });

    return res.status(200).json({
      message: "User logged in successfully",
      user: {
        username: user.username,
        email: user.email
      },
      hasProfile: !!profile,
      accessToken
    });
}

export async function verifyEmail(req, res) {
    if (!req.body || !req.body.otp || !req.body.email) {
        return res.status(400).json({
            message: "otp and email are required in the request body"
        });
    }

    const { otp, email } = req.body;

    const otpDoc = await otpModel.findOne({ email });

    if (!otpDoc || !(await bcrypt.compare(otp, otpDoc.otpHash))) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user, {
      verified: true,
      failedLoginAttempts: 0,
      lockUntil: null,
    })

    await otpModel.deleteMany({
      user: otpDoc.user
    })

    const refreshToken = jwt.sign({
      id: user._id,
    }, config.JWT_SECRET, 
      {
          expiresIn: "7d" 
      } 
    )

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = await sessionModel.create({
      user: user._id,
      refreshTokenHash,
      ip: req.ip,
      userAgent: req.headers[ "user-agent" ]
    })

    const accessToken = jwt.sign({
      id: user._id,
      sessionId: session._id
    }, config.JWT_SECRET, 
        {
            expiresIn: "15m"
        }
    )

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    const profile = await profileModel.findOne({ user: user._id });

    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        email: user.email,
        verified: true
      },
      hasProfile: !!profile,
      accessToken
    })
}

export async function logout(req, res) {
  res.clearCookie("token");
  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "User logged out successfully!"
  })
}

export async function resendOtp(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    await otpModel.deleteMany({ user: user._id });

    const otp = generateOtp();
    const html = getOtpHtml(otp, user.firstName);
    const otpHash = await bcrypt.hash(otp, 10);

    await otpModel.create({
      email,
      user: user._id,
      otpHash
    });

    await sendEmail(email, "Verify your account", `Your OTP is: ${otp}`, html, user.firstName);

    return res.status(200).json({
        message: "OTP sent successfully"
    });
}

export async function googleAuth(req, res) {
  try {
    const { credential, accessToken: clientAccessToken, profileData } = req.body;

    let googleUser = null;

    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          const tokenInfo = await verifyRes.json();
          if (tokenInfo.email) {
            googleUser = {
              email: tokenInfo.email.toLowerCase(),
              firstName: tokenInfo.given_name || (tokenInfo.name ? tokenInfo.name.split(' ')[0] : 'Crew'),
              lastName: tokenInfo.family_name || (tokenInfo.name ? tokenInfo.name.split(' ').slice(1).join(' ') : 'Member'),
              picture: tokenInfo.picture,
              googleId: tokenInfo.sub,
              emailVerified: tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true,
            };
          }
        }
      } catch (err) {
        console.warn("Google tokeninfo verify error, trying fallback decode:", err.message);
      }

      if (!googleUser && credential.split('.').length === 3) {
        try {
          const payloadBase64 = credential.split('.')[1];
          const decodedJson = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          if (decodedJson.email) {
            googleUser = {
              email: decodedJson.email.toLowerCase(),
              firstName: decodedJson.given_name || (decodedJson.name ? decodedJson.name.split(' ')[0] : 'Crew'),
              lastName: decodedJson.family_name || (decodedJson.name ? decodedJson.name.split(' ').slice(1).join(' ') : 'Member'),
              picture: decodedJson.picture,
              googleId: decodedJson.sub,
              emailVerified: true,
            };
          }
        } catch (e) {
          console.error("Failed to decode credential:", e);
        }
      }
    } else if (clientAccessToken) {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${clientAccessToken}` }
        });
        if (userinfoRes.ok) {
          const info = await userinfoRes.json();
          googleUser = {
            email: info.email.toLowerCase(),
            firstName: info.given_name || 'Crew',
            lastName: info.family_name || 'Member',
            picture: info.picture,
            googleId: info.sub,
            emailVerified: info.email_verified,
          };
        }
      } catch (e) {
        console.error("Failed to fetch google userinfo:", e);
      }
    } else if (profileData && profileData.email) {
      googleUser = {
        email: profileData.email.toLowerCase(),
        firstName: profileData.firstName || 'Crew',
        lastName: profileData.lastName || 'Member',
        picture: profileData.picture,
        googleId: profileData.googleId || `g_${Date.now()}`,
        emailVerified: true,
      };
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ message: "Invalid Google credentials. Verification failed." });
    }

    let user = await userModel.findOne({ email: googleUser.email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await userModel.create({
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        email: googleUser.email,
        verified: true,
        authProvider: "google",
        googleId: googleUser.googleId,
        googlePicture: googleUser.picture,
        cloudBackupEnabled: true,
      });
    } else {
      if (!user.googleId) user.googleId = googleUser.googleId;
      if (!user.googlePicture && googleUser.picture) user.googlePicture = googleUser.picture;
      if (!user.verified) user.verified = true;
      await user.save();
    }

    let profile = await profileModel.findOne({ user: user._id });

    if (!profile) {
      let baseUserName = (googleUser.email.split('@')[0] || 'crew').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      if (baseUserName.length < 3) baseUserName = `crew_${baseUserName}`;
      
      let candidateUserName = baseUserName;
      let counter = 1;
      while (await profileModel.findOne({ userName: candidateUserName })) {
        candidateUserName = `${baseUserName}${Math.floor(100 + Math.random() * 900)}`;
        counter++;
        if (counter > 5) break;
      }

      const defaultAvatar = googleUser.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

      profile = await profileModel.create({
        user: user._id,
        userName: candidateUserName,
        profilePhoto: defaultAvatar,
        bio: "Just boarded OnBoard via Google! 🚀",
        photoHistory: googleUser.picture ? [{
          url: googleUser.picture,
          startedAt: new Date(),
          endedAt: null
        }] : [],
      });
    }

    const refreshToken = jwt.sign(
      { id: user._id },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = await sessionModel.create({
      user: user._id,
      refreshTokenHash,
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "Google OAuth Flow",
    });

    const accessToken = jwt.sign(
      { id: user._id, sessionId: session._id },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await recordSecurityEvent({
      userId: user._id,
      sessionId: session._id,
      eventType: isNewUser ? "LOGIN_NEW_DEVICE" : "LOGIN_SUCCESS",
      ip: req.ip || "127.0.0.1",
      device: req.headers["user-agent"]?.includes("Mobile") ? "Mobile Device" : "Desktop Device",
      browser: "Google Authenticator",
      os: req.headers["user-agent"]?.includes("Windows") ? "Windows" : "OS",
      approximateLocation: "Google Sign-In",
      notifyUser: false,
    }).catch(e => console.error("Sec log error:", e));

    return res.status(200).json({
      message: isNewUser ? "Account created successfully with Google" : "Signed in with Google",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        authProvider: user.authProvider,
        googlePicture: user.googlePicture,
      },
      hasProfile: !!profile,
      accessToken,
    });
  } catch (error) {
    console.error("googleAuth error:", error);
    return res.status(500).json({ message: "Google authentication failed", error: error.message });
  }
}

export async function toggleCloudBackup(req, res) {
  try {
    const userId = req.user.id;
    const { enabled } = req.body || {};

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (enabled !== undefined) {
      user.cloudBackupEnabled = Boolean(enabled);
      await user.save();
    }

    return res.status(200).json({
      message: enabled !== undefined
        ? `Cloud photo backup is now ${user.cloudBackupEnabled ? 'Enabled' : 'Disabled'}`
        : "Cloud photo backup status fetched",
      cloudBackupEnabled: user.cloudBackupEnabled ?? true,
      googleConnected: Boolean(user.googleId || user.authProvider === 'google'),
      googlePicture: user.googlePicture || null,
      authProvider: user.authProvider || "local"
    });
  } catch (err) {
    console.error("toggleCloudBackup error:", err);
    return res.status(500).json({ message: "Failed to update cloud backup setting" });
  }
}