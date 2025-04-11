import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^[6-9]\d{9}$/, "Invalid phone number format"],
    },
    passwordHash: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);
export default Admin;
