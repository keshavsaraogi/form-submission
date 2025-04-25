import express from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import User from '../models/User.js'
import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
import PDFDocument from "pdfkit";
import archiver from "archiver";
import stream from "stream";
import fs from 'fs-extra';
import path from 'path';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post("/get-signed-url", async (req, res) => {
    try {
        console.log("Session at get-signed-url:", req.session);

        if (!req.session?.isAdmin) {
            return res.status(401).json({ error: "Unauthorized. Admins only." });
        }

        const { filePath } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: "File path is required." });
        }

        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .createSignedUrl(filePath, 900);

        if (error || !data?.signedUrl) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: "Failed to generate signed URL." });
        }

        res.json({ signedUrl: data.signedUrl });

    } catch (error) {
        console.error("General Error:", error);
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

router.get('/check-auth', (req, res) => {
    if (req.session && req.session.admin) {
        return res.status(200).json({ isAuthenticated: true });
    } else {
        return res.status(401).json({ isAuthenticated: false });
    }
});

router.post('/logout', (req, res) =>{
    req.session.destroy((err) => {
        if (err) {
            console.log("Error Destroying Session:", err);
            return res.status(500).json({message: "Logout Failed"})
        }
        res.clearCookie('connect.sid', {
            secure: true,
            sameSite: 'None',
            httpOnly: true
        })
        return res.status(200).json({message: "Logout Successful" })
    })
}) 

router.get("/admin/download-all-pdfs", isAdminAuthenticated, async (req, res) => {
    try {
        const users = await User.find(); // You can filter to only verified users if needed

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", "attachment; filename=submissions.zip");

        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.pipe(res);

        for (const user of users) {
            const doc = new PDFDocument();
            const bufferStream = new stream.PassThrough();
            const chunks = [];

            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => {
                const pdfBuffer = Buffer.concat(chunks);
                archive.append(pdfBuffer, { name: `${user.fullName || "user"}-${user._id}.pdf` });
            });

            doc.fontSize(16).text("User Submission", { underline: true });
            doc.moveDown();
            doc.text(`Name: ${user.fullName || "-"}`);
            doc.text(`Firm Name: ${user.firmName || "-"}`);
            doc.text(`GST Number: ${user.gstNumber || "-"}`);
            doc.text(`Sales Rep Number: ${user.salesRepNumber || "-"}`);
            doc.text(`Contact Number: ${user.contactNumber || "-"}`);
            doc.text(`Verified: ${user.verified ? "Yes" : "No"}`);
            doc.text(`Checklist: Cheque - ${user.checklist?.cheque ? "✓" : "✗"}, Letterhead - ${user.checklist?.letterhead ? "✓" : "✗"}`);
            doc.text(`Submitted At: ${new Date(user.createdAt).toLocaleString()}`);
            doc.end();
        }

        archive.finalize();
    } catch (error) {
        console.error("Error generating PDFs:", error);
        res.status(500).json({ error: "Failed to generate PDFs." });
    }
});


router.post("/admin/generate-pdf/:id", isAdminAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);

        page.drawText(`Firm Name: ${user.firmName}`, { x: 50, y: 750 });
        page.drawText(`GST Number: ${user.gstNumber}`, { x: 50, y: 730 });

        const pdfBytes = await pdfDoc.save();
        const safeGst = user.gstNumber?.replace(/[^a-zA-Z0-9]/g, "_") || "no_gst";
        const outputPath = path.join(__dirname, `../generated/${safeGst}.pdf`);

        await fs.outputFile(outputPath, pdfBytes);

        console.log(`✅ Generated PDF saved to ${outputPath}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("PDF generation failed:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/admin/download-pdf/:id", isAdminAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const safeGst = user.gstNumber?.replace(/[^a-zA-Z0-9]/g, "_") || "no_gst";
        const filePath = path.join(__dirname, `../generated/${safeGst}.pdf`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${safeGst}.pdf"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (err) {
        console.error("Download error:", err);
        res.status(500).json({ error: "Failed to download" });
    }
});

router.patch("/admin/user/:id/notes", isAdminAuthenticated, async (req, res) => {
    try {
        const { notes } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { notes },
            { new: true }
        );
        res.status(200).json({ success: true, notes: user.notes });
    } catch (error) {
        console.error("Error updating notes:", error);
        res.status(500).json({ error: "Failed to update notes" });
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
