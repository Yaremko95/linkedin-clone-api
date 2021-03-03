const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const User = require("../db").User;
const Experience = require("../db").Experience;
const Education = require("../db").Education;
const jwt = require("jsonwebtoken");
const ExtractJwt = require("passport-jwt").ExtractJwt;

const authenticate = async (user) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1 week",
  });
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_JWT_SECRET,
    {
      expiresIn: "1 week",
    }
  );

  user.refresh_tokens = user.refresh_tokens.concat(refreshToken);
  await User.update(
    { refresh_tokens: user.refresh_tokens },
    { where: { id: user.id } }
  );

  return { accessToken: token, refreshToken };
};

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async function (email, password, cb) {
      return await User.findOne({
        where: { email: email },
      })
        .then(async (user) => {
          if (!user) {
            return cb(null, false, { message: "Incorrect email or password." });
          } else if (!user.validPassword(password)) {
            return cb(null, false, { message: "Incorrect email or password." });
          } else {
            console.log(user);
            return cb(null, user, {
              message: "Logged In Successfully",
            });
          }
        })
        .catch((e) => {
          console.log(e);
          return cb(null, false, { message: "Incorrect email or password." });
        });
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env["JWT_SECRET"],
    },
    async function (jwtPayload, cb) {
      console.log("jwtPayload", jwtPayload);

      const user = await User.findOne({
        where: {
          id: jwtPayload.id,
        },
        attributes: { exclude: ["refresh_tokens", "password"] },
        include: [Experience, Education],
      });
      if (user) {
        return cb(null, user);
      } else {
        return cb(null, false, { message: "unauthorized" });
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
