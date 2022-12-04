var express = require("express");
var favicon = require("serve-favicon");
var path = require("path");
var app = express();
var passport = require("passport");
var Promise = require("promise");
var Strategy = require("passport-twitter").Strategy;
var cookieSession = require("cookie-session");
require("dotenv").config();

const getBio = require("./src/js/utils/getBio").getBio;

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

passport.use(
  new Strategy(
    {
      consumerKey: process.env.BIOTWIT_CONSUMER_KEY,
      consumerSecret: process.env.BIOTWIT_CONSUMER_SECRET,
      // callbackURL: "http://127.0.0.1:3000/login/twitter/return",
      callbackURL: "https://hiwhoru.netlify.app/login/twitter/return",
    },
    function (token, tokenSecret, profile, cb) {
      return cb(null, {
        token: token,
        tokenSecret: tokenSecret,
        signedIn: true,
      });
    }
  )
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

app.use(require("morgan")("combined")); //look into
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["tennis", "keyboard"],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.get(
  "/login/twitter",
  passport.authenticate("twitter", { forceLogin: true }),
  function (req, res) {}
);

app.get(
  "/login/twitter/return", //the callback we specified at the top
  passport.authenticate("twitter", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/"); //if successful authentication, redirect to /
  }
);

app.get("/api/checkLoggedIn", function (req, res) {
  //if token there, return it, and then on react side, change state
  if (req.session.passport && req.session.passport.user.token) {
    res.json({ data: req.session.passport.user.signedIn });
  } else {
    res.json({ data: false });
  }
});

app.get("/api/signOut", function (req, res) {
  req.session = null;
  res.json({ data: false });
});

app.use("/", express.static("dist"));

app.get("/api/:searchHandle/:searchTerm", function (req, res) {
  console.log(req.params);
  getBio(req, res);
});

app.listen(process.env.PORT || 3000);
