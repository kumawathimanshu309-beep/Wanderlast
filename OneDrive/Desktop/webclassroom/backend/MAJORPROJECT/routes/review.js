const express = require("express");

const {
    isLoggedIn,
    isReviewAuthor,
} = require("../middilware.js");

const ReviewController = require("../controllers/reviews.js");

const router = express.Router({
    mergeParams: true,
});


// Create review
router
    .route("/")
    .post(
        isLoggedIn,
        ReviewController.createReview
    );


// Delete review
router
    .route("/:reviewId")
    .delete(
        isLoggedIn,
        isReviewAuthor,
        ReviewController.deleteReview
    );


module.exports = router;