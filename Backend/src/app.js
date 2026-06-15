import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRouter from './routes/auth.routes.js';
import profileRouter from './routes/profile.routes.js';
import createPostRouter from './routes/createPost.routes.js';
import postRouter from './routes/post.routes.js';

const app = express();

app.use(cors({
    origin: [
   "http://localhost:5174",
   "https://onboardsocial.netlify.app"
    ],
    credentials: true
}));

app.use(express.json());
app.use(morgan('combined'));
app.use(cookieParser())

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/create-post', createPostRouter);
app.use('/api/posts', postRouter);

export default app;