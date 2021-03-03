const express = require("express");
const cors = require("cors");
const passport = require("passport");
const socketioRedis = require("socket.io-redis");
const { redisClient, pub, sub } = require("./lib/utils/redis/config");

const db = require("./db");
const cookieParser = require("cookie-parser");
const pass = require("./passport");
const usersRoute = require("./services/users");
const expRouter = require("./services/experiences");
const eduRouter = require("./services/educations");
const socket = require("socket.io");
const app = express();

const { authorizeSocket, socketHandler } = require("./services/socket");
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
app.use("/api/experiences", expRouter);
app.use("/api/educations", eduRouter);
const server = app.listen(process.env.PORT, () => {
  console.log("running on port ", process.env.PORT);
});
db.sequelize
  .sync({ force: false })
  .then(server)
  .catch((err) => {
    console.log(err);
  });
const io = socket(server);

io.use(authorizeSocket);

io.adapter(socketioRedis({ pubClient: pub, subClient: sub }));
socketHandler(io);
