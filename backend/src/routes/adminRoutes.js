import express from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import User from '../models/User.js'
import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post("/get-signed-url", async (req, res) => {
    try {
        console.log("Session at get-signed-url:", req.session); // 🛠️ Debugging Session

        if (!req.session?.isAdmin) {
            return res.status(401).json({ error: "Unauthorized. Admins only." });
        }

        const { filePath } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: "File path is required." });
        }

        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .createSignedUrl(filePath, 900); // 900 seconds = 15 min

        if (error || !data?.signedUrl) {
            console.error("Supabase error:", error); // 🛠️ Debugging
            return res.status(500).json({ error: "Failed to generate signed URL." });
        }

        res.json({ signedUrl: data.signedUrl });

    } catch (error) {
        console.error("General Error:", error); // 🛠️ Debugging
        res.status(500).json({ error: "Server Error" });
    }
});


// LOGIN
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;

    try {
        const admin = await Admin.findOne({ phoneNumber });
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, admin.passwordHash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        req.session.isAdmin = true;
        req.session.adminId = admin._id;

        res.status(200).json({ success: true, message: 'Login successful' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


// LOGOUT
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

router.get('/submissions', isAdminAuthenticated, async (req, res) => {
    try {
        const submissions = await User.find().sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

router.get('/check-auth', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

router.post("/admin-login", (req, res) => {
    req.session.isAdmin = true;
    res.json({ message: "Admin login successful!" });
});

router.get("/admin/users", async (req, res) => {
    try {
        console.log("Admin session at /admin/users:", req.session); // 🛠️
        if (!req.session.isAdmin) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const users = await User.find(); // 🛠️ Make sure this works
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

// MIDDLEWARE
export function isAdminAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}


export default router;
