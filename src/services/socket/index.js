const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const User = require("../../db").User;
const Conversation = require("../../db").Conversation;
const Message = require("../../db").Message;
const Participant = require("../../db").Participant;
const { Op } = require("sequelize");
const { redisClient } = require("../../lib/utils/redis/config");

const { groupBy } = require("lodash");
const authorizeSocket = async (socket, next) => {
  try {
    const { accessToken } = socket.handshake.query;
    console.log("accessToken from socket", accessToken);
    if (!accessToken) {
      const error = new Error("unauthorized");
      error.httpStatusCode = 401;
      next(error);
    } else {
      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_SECRET,
        async function (err, decoded) {
          if (err) {
            const error = new Error("expired");
            error.httpStatusCode = 401;
            next(error);
          } else {
            const user = await User.findByPk(decoded.id);
            if (user) {
              socket.user = user;
              next();
            } else {
              const error = new Error("unauthorized");
              error.httpStatusCode = 401;
              next(error);
            }
          }
        }
      );
    }
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};

const socketHandler = (io) => {
  io.on("connection", function (socket) {
    console.log("connected");

    const { user } = socket;

    socket.on("login", async (data) => {
      console.log(user.id);
      await User.update(
        { status: "online", socketId: socket.id },
        { where: { id: user.id } }
      );
      const loggedIn = await User.findAll({ where: { status: "online" } });
      io.emit("loggedIn", loggedIn);

      const participant = await User.findByPk(user.id, {
        include: {
          model: Conversation,
          as: "parts",
          include: [
            { model: Participant, include: User },
            {
              model: Message,
              include: User,
              order: [["createdAt", "ASC"]],
            },
          ],
          through: { attributes: [] },
        },
      });
      console.log(participant);
      const grouped = groupBy(participant.parts, "id");
      console.log(typeof Object.keys(grouped)[0]);
      socket.emit("conversations", grouped);
      participant.parts.forEach((conversation) => {
        socket.join(conversation.id);
      });
    });

    socket.on("join", async (data) => {
      const { conversationId, parts } = data;
      console.log("on join", data);

      // creates new room if there is no conversationId
      let newConversation;
      if (!conversationId && parts.length > 0) {
        newConversation = await Conversation.create({
          userId: user.id,
          returning: true,
        });
        data.conversationId = newConversation.id;
        socket.emit("roomId", { id: data.conversationId });
        //adds participants to conversation and if they are online joins them to room
        await newConversation.addParts(parts);
        const onlineUsers = await User.findAll({
          where: { id: { [Op.in]: parts }, status: "online" },
        });
        onlineUsers.forEach((user) =>
          io.sockets.connected[user.socketId].join(data.conversationId)
        );
      }
      if (conversationId && parts) {
        //
      }

      //sends conversation history and participants list to the room to the room
      const conversation = await Conversation.findByPk(data.conversationId, {
        include: [
          { model: User, as: "createdBy" },
          { model: Participant },
          { model: Message, order: [["createdAt", "ASC"]] },
        ],
      });

      socket.join(conversation.id);
      socket.emit("users", conversation.parts);
      socket.emit("history", conversation.messages);
    });

    socket.on("logout", async (data) => {
      await User.update(
        { status: "offline", socketId: "" },
        { where: { id: user.id } }
      );
      const loggedIn = await User.findAll({ where: { status: "online" } });
      io.emit("loggedIn", loggedIn);
      socket.disconnect();
    });
    socket.on("sendMsg", async (data) => {
      const { conversationId, text } = data;
      const newMsg = await Message.create({
        userId: user.id,
        text,
        conversationId,
      });
      io.in(conversationId).emit("receiveMsg", { ...newMsg.dataValues, user });

      // socket.on("login", async (data) => {
      //   console.log("loggedin");
      //   console.log(socket.id);
      //   redisClient.lrange("users", 0, -1, function (err, users) {
      //     console.log("users", err);
      //     //checks if there is a user with same socketid
      //     const userExists = users
      //       .map((user) => JSON.parse(user))
      //       .find((json) => {
      //         return json.socketid === socket.id || json.userId === user.id;
      //       });
      //     console.log("user exists", userExists);
      //     if (!userExists) {
      //       redisClient.lpush(
      //         "users",
      //         JSON.stringify({
      //           userId: user.id,
      //           socketid: socket.id,
      //         })
      //       );
      //     }
      //     if (userExists && userExists.socketid !== socket.id) {
      //       console.log("not equal");
      //       redisClient.lrem(
      //         "users",
      //         0,
      //         JSON.stringify({
      //           userId: user.id,
      //           socketid: userExists.socketid,
      //         })
      //       );
      //       redisClient.lpush(
      //         "users",
      //         JSON.stringify({
      //           userId: user.id,
      //           socketid: socket.id,
      //         })
      //       );
      //     }
      //     redisClient.lrange("users", 0, -1, function (err, users) {
      //       console.log(users);
      //       users = users
      //         .map((user) => JSON.parse(user))
      //         .filter((value, index, self) => {
      //           return self.findIndex((v) => v.userId === value.userId) === index;
      //         });
      //       // console.log(users);
      //       io.emit("loggedIn", {
      //         users: users,
      //       });
      //     });
      //   });
      //
      //   redisClient.lrange(`history:${user.id}`, 0, -1, function (err, messages) {
      //     messages = messages.map((msg) => JSON.parse(msg));
      //
      //     socket.emit(`history`, {
      //       userId: user.id,
      //       history: messages,
      //     });
      //   });
      //
      //   // const { parts, conversationId } = data;
      //   // let newConversation;
      //   // if (!newConversation) {
      //   //   newConversation = await Conversation.create(
      //   //     {
      //   //       userId: user.id,
      //   //       returning: true,
      //   //     },
      //   //     {
      //   //       include: [
      //   //         { model: User, as: "createdBy" },
      //   //         { model: User, as: "parts" },
      //   //       ],
      //   //     }
      //   //   );
      //   //   await newConversation.addParts(parts);
      //   // }
      //   //
      //   // const conversation = await Conversation.findByPk(newConversation.id, {
      //   //   include: [
      //   //     { model: User, as: "createdBy" },
      //   //     { model: User, as: "parts", through: { attributes: [] } },
      //   //     { model: Message },
      //   //   ],
      //   // });
      //   //
      //   // console.log(conversation);
      //   //
      //   // socket.join(conversation.id);
      //   // socket.emit("users", conversation.parts);
      //   // socket.emit("history", conversation.messages);
      // });

      socket.on("deleteMsg", (data) => {
        redisClient.lrange(
          `history:${user.id}`,
          0,
          -1,
          function (err, messages) {
            const toDelete = messages
              .map((msg) => JSON.parse(msg))
              .find((msg) => msg.id === data.id);
            redisClient.lrem(
              `history:${user.id}`,
              0,
              JSON.parse(toDelete),
              function (err, res) {
                if (res > 0) {
                  redisClient.lrange(
                    `history:${user.id}`,
                    0,
                    -1,
                    function (err, msgs) {
                      msgs = msgs.map((msg) => JSON.parse(msg));

                      socket.emit("history", {
                        userId: user.id,
                        history: msgs,
                      });
                    }
                  );
                }
              }
            );
          }
        );
      });

      // redisClient.lrange("users", 0, -1, function (err, users) {
      //   const receivers = users
      //     .map((user) => JSON.parse(user))
      //     .filter((json) => {
      //       return json.userId === data.to;
      //     });
      //   console.log("receiver", receivers);
      //   const newMsg = {
      //     id: uuid.v1(),
      //     from: user.id,
      //     to: data.to,
      //     date: new Date(),
      //     text: data.text,
      //   };
      //   console.log(newMsg);
      //   socket.emit("receiveMsg", { ...newMsg });
      //   if (receivers.length > 0) {
      //     receivers.forEach((receiver) => {
      //       io.to(receiver.socketid).emit("receiveMsg", newMsg);
      //     });
      //   }
      //   redisClient.lpush(`history:${user.id}`, JSON.stringify(newMsg));
      //   redisClient.lpush(`history:${data.to}`, JSON.stringify(newMsg));
      // });
    });
    socket.on("typing", function (data) {
      socket.broadcast.emit("typing", data);
    });

    socket.on("disconnect", async (options) => {
      redisClient.lrem(
        "users",
        0,
        JSON.stringify({
          userId: user.id,
          socketid: socket.id,
        }),
        function (err, res) {
          redisClient.lrange("users", 0, -1, async function (err, users) {
            io.emit("leave", {
              userId: user.id,
              users: users.map((user) => JSON.parse(user)),
            });
          });
        }
      );
    });
  });
};
module.exports = { authorizeSocket, socketHandler };

