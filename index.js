const app = require("./config/app.config");
const { Server } = require("socket.io");

const { socketAuthMiddleware } = require("./middlewares/socketAuth.middleware");
const registerChatHandlers = require("./socket/chatHandler.socket");
const { PORT } = require("./config/constants.config");
const { ConnectDb } = require("./config/db.config");
const cron = require("node-cron");
const { Streak } = require("./models/streaks.model");

let server;

const startApp = async (port) => {
  try {
    await ConnectDb();
    server = app.listen(port, () => {
      console.log(`server is listening on port ${port}`);
    });
  } catch (error) {
    throw new Error(error);
  }
};

startApp(PORT).then(() => {
  const io = new Server(server, {
    cors: {
      // origin: ["http://localhost:3000"],
      origin: ["https://serene-verse.vercel.app"],
      methods: ["POST, GET, PUT, PATCH, DELETE"],
      credentials: true,
    },
  });

  // add authentication middleware
  io.use(async (socket, next) => {
    const isVerified = await socketAuthMiddleware(socket);
    if (isVerified) {
      console.log("socket authenticated");
      next();
    } else {
      next(
        new Error("invalid request, add token and id fields in auth header")
      );
    }
  });

  // connection handler
  const onConnection = (socket) => {
    registerChatHandlers(io, socket);
  };

  io.on("connect", onConnection);
});

cron.schedule("0 8 * * *", async () => {
  console.log("sobriety tracker running");
  await Streak.aggregate([
    {
      $match: {
        lastUpdated: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        status: "active",
      },
    },
    {
      $addFields: {
        pastStreak: "$currentStreak", // Set 'past' to current value
        currentStreak: 0,
        status: "inactive",
      },
    },
    {
      $merge: {
        into: "streaks",
        on: "_id",
        whenMatched: "merge",
        whenNotMatched: "discard",
      },
    },
  ]);
});
