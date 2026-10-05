import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  createSquad,
  getSquads,
  getSquadById,
  joinSquad,
  leaveSquad,
  updateMemberRole,
  removeMember,
  updateSquadSettings,
  inviteMembers,
  getSquadMessages,
  sendSquadMessage,
} from "../controllers/squad.controller.js";

const squadRouter = express.Router();

squadRouter.use(authUser);

squadRouter.post("/", createSquad);
squadRouter.get("/", getSquads);
squadRouter.get("/:id", getSquadById);
squadRouter.post("/:id/join", joinSquad);
squadRouter.post("/:id/leave", leaveSquad);
squadRouter.put("/:id/members/role", updateMemberRole);
squadRouter.delete("/:id/members/:targetUserId", removeMember);
squadRouter.put("/:id/settings", updateSquadSettings);
squadRouter.post("/:id/invite", inviteMembers);
squadRouter.get("/:id/messages", getSquadMessages);
squadRouter.post("/:id/messages", sendSquadMessage);

export default squadRouter;
