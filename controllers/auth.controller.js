// import dependencies
const AsyncHandler = require("express-async-handler");
const status = require("http-status");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");
const UnauthorizedRequestError = require("../exceptions/badRequest.exception");
const { User } = require("../models/user.model");
const { hashPassword, comparePassword } = require("../utils/hashing.utils");
const {
  signToken,
  signRefreshToken,
  verifyToken,
} = require("../utils/token.utils");
const { sendMail } = require("../utils/mailer.utils");
const { generateOtp } = require("../utils/otp.utils");

// controller to register a user
const register = AsyncHandler(async (req, res, next) => {
  // wrap all logic in a try-catch block for error handling
  try {
    // destructure the values needed from the request body
    const { fullName, userName, password, phone, email, dateOfBirth, role } =
      req.body;

    // checks if any of the users essentials exist in the db
    const findUser = await User.findOne({ email });
    const findPhone = await User.findOne({ phone });
    if (findUser || findPhone) {
      throw new ForbiddenRequestError(
        "User with email or phone already exists"
      );
    }
    // hashing the user password for data security(even I can't access it)
    const hash = await hashPassword(password);

    // create a sanitized user object
    const sanitizedUser = {
      fullName,
      hash,
      phone,
      userName,
      email,
      role,
      loginScheme: "email",
      dateOfBirth,
    };
    // save the user details as a new entry in the db
    const user = await User.create(sanitizedUser);

    return res.status(status.CREATED).json({
      status: "success",
      statusCode: status.CREATED,
      data: {
        ...sanitizedUser,
        hash: undefined,
        password,
      },
    });
  } catch (error) {
    next(error);
  }
});

// controller to log a user into their dashboard
const login = AsyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const findUser = await User.findOne({ email });
    if (!findUser) {
      throw new UnauthorizedRequestError("User not Found");
    }

    if (findUser.loginScheme !== "email")
      throw new UnauthorizedRequestError(
        `Invalid login scheme - login with ${findUser.loginScheme}`
      );

    // compare the input password with the hash in the db
    const compare = await comparePassword(findUser.hash, password);
    if (!compare) {
      throw new UnauthorizedRequestError("Incorrect Password");
    }
    // sign access and refresh token to keep a user logged in
    const accessToken = await signToken(findUser._id);
    const refreshToken = await signRefreshToken(findUser._id);

    // store refresh token on the users browser and in the db
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 96 * 60 * 60 * 1000,
      sameSite: "none",
    });

    findUser.refreshToken = refreshToken;
    await findUser.save();

    const user = {
      ...findUser._doc,
      refreshToken: undefined,
      hash: undefined,
      password,
      _v: undefined,
    };
    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      token: accessToken,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

const handleGoogleAuth = AsyncHandler(async (req, res, next) => {
  try {
    const user = req.user;
    req.session.userId = user._id;
    req.session.save((err) => {
      if (err) {
        console.log("err", err);
      }
    });
    // sign access and refresh token to keep a user logged in
    const accessToken = await signToken(user._id);

    // const refreshToken = await signRefreshToken(user._id);

    // store refresh token on the users browser and in the db
    // res.cookie("refresh_token", refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   maxAge: 96 * 60 * 60 * 1000,
    //   sameSite: "none",
    // });

    // const myUser = await User.findByIdAndUpdate(
    //   user._id,
    //   { refreshToken },
    //   { new: true }
    // ).lean();

    // const sanitizedUser = {
    //   ...myUser,
    //   refreshToken: undefined,
    //   _v: undefined,
    // };

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      token: accessToken,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

const verifyConsultant = AsyncHandler(async (req, res, next) => {
  try {
    const token = req.params.token;

    if (!token) throw new ForbiddenRequestError("Invalid Parameters");

    const id = await verifyToken(token);

    const user = await User.findByIdAndUpdate(
      id,
      {
        status: "complete",
      },
      { new: true }
    ).lean();

    if (!user) throw new ForbiddenRequestError("User not Found");

    const newToken = await signToken(user._id);

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      token: newToken,
    });
  } catch (error) {
    next(error);
  }
});

const forgotPassword = AsyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;

    //check whether the user exists in the db and returns error otherwise
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) throw new ForbiddenRequestError("User not Found");

    // Generate OTP (One-Time Password)
    let response;
    let otp = generateOtp();
    let subject = "Password Reset";
    let template = "forgotPassword";
    let name = user.fullName;

    // Send the email with the generated OTP
    response = await sendMail(email, subject, template, otp, name);

    // save the otp. time created and expiry date to the db
    const currentTime = Date.now();
    user.otp = otp;
    user.otpCreatedAt = currentTime;
    user.otpExpiresIn = currentTime + 10 * 60 * 1000;
    await user.save();

    if (response)
      return res.status(status.OK).json({
        status: "success",
        statusCode: status.OK,
        message: "Successfully Sent",
        response,
      });
  } catch (error) {
    next(error);
  }
});

