import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Create Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function uploadToSupabase(fileBuffer, filePath, mimeType) {
    const { data, error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(filePath, fileBuffer, {
            contentType: mimeType,
            upsert: true, // overwrite if exists
        });

    if (error) {
        console.error("❌ Failed to upload to Supabase:", error);
        throw new Error(`Upload failed: ${error.message}`);
    }

    console.log(`✅ Uploaded to Supabase: ${filePath}`);
    return data;
}

export { upload, uploadToSupabase };
