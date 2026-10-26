const Listing = require("../models/listing.js");

const Review = require("../models/review.js");

const wrapAsync = require("../utils/warpAsync.js");

const ExpressError = require("../utils/ExpressError1.js");

// Create review
module.exports.createReview = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(
            404,
            "Listing not found"
        );
    }

    const newReview = new Review(
        req.body.review
    );

    newReview.author = req.user._id;

    await newReview.save();

    listing.reviews.push(newReview._id);

    await listing.save();

    req.flash(
        "success",
        "Review added successfully!"
    );

    res.redirect(`/listings/${id}`);
});

// Delete review
module.exports.deleteReview = wrapAsync(async (req, res) => {
    const {
        id,
        reviewId,
    } = req.params;

    await Listing.findByIdAndUpdate(
        id,
        {
            $pull: {
                reviews: reviewId,
            },
        }
    );

    await Review.findByIdAndDelete(
        reviewId
    );

    req.flash(
        "success",
        "Review deleted successfully!"
    );

    res.redirect(`/listings/${id}`);
});