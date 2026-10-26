const express = require("express");
const multer = require("multer");

const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError1.js");
const { isLoggedIn, isOwner } = require("../middilware.js");
const ListingController = require("../controllers/listings.js");
const { storage } = require("../cloudconfig.js");

const router = express.Router();

const upload = multer({ storage });

const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);

    if (error) {
        const errMsg = error.details
            .map((element) => element.message)
            .join(", ");

        throw new ExpressError(400, errMsg);
    }

    next();
};

// Display listings and handle search.
router
    .route("/")
    .get(ListingController.index)
    .post(
        isLoggedIn,
        upload.single("listing[image][url]"),
        validateListing,
        ListingController.createNewListing,
    );

// Render the new listing form.
router.route("/new").get(
    isLoggedIn,
    ListingController.renderNewForm,
);

// Display, update, and delete a listing.
router
    .route("/:id")
    .get(ListingController.showSingleListing)
    .patch(
        isLoggedIn,
        isOwner,
        upload.single("listing[image][url]"),
        validateListing,
        ListingController.updateListing,
    )
    .delete(
        isLoggedIn,
        isOwner,
        ListingController.deleteListing,
    );

// Render the listing edit form.
router.route("/:id/edit").get(
    isLoggedIn,
    isOwner,
    ListingController.showEditListing,
);

module.exports = router;