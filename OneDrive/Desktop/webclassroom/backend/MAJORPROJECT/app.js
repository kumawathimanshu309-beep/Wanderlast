
// Load environment variables
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

// Import dependencies
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

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;
const dbUrl = process.env.ATLASDB_URL;
const sessionSecret = process.env.SECRET;

// Configure EJS
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configure middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
let dbConnectionPromise = null;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!dbUrl || !/^mongodb(\+srv)?:\/\//.test(dbUrl)) {
        throw new Error("Invalid ATLASDB_URL environment variable.");
    }

    if (!dbConnectionPromise) {
        dbConnectionPromise = mongoose
            .connect(dbUrl)
            .then(() => {
                console.log("MongoDB Atlas connected successfully.");
            })
            .catch((error) => {
                dbConnectionPromise = null;
                throw error;
            });
    }

    await dbConnectionPromise;
}

// Configure session
if (!MongoStore || typeof MongoStore.create !== "function") {
    throw new Error("Invalid connect-mongo import.");
}

if (!sessionSecret) {
    throw new Error("SECRET is missing from environment variables.");
}

app.use(
    session({
        name: "wanderlust.sid",
        secret: sessionSecret,
        store: MongoStore.create({
            mongoUrl: dbUrl,
            collectionName: "sessions",
            ttl: 7 * 24 * 60 * 60,
        }),
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

// Configure flash messages
app.use(flash());

// Configure Passport authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Set shared EJS variables
app.use((req, res, next) => {
    res.locals.currUser = req.user || null;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.MAP_TOKEN = process.env.MAP_TOKEN;
    next();
});

// Connect to database before handling requests
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(error);
    }
});

// Register application routes
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Handle 404 errors
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

// Handle application errors
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message =
        statusCode === 500
            ? "Something went wrong"
            : err.message || "Something went wrong";

    console.error("Application error:", err.message);

    res.status(statusCode).render("listings/error.ejs", {
        message,
    });
});

// Export Express application for Vercel
module.exports = app;

// Start local development server
if (!process.env.VERCEL) {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server running at http://localhost:${PORT}`);
            });
        })
        .catch((error) => {
            console.error("Application startup failed:", error.message);
            process.exit(1);
        });
}
