const express = require("express");
const passport = require("passport");

const User = require("../models/user.js");
const wrapAsync = require("../utils/warpAsync.js");

const router = express.Router();


// Signup
router
    .route("/signup")
    .get((req, res) => {
        res.render("users/signup.ejs");
    })
    .post(
        wrapAsync(async (req, res, next) => {
            try {
                const {
                    username,
                    email,
                    password,
                } = req.body;

                const newUser = new User({
                    username,
                    email,
                });

                const registeredUser =
                    await User.register(
                        newUser,
                        password
                    );

                req.login(
                    registeredUser,
                    (err) => {
                        if (err) {
                            return next(err);
                        }

                        req.flash(
                            "success",
                            "Welcome to Wanderlust!"
                        );

                        res.redirect("/listings");
                    }
                );
            } catch (e) {
                console.log(e);

                req.flash(
                    "error",
                    e.message
                );

                res.redirect("/signup");
            }
        })
    );


// Login
router
    .route("/login")
    .get((req, res) => {
        res.render("users/login.ejs");
    })
    .post(
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        (req, res) => {
            req.flash(
                "success",
                "Welcome back to Wanderlust!"
            );

            res.redirect("/listings");
        }
    );


// Logout
router
    .route("/logout")
    .get((req, res, next) => {
        req.logout((err) => {
            if (err) {
                return next(err);
            }

            req.flash(
                "success",
                "You are logged out"
            );

            res.redirect("/listings");
        });
    });


module.exports = router;