// controller that resets a users password only after the otp has been confirmed
const resetPassword = AsyncHandler(async (req, res, next) => {
  try {
    // destructure the userid passed from the middleware
    const { userId } = req;

    // destructure and hash the password
    const { password } = req.body;
    const hash = await hashPassword(password);

    // find the user in the db and update password hash in one query
    const user = await User.findByIdAndUpdate(
      userId,
      {
        hash,
      },
      {
        new: true,
      }
    );

    if (!user) throw new ForbiddenRequestError("User not Found");

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      message: "Successfully Reset",
    });
  } catch (error) {
    next(error);
  }
});

const confirmOtp = AsyncHandler(async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // find user with given email in the db and validate otp
    const user = await User.findOne({ email });
    const userOtp = user.otp;
    // returns true if otp has not expired
    const validOtp = Date.now() >= user.otpExpiresIn ? false : true;

    if (!userOtp || !(otp == userOtp) || !validOtp)
      throw new UnauthorizedRequestError("invalid or expired otp");

    const accessToken = await signToken(user._id);

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      message: "Valid Otp",
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
});

// controller to refresh the logged in user and renew access token
const refresh = AsyncHandler(async (req, res, next) => {
  try {
    console.log(req.session)
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);

      if (!user)
        throw new ForbiddenRequestError(
          "User not Found - invalid refresh token"
        );

      const accessToken = await signToken(user._id);
      return res.status(status.OK).json({
        status: "success",
        statusCode: status.OK,
        data: user,
        token: accessToken,
      });
    }
    // destructure existing refresh token from the cookies sent to the browser in the log in endpoint
    const { refresh_token } = req.cookies;

    //fetch userId attached to request object from authMiddleware

    const user = await User.findOne({ refreshToken: refresh_token }).lean();

    if (!user || !refresh_token || user.refreshToken !== refresh_token)
      throw new ForbiddenRequestError("User not Found - invalid refresh token");
    // after validating logged in user, pass a new access token
    const accessToken = await signToken(user._id);

    const sanitizedUser = {
      ...user,
      refreshToken: undefined,
      hash: undefined,
      _v: undefined,
    };

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: sanitizedUser,
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
});

// controller to log out a user session
const logOut = AsyncHandler(async (req, res, next) => {
  try {
    const { refresh_token } = req.cookies;
    const userId = req.userId;

    if (req.isAuthenticated() || req.session.userId) {
      req.logout();
      req.session.destroy();
      res.clearCookie("connect.sid", { path: "/" });
      return res.sendStatus(status.NO_CONTENT);
    }

    const user = await User.findById(userId);

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: true,
      maxAge: 96 * 60 * 60 * 1000,
      sameSite: "none",
    });

    user.refreshToken = undefined;
    await user.save();

    return res.sendStatus(status.NO_CONTENT);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  register,
  login,
  handleGoogleAuth,
  forgotPassword,
  resetPassword,
  confirmOtp,
  logOut,
  verifyConsultant,
  refresh,
};
