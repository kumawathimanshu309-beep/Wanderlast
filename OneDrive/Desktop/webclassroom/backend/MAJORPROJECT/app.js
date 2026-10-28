
// Load environment variables
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const ExpressError = require("./utils/ExpressError1.js");
const listingsRouter = require("./routes/listings.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const User = require("./models/user.js");

const app = express();

const PORT = process.env.PORT || 3000;
const dbUrl = process.env.ATLASDB_URL;

// View engine configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Shared template variables
app.use((req, res, next) => {
    res.locals.MAP_TOKEN = process.env.MAP_TOKEN;
    next();
});

// Session configuration
if (!MongoStore || typeof MongoStore.create !== "function") {
    throw new Error(
        "Invalid connect-mongo import. Check your installed connect-mongo version."
    );
}

app.use(
    session({
        store: MongoStore.create({
            mongoUrl: dbUrl,
            collectionName: "sessions",
            ttl: 7 * 24 * 60 * 60,
        }),
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        },
    })
);

// Flash messages
app.use(flash());

// Passport authentication
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Shared authentication and flash variables
app.use((req, res, next) => {
    res.locals.currUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// Application routes
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 handler
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

// Central error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    const message =
        statusCode === 500
            ? "Something went wrong"
            : err.message || "Something went wrong";

    res.status(statusCode).render("listings/error.ejs", {
        message,
    });
});

// MongoDB connection
let isConnected = false;

async function connectDB() {
    if (isConnected) {
        return;
    }

    if (!dbUrl || !/^mongodb(\+srv)?:\/\//.test(dbUrl)) {
        throw new Error("Invalid ATLASDB_URL environment variable.");
    }

    if (!process.env.SECRET) {
        throw new Error("SECRET is missing from environment variables.");
    }

    await mongoose.connect(dbUrl);

    isConnected = true;
    console.log("MongoDB Atlas connected successfully.");
}

// Export Express app for Vercel
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection failed:", error.message);
        next(error);
    }
});

module.exports = app;

// Start local server only outside Vercel
if (!process.env.VERCEL) {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(
                    `Server is running on http://localhost:${PORT}`
                );
            });
        })
        .catch((error) => {
            console.error(
                "Application startup failed:",
                error.message
            );
            process.exit(1);
        });
}