//
// [
//   {
//     "id": 1,
//     "userId": 2,
//     "createdBy": {
//       "fullName": "Diego Banovaz",
//       "address": ", ",
//       "id": 2,
//       "name": "Diego",
//       "surname": "Banovaz",
//       "email": "diego@gmail.com",
//       "socketId": "b-D1TD8YUEGkAP0NAAAA",
//       "password": "$2b$12$cz5Ytd6vPtASVk3ZNqK0FuONWMGYKPUv7VJtHrQiXjL/ks439m8Am",
//       "status": "online",
//       "refresh_tokens": [],
//       "role": "",
//       "imgUrl": "",
//       "about": "",
//       "country": "",
//       "city": ""
//     },
//     "participants": [
//       {
//         "id": 1,
//         "createdAt": "2021-02-23T18:10:03.019Z",
//         "updatedAt": "2021-02-23T18:10:03.019Z",
//         "userId": 1,
//         "conversationId": 1,
//         "user": {
//           "fullName": "Tetiana Yaremko",
//           "address": ", ",
//           "id": 1,
//           "name": "Tetiana",
//           "surname": "Yaremko",
//           "email": "tetianayaremko@gmail.com",
//           "socketId": "pFDmBg0DReLBDIUiAAAB",
//           "password": "$2b$12$Q3YflSnwATNjukDK/kpvo.kVAxzYtTQ6HO8njcefRjaqf.deITuO.",
//           "status": "online",
//           "refresh_tokens": [],
//           "role": "",
//           "imgUrl": "",
//           "about": "",
//           "country": "",
//           "city": ""
//         }
//       },
//       {
//         "id": 2,
//         "createdAt": "2021-02-23T18:10:03.019Z",
//         "updatedAt": "2021-02-23T18:10:03.019Z",
//         "userId": 2,
//         "conversationId": 1,
//         "user": {
//           "fullName": "Diego Banovaz",
//           "address": ", ",
//           "id": 2,
//           "name": "Diego",
//           "surname": "Banovaz",
//           "email": "diego@gmail.com",
//           "socketId": "b-D1TD8YUEGkAP0NAAAA",
//           "password": "$2b$12$cz5Ytd6vPtASVk3ZNqK0FuONWMGYKPUv7VJtHrQiXjL/ks439m8Am",
//           "status": "online",
//           "refresh_tokens": [],
//           "role": "",
//           "imgUrl": "",
//           "about": "",
//           "country": "",
//           "city": ""
//         }
//       }
//     ]
//   },
//   {
//     "id": 2,
//     "userId": 3,
//     "createdBy": {
//       "fullName": "Ubeyt Demir",
//       "address": ", ",
//       "id": 3,
//       "name": "Ubeyt",
//       "surname": "Demir",
//       "email": "ubeyt@gmail.com",
//       "socketId": "pRTQkN6FQioRmmRoAAAC",
//       "password": "$2b$12$ejekWE4vws6.J1JvhCOdjuqmhcXZu2Yzeo8.tlduzpDGrz6.sAugG",
//       "status": "online",
//       "refresh_tokens": [],
//       "role": "",
//       "imgUrl": "",
//       "about": "",
//       "country": "",
//       "city": ""
//     },
//     "participants": [
//       {
//         "id": 3,
//         "createdAt": "2021-02-23T18:13:55.249Z",
//         "updatedAt": "2021-02-23T18:13:55.249Z",
//         "userId": 3,
//         "conversationId": 2,
//         "user": {
//           "fullName": "Ubeyt Demir",
//           "address": ", ",
//           "id": 3,
//           "name": "Ubeyt",
//           "surname": "Demir",
//           "email": "ubeyt@gmail.com",
//           "socketId": "pRTQkN6FQioRmmRoAAAC",
//           "password": "$2b$12$ejekWE4vws6.J1JvhCOdjuqmhcXZu2Yzeo8.tlduzpDGrz6.sAugG",
//           "status": "online",
//           "refresh_tokens": [],
//           "role": "",
//           "imgUrl": "",
//           "about": "",
//           "country": "",
//           "city": ""
//         }
//       },
//       {
//         "id": 4,
//         "createdAt": "2021-02-23T18:13:55.249Z",
//         "updatedAt": "2021-02-23T18:13:55.249Z",
//         "userId": 2,
//         "conversationId": 2,
//         "user": {
//           "fullName": "Diego Banovaz",
//           "address": ", ",
//           "id": 2,
//           "name": "Diego",
//           "surname": "Banovaz",
//           "email": "diego@gmail.com",
//           "socketId": "b-D1TD8YUEGkAP0NAAAA",
//           "password": "$2b$12$cz5Ytd6vPtASVk3ZNqK0FuONWMGYKPUv7VJtHrQiXjL/ks439m8Am",
//           "status": "online",
//           "refresh_tokens": [],
//           "role": "",
//           "imgUrl": "",
//           "about": "",
//           "country": "",
//           "city": ""
//         }
//       }
//     ]
//   },
//   {
//     "id": 3,
//     "userId": 3,
//     "createdBy": {
//       "fullName": "Ubeyt Demir",
//       "address": ", ",
//       "id": 3,
//       "name": "Ubeyt",
//       "surname": "Demir",
//       "email": "ubeyt@gmail.com",
//       "socketId": "pRTQkN6FQioRmmRoAAAC",
//       "password": "$2b$12$ejekWE4vws6.J1JvhCOdjuqmhcXZu2Yzeo8.tlduzpDGrz6.sAugG",
//       "status": "online",
//       "refresh_tokens": [],
//       "role": "",
//       "imgUrl": "",
//       "about": "",
//       "country": "",
//       "city": ""
//     },
//     "participants": [
//       {
//         "id": 5,
//         "createdAt": "2021-02-23T18:15:58.647Z",
//         "updatedAt": "2021-02-23T18:15:58.647Z",
//         "userId": 3,
//         "conversationId": 3,
//         "user": {
//           "fullName": "Ubeyt Demir",
//           "address": ", ",
//           "id": 3,
//           "name": "Ubeyt",
//           "surname": "Demir",
//           "email": "ubeyt@gmail.com",
//           "socketId": "pRTQkN6FQioRmmRoAAAC",
//           "password": "$2b$12$ejekWE4vws6.J1JvhCOdjuqmhcXZu2Yzeo8.tlduzpDGrz6.sAugG",
//           "status": "online",
//           "refresh_tokens": [],
//           "role": "",
//           "imgUrl": "",
//           "about": "",
//           "country": "",
//           "city": ""
//         }
//       },
//       {
//         "id": 6,
//         "createdAt": "2021-02-23T18:15:58.647Z",
//         "updatedAt": "2021-02-23T18:15:58.647Z",
//         "userId": 1,
//         "conversationId": 3,
//         "user": {
//           "fullName": "Tetiana Yaremko",
//           "address": ", ",
//           "id": 1,
//           "name": "Tetiana",
//           "surname": "Yaremko",
//           "email": "tetianayaremko@gmail.com",
//           "socketId": "pFDmBg0DReLBDIUiAAAB",
//           "password": "$2b$12$Q3YflSnwATNjukDK/kpvo.kVAxzYtTQ6HO8njcefRjaqf.deITuO.",
//           "status": "online",
//           "refresh_tokens": [],
//           "role": "",
//           "imgUrl": "",
//           "about": "",
//           "country": "",
//           "city": ""
//         }
//       }
//     ]
//   }
// ]
