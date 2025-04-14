import cors from 'cors';
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import session from 'express-session';
import { fileURLToPath } from 'url';

import userRoutes from './src/routes/userRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';

dotenv.config();
const app = express();

app.set('trust proxy', 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: process.env.FRONTEND_URL, 
    credentials: true
}));

app.options('*', cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.PRODUCTION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: 1000 * 60 * 60,
      sameSite: 'None'
    },
  })
);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', adminRoutes);

app.get('/', (req, res) => res.send('🚀 API Running'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
