const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true }, // Product ID
        name: { type: String, required: true },
        brand: { type: String, required: true },
        category: { type: String, required: true },
        subCategory: { type: String },

        description: { type: String },

        features: {
            fabric: { type: String },
            pattern: { type: String },
            fit: { type: String },
            neck: { type: String },
            sleeve: { type: String },
            style: { type: String },
        },

        sizes: [
            {
                size: { type: String, enum: ["XS", "S", "M", "L", "XL"] },
                available: { type: Boolean, default: false },
            },
        ],

        colors: [
            {
                name: { type: String, required: true },
                hexCode: { type: String, default: "#000000" },
                image: { type: String }, // Single image URL
            },
        ],

        price: {
            currency: { type: String, default: "USD" },
            amount: { type: Number, required: true },
        },

        stock: { type: Number, default: 0 },

        rating: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },

        media: {
            images: [{ type: String }],
            video: { type: String },
        },

        shipping: {
            freeShipping: { type: Boolean, default: false },
            returnAvailable: { type: Boolean, default: false },
            estimatedDelivery: { type: String },
        },

        similarProducts: [
            {
                productId: { type: String },
                name: { type: String },
                price: { type: Number },
                brand: { type: String },
                image: { type: String },
            },
        ],

        comments: [
            {
                userId: { type: String, required: true }, // reference to User
                username: { type: String }, // optional, display name
                comment: { type: String, required: true },
                rating: { type: Number, min: 1, max: 5 }, // per-comment rating
                createdAt: { type: Date, default: Date.now },
            },
        ],

        meta: {
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
        },
    },
    { timestamps: true } // Auto-manages createdAt & updatedAt
);

module.exports = mongoose.model("Product", productSchema);
