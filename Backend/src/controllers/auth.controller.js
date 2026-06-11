import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from "../models/user.model.js";
import profileModel from '../models/profile.model.js';
import config from '../config/config.js';
import { sendEmail } from '../services/email.service.js';
import { generateOtp, getOtpHtml } from '../utils/utils.js';
import otpModel from '../models/otp.model.js';
import sessionModel from '../models/session.model.js';


export async function signup(req, res) {

    const { firstName, lastName, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
      email,
    });

    if (isUserAlreadyExists) {
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
    });

    const otp = generateOtp();
    const html = getOtpHtml(otp, firstName);

    const otpHash = await bcrypt.hash(otp, 10);
    
    await otpModel.create({
      email,
      user: user._id,
      otpHash
    })

    await sendEmail(email, "Verify you account", `Your OTP is: ${otp}`, html, firstName);

    return res.status(201).json({
      message: "User signed up successfully",
      user:{
        email: user.email,
        verified: user.verified
      }
    });
}

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please sign up first.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Wrong password. Please try again.",
      });
    }
    
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
      verified: true
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

    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        email: user.email,
        verified: true
      },
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