import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
        },
        firmName: {
            type: String,
            required: [true, "Firm name is required"],
        },
        gstNumber: {
            type: String,
            unique: true,
            required: [true, "GST number is required"],
            match: [
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                "Invalid GST number format",
            ],
        },
        salesRepNumber: {
            type: String,
            required: [true, "Sales Representative Number is required"],
        },
        contactNumber: {
            type: String,
            required: [true, "Contact number is required"],
            match: [/^\d{10}$/, "Contact number must be 10 digits"],
        },
        districtArea: { 
            type: String, 
            default: 'Enter District Area' 
        },
        documents: {
            gstCertificate: {
                type: String,
                required: [true, "GST Certificate file is required"],
            },
            aadharCard: {
                type: String,
                required: [true, "Aadhar Card file is required"],
            },
            pancard: {
                type: String,
                required: [true, "Pancard file is required"],
            },
            shopPhoto: {
                type: String,
                required: [true, "Shop Photo file is required"],
            },
        },
        checklist: {
            cheque: {
                type: Boolean,
                default: false,
            },
            letterhead: {
                type: Boolean,
                default: false,
            },
        },
        notes: {
            type: String, 
            default: ""
        },
    },
    {
        timestamps: true,
    }, 
    
);

UserSchema.pre('save', function (next) {
    if (this.gstNumber === this.contactNumber) {
        return next(new Error("GST Number and Contact Number cannot be the same"));
    }
    next();
});

const User = mongoose.model('User', UserSchema);
export default User;
