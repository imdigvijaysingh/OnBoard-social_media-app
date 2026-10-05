import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";
import profileRouter from "./routes/profile.routes.js";
import createPostRouter from "./routes/createPost.routes.js";
import postRouter from "./routes/post.routes.js";
import chatRouter from "./routes/chat.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import accountRouter from "./routes/account.routes.js";
import safetyRouter from "./routes/safety.routes.js";
import squadRouter from "./routes/squad.routes.js";
import chapterRouter from "./routes/chapter.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://onboardsocial.netlify.app"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(morgan("combined"));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/create-post", createPostRouter);
app.use("/api/posts", postRouter);
app.use("/api/chat", chatRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/account", accountRouter);
app.use("/api/safety", safetyRouter);
app.use("/api/squads", squadRouter);
app.use("/api/chapters", chapterRouter);

export default app;
