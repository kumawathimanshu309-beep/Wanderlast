const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
    },

    image: {
        filename: String,
        url: String,
    },

    price: {
        type: Number,
        min: 0,
    },

    location: {
        type: String,
        required: true,
    },

    country: {
        type: String,
        required: true,
    },

    category: {
        type: String,
        enum: [
            "Trending",
            "Rooms",
            "Iconic Cities",
            "Mountains",
            "Castles",
            "Amazing Pools",
            "Camping",
            "Farms",
            "Arctic",
        ],
        default: "Trending",
    },

    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
        },

        coordinates: {
            type: [Number],
            required: true,
        },
    },

    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

module.exports = mongoose.model(
    "Listing",
    listingSchema
);