const redis = require("redis");
const redisClient = redis.createClient(6379);
const pub = redis.createClient(6379);
const sub = redis.createClient(6379);
redisClient.on("connect", function () {
  console.log("You are now connected");
});
// redisClient.flushdb(function (err, succeeded) {
//   console.log(succeeded); // will be true if successfull
// });
redisClient.on("error", (err) => {
  console.log(err);
});
module.exports = { redisClient, pub, sub };
