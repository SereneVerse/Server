const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport")
const MongoStore = require("connect-mongo");

const notFound = require("../middlewares/notfound.middleware");
const errHandler = require("../middlewares/errhandler.middleware");
const router = require("../routes/app.route");
const authRouter = require("../routes/auth.route");
const userRouter = require("../routes/user.route");
const chatRouter = require("../routes/chat.route");
const { resourceRouter } = require("../routes/resource.route");
const { postRouter } = require("../routes/post.route");
const { streakRouter } = require("../routes/streak.route");
const { sessionSecret } = require("./constants.config");
const session = require("express-session");
const { nodeEnv, localMUrl, webMUrl } = require("./constants.config");
const { User } = require("../models/user.model");

const selectDb = () => {
  if (nodeEnv == "production") {
    return webMUrl;
  } else {
    return localMUrl;
  }
};

const app = express();

app.use(
  cors({
    // origin: ["http://localhost:3000"],
    origin: ["https://serene-verse.vercel.app"],
    methods: ["POST, GET, PUT, PATCH, DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: selectDb(),
      ttl: 4 * 24 * 60 * 60, // = 4 days.
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 96,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(router);
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/resource", resourceRouter);
app.use("/post", postRouter);
app.use("/streak", streakRouter);
app.use("/chat", chatRouter);

app.use(notFound);
app.use(errHandler);

module.exports = app;
