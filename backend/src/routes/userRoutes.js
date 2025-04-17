import path from 'path'
import express from 'express';
import { v4 as uuidv4 } from 'uuid'
import User from '../models/User.js';
import { upload, uploadToSupabase } from "../middleware/uploadMiddleware.js";

const router = express.Router();

const uploadFields = upload.fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "aadharCard", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
]);

router.post("/upload", uploadFields, async (req, res) => {
    try {
        const { gstNumber, fullName, firmName, salesRepNumber, contactNumber } = req.body;
        const files = req.files;

        // ✅ Validate input
        if (!gstNumber || !fullName || !firmName || !salesRepNumber || !contactNumber) {
            return res.status(400).json({ error: "All required fields must be filled." });
        }

        if (!files?.gstCertificate || !files?.aadharCard || !files?.panCard || !files?.shopPhoto) {
            return res.status(400).json({ error: "All 4 documents must be uploaded." });
        }

        // ✅ Mapping document names
        const fileMappings = {
            gstCertificate: "GST-Certificate.pdf",
            aadharCard: "Aadhar-Card.pdf",
            panCard: "PAN-Card.pdf",
            shopPhoto: "Shop-Photo.pdf",
        };

        const uploadedFilePaths = {};

        // ✅ Upload each file
        for (const [fieldName, cleanFileName] of Object.entries(fileMappings)) {
            const file = files[fieldName]?.[0];
            if (!file) continue;

            const filePath = `uploads/${gstNumber}/${cleanFileName}`;
            console.log("Uploading file to path:", filePath);

            const blob = new Blob([file.buffer], { type: file.mimetype }); // ✅ Blob to avoid random filenames

            await uploadToSupabase(blob, filePath, file.mimetype);

            uploadedFilePaths[fieldName] = filePath;
        }

        // ✅ Insert user into MongoDB inside a try-catch block
        try {
            const newUser = await User.create({
                fullName,
                firmName,
                gstNumber,
                salesRepNumber,
                contactNumber,
                documents: uploadedFilePaths,
                checklist: {
                    cheque: false,
                    letterhead: false,
                },
                verified: false,
                notes: "",
            });

            return res.status(200).json({ message: "Form submitted successfully!", user: newUser });

        } catch (error) {
            if (error.code === 11000) {
                // ✅ MongoDB duplicate key error (Duplicate GST Number)
                return res.status(400).json({ error: "Duplicate GST Number" });
            }
            console.error(error);
            return res.status(500).json({ error: "Server Error" });
        }

    } catch (error) {
        console.error("❌ Upload Error:", error);
        return res.status(500).json({ error: "Upload failed. Please try again." });
    }
});


router.post('/',
    upload.fields([
        { name: 'gstCertificate', maxCount: 1 },
        { name: 'aadharCard', maxCount: 1 },
        { name: 'pancard', maxCount: 1 },
        { name: 'shopPhoto', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const {
                fullName,
                firmName,
                gstNumber,
                salesRepNumber,
                contactNumber,
                districtArea,
                cheque,
                letterhead,
                notes,
            } = req.body;

            const files = req.files;
            const uploadedDocuments = {};

            // Upload each file to Backblaze B2
            for (const field in files) {
                const file = files[field][0];
                const fileName = `uploads/${uuidv4()}${path.extname(file.originalname)}`; // ✅ CORRECTED: fileName with capital N

                await uploadToSupabase(file.buffer, fileName, file.mimetype);  // ✅ Use same
                uploadedDocuments[field] = fileName;
            }

            // Skip saving if no user info and no documents
            const hasUserInfo = fullName || firmName || gstNumber || salesRepNumber || contactNumber || districtArea;
            const hasDocuments = Object.keys(uploadedDocuments).length > 0;

            if (!hasUserInfo && !hasDocuments) {
                return res.status(400).json({ error: 'Invalid submission. Must include user info or documents.' });
            }

            const newUser = new User({
                fullName,
                firmName,
                gstNumber,
                salesRepNumber,
                contactNumber,
                districtArea,
                documents: uploadedDocuments,
                checklist: {
                    cheque: cheque === 'true',
                    letterhead: letterhead === 'true',
                },
                notes,
            });

            await newUser.save();

            res.status(201).json(newUser);
        } catch (err) {
            console.error(err);
            if (err.code === 11000 && err.keyPattern?.gstNumber) {
                return res.status(400).json({ error: { message: "GST Number already exists" } });
            }
            res.status(500).json({ error: { message: "Server error", details: err.message } });
        }
    }
);

// Fetch All Users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Verify / Unverify User
router.patch('/:id/verify', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.verified = true;
        await user.save();

        res.status(200).json({ message: 'User verified successfully' });
    } catch (err) {
        console.error('Error verifying user:', err);
        res.status(500).json({ message: 'Failed to verify user' });
    }
});

// Update Checklist
router.patch('/:id/checklist', async (req, res) => {
    try {
        const { cheque, letterhead } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (typeof cheque !== 'undefined') user.checklist.cheque = cheque;
        if (typeof letterhead !== 'undefined') user.checklist.letterhead = letterhead;

        await user.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update checklist' });
    }
});

// Delete User
router.delete('/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
