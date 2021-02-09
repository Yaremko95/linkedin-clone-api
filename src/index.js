const express = require("express");
const cors = require("cors");
const passport = require("passport");
const db = require("./db");
const cookieParser = require("cookie-parser");
const pass = require("./passport");
const usersRoute = require("./services/users");

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use("/api/users", usersRoute);

db.sequelize
  .sync({ force: false })
  .then((result) => {
    app.listen(process.env.PORT, () => {
      console.log("running on port ", process.env.PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
