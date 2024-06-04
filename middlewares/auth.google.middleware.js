const passport = require("passport");
const { User } = require("../models/user.model");
const {
  googleClientId,
  googleClientSecret,
  googleClientRedirect,
} = require("../config/constants.config");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");

const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleClientRedirect,
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        let dp = "";
        if (profile.photos.length > 0) dp = profile.photos[0].value;
        if (!user) {
          user = await User.create({
            fullName: `${profile.displayName}`,
            email: profile.emails[0].value,
            loginScheme: "google",
            displayImage: dp,
            role: 3,
          });
        } else {
          if (user.loginScheme !== "google")
            throw new Error(
              `Invalid login scheme - login with ${user.loginScheme}`
            );
        }
        if (!user) throw new ForbiddenRequestError("An Error occurred");
        return cb(null, user);
      } catch (error) {
        return cb(error, false);
      }
    }
  )
);

// passport.serializeUser((user, done) => {
//   console.log("serialize", user);
//   done(null, user); // Store user in session
// });

// passport.deserializeUser((user, done) => {
//   console.log("deserialize", user);
//   done(null, user);
// });

module.exports = passport;
