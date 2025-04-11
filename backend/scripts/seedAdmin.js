import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../src/models/Admin.js';

dotenv.config();

const seedAdmin = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await Admin.findOne({ phoneNumber: '9876543210' });
    if (existing) {
        console.log("Admin already exists.");
        process.exit(0);
    }

    const hashed = await bcrypt.hash('admin123', 10);
    await Admin.create({ phoneNumber: '9876543210', passwordHash: hashed });

    console.log("Admin created.");
    process.exit(0);
};

seedAdmin();

