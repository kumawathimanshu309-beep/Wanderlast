const User = require("../models/user.js");

const wrapAsync = require("../utils/warpAsync.js");

// Show signup form
module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

// Signup
module.exports.signup = wrapAsync(async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const newUser = new User({
            email,
            username,
        });

        const registeredUser = await User.register(
            newUser,
            password
        );

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }

            req.flash(
                "success",
                "Welcome to Wanderlust!"
            );

            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
});

// Show login form
module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

// Login
module.exports.login = (req, res, next) => {
    passport.authenticate(
        "local",
        (err, user, info) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                req.flash(
                    "error",
                    "Invalid username or password"
                );

                return res.redirect("/login");
            }

            req.login(user, (err) => {
                if (err) {
                    return next(err);
                }

                req.flash(
                    "success",
                    "Welcome back to Wanderlust!"
                );

                res.redirect("/listings");
            });
        }
    )(req, res, next);
};

// Logout
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.flash(
            "success",
            "You have been logged out!"
        );

        res.redirect("/listings");
    });
};