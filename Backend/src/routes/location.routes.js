import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  sendCurrentLocation,
  startLiveLocation,
  updateLiveLocation,
  stopLiveLocation,
  stopAllLiveLocations,
  getActiveLocationShares,
  getLocationDetails,
  saveLocationToBoard,
} from "../controllers/location.controller.js";

const locationRouter = express.Router();

locationRouter.use(authUser);

// Send one-time snapshot
locationRouter.post(
  "/conversations/:conversationId/current",
  sendCurrentLocation
);

// Start live sharing
locationRouter.post("/conversations/:conversationId/live", startLiveLocation);

// Active Location Center & bulk actions
locationRouter.get("/active", getActiveLocationShares);
locationRouter.post("/stop-all", stopAllLiveLocations);

// Individual live share management
locationRouter.get("/:locationShareId", getLocationDetails);
locationRouter.patch("/:locationShareId/update", updateLiveLocation);
locationRouter.post("/:locationShareId/stop", stopLiveLocation);
locationRouter.post("/:locationShareId/save-to-board", saveLocationToBoard);

export default locationRouter;
