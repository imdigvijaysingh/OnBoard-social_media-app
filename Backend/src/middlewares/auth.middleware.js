import jwt from "jsonwebtoken";
import config from "../config/config.js";

export function authUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const cookieToken =
      req.cookies.token || req.cookies.accessToken || req.cookies.refreshToken;
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ 
        message: "Unauthorized" 
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({  
        message: "Invalid token" 
    });
  }
}

export function optionalAuthUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const cookieToken =
      req.cookies.token || req.cookies.accessToken || req.cookies.refreshToken;
    const token = bearerToken || cookieToken;

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = decoded;
    }
  } catch {
    // Silently continue for unauthenticated or expired users
  }
  next();
}
