
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/warpAsync.js");
const ExpressError = require("../utils/ExpressError1.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN?.trim();

const geocodingClient = mapToken
    ? mbxGeocoding({ accessToken: mapToken })
    : null;

const getGeocodingClient = () => {
    if (!geocodingClient) {
        throw new ExpressError(
            500,
            "Mapbox configuration is missing. Please check MAP_TOKEN.",
        );
    }

    return geocodingClient;
};

// Display all listings and handle search.
module.exports.index = wrapAsync(async (req, res) => {
    const searchQuery =
        typeof req.query.search === "string"
            ? req.query.search.trim()
            : "";

    let filter = {};

    if (searchQuery) {
        const escapedQuery = searchQuery.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
        );

        const searchRegex = new RegExp(escapedQuery, "i");

        filter = {
            $or: [
                { title: searchRegex },
                { location: searchRegex },
                { country: searchRegex },
                { category: searchRegex },
                { description: searchRegex },
            ],
        };
    }

    const allListings = await Listing.find(filter)
        .populate("owner")
        .sort({ _id: -1 });

    res.render("listings/index.ejs", {
        allListings,
        searchQuery,
    });
});

// Render the new listing form.
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// Create a new listing.
module.exports.createNewListing = wrapAsync(async (req, res) => {
    if (!req.file) {
        throw new ExpressError(400, "Please upload an image");
    }

    const { location, country } = req.body.listing;

    const response = await getGeocodingClient()
        .forwardGeocode({
            query: `${location}, ${country}`,
            limit: 1,
        })
        .send();

    if (!response.body.features?.length) {
        throw new ExpressError(
            400,
            "Location could not be found. Please enter a valid location.",
        );
    }

    const geometry = response.body.features[0].geometry;
    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
    };

    newListing.geometry = {
        type: "Point",
        coordinates: geometry.coordinates,
    };

    await newListing.save();

    req.flash("success", "Listing was created successfully!");
    res.redirect("/listings");
});

// Render the edit listing form.
module.exports.showEditListing = wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    res.render("listings/edit.ejs", {
        listing,
    });
});

// Update an existing listing.
module.exports.updateListing = wrapAsync(async (req, res) => {
    const { id } = req.params;

    if (!req.body?.listing) {
        throw new ExpressError(400, "Send valid data for listing");
    }

    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    const { location, country } = req.body.listing;

    const response = await getGeocodingClient()
        .forwardGeocode({
            query: `${location}, ${country}`,
            limit: 1,
        })
        .send();

    if (!response.body.features?.length) {
        throw new ExpressError(
            400,
            "Location could not be found. Please enter a valid location.",
        );
    }

    const geometry = response.body.features[0].geometry;

    listing.title = req.body.listing.title;
    listing.description = req.body.listing.description;
    listing.price = req.body.listing.price;
    listing.location = location;
    listing.country = country;

    listing.geometry = {
        type: "Point",
        coordinates: geometry.coordinates,
    };

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    await listing.save();

    req.flash("success", "Listing was updated successfully!");
    res.redirect(`/listings/${id}`);
});

// Delete a listing.
module.exports.deleteListing = wrapAsync(async (req, res) => {
    const { id } = req.params;
    const deletingListing = await Listing.findByIdAndDelete(id);

    if (!deletingListing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    req.flash("success", "Listing was deleted successfully!");
    res.redirect("/listings");
});

// Display a single listing and its reviews.
module.exports.showSingleListing = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    if (
        !listing.geometry ||
        !Array.isArray(listing.geometry.coordinates) ||
        listing.geometry.coordinates.length !== 2
    ) {
        const response = await getGeocodingClient()
            .forwardGeocode({
                query: `${listing.location}, ${listing.country}`,
                limit: 1,
            })
            .send();

        if (response.body.features?.length) {
            listing.geometry = {
                type: "Point",
                coordinates: response.body.features[0].geometry.coordinates,
            };

            await listing.save();
        }
    }

    res.render("listings/show.ejs", {
        listing,
    });
});

