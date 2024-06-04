const AsyncHandler = require("express-async-handler");
const fs = require("fs");
const status = require("http-status");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");
const UnauthorizedRequestError = require("../exceptions/badRequest.exception");
const { hashPassword, comparePassword } = require("../utils/hashing.utils");
const { validateDbId } = require("../utils/mongoId.utils");
const { User } = require("../models/user.model");
const { cloudinaryUpload } = require("../config/cloudinary.config");
const { sendConsultantMail } = require("../utils/mailer.utils");
const { signToken } = require("../utils/token.utils");
const BadRequestError = require("../exceptions/badRequest.exception");

// controller to retrieve all users(admin)
const getAllUsers = AsyncHandler(async (req, res, next) => {
  try {
    // fetches all users in the db
    const users = await User.find({}).populate(["expertsContacted", "streaks"]);

    // removes sensitive/unnecessary fields from each user
    const sanitizedUsers = users.map((user) => {
      user.hash = undefined;
      user.__v = undefined;
      user.otp = undefined;
      user.otpCreatedAt = undefined;
      user.otpExpiresIn = undefined;
      user.refreshToken = undefined;
      return user;
    });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: sanitizedUsers,
    });
  } catch (error) {
    next(error);
  }
});

// controller to update user password
const updatePassword = AsyncHandler(async (req, res, next) => {
  try {
    const id = req.userId;
    await validateDbId(id);

    // destructure values from request body
    const { newPass, currPass } = req.body;

    const user = await User.findById(id);
    if (!user) throw new ForbiddenRequestError("User not found");

    // validate old password and set new password
    const validate = await comparePassword(user.hash, currPass);
    if (!validate) throw new UnauthorizedRequestError("Password mismatch");

    const hash = await hashPassword(newPass);
    user.hash = hash;
    await user.save();

    const sanitizedUser = {
      ...user._doc,
      hash: undefined,
      password: newPass,
      __v: undefined,
      otp: undefined,
      otpCreatedAt: undefined,
      otpExpiresIn: undefined,
      refreshToken: undefined,
    };
    return res.status(status.CREATED).json({
      status: "success",
      statusCode: status.CREATED,
      data: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
});

const createAdmin = AsyncHandler(async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});

const createConsultant = AsyncHandler(async (req, res, next) => {
  try {
    const { fullName, email, phone, dateOfBirth } = req.body;

    const findUser = await User.findOne({ email });
    const findPhone = await User.findOne({ phone });
    if (findUser || findPhone) {
      throw new ForbiddenRequestError("User already exists");
    }

    const sanitizedUser = {
      fullName,
      email,
      phone,
      dateOfBirth,
      role: 2,
      status: "pending",
      loginScheme: "email",
    };

    const user = await User.create(sanitizedUser);

    const subject = "New Consultant At SereneVerse";
    const template = "createConsultant";
    const token = await signToken(user._id);
    const link = `https://serene-verse.vercel.app/redirect-expert/${token}`;
    // sendConsultantMail
    response = await sendConsultantMail(
      email,
      subject,
      template,
      link,
      fullName
    );

    return res.status(status.CREATED).json({
      status: "success",
      statusCode: status.CREATED,
      data: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
});

const resendConsultantMail = AsyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    const findUser = await User.findById(id);

    if (!findUser) {
      throw new ForbiddenRequestError("User not found");
    }

    const subject = "New Consultant At SereneVerse";
    const template = "createConsultant";
    const token = await signToken(findUser._id);
    const link = `https://serene-verse.vercel.app/redirect-expert/${token}`;
    // sendConsultantMail
    response = await sendConsultantMail(
      email,
      subject,
      template,
      link,
      fullName
    );

    return res.status(status.CREATED).json({
      status: "success",
      statusCode: status.CREATED,
      data: findUser,
    });
  } catch (error) {
    next(error);
  }
});

const deleteConsultant = AsyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    await validateDbId(id);

    await User.findByIdAndDelete(id);

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
    });
  } catch (error) {
    next(error);
  }
});

const updateProfile = AsyncHandler(async (req, res, next) => {
  try {
    const id = req.userId;
    await validateDbId(id);

    // destructure values from request body
    const { dateOfBirth, fullName, phone, userName } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        dateOfBirth,
        fullName,
        phone,
        userName,
      },
      { new: true }
    ).lean();

    const sanitizedUser = {
      ...user,
      hash: undefined,
      __v: undefined,
      otp: undefined,
      otpCreatedAt: undefined,
      otpExpiresIn: undefined,
      refreshToken: undefined,
    };
    return res.status(status.CREATED).json({
      status: "success",
      statusCode: status.CREATED,
      data: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
});

const uploadProfileImage = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    await validateDbId(userId);

    const uploader = (path) => cloudinaryUpload(path, "image");

    const files = req.files;
    if (files.length < 1) {
      throw new BadRequestError("File not found : Error uploading");
    }

    const urls = [];
    for (const file of files) {
      const { path } = file;
      const newPath = await uploader(path);
      urls.push(newPath);
      fs.unlinkSync(path);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        displayImage: urls[0].url,
      },
      { new: true }
    ).lean();

    const sanitizedUser = {
      ...user,
      hash: undefined,
      __v: undefined,
      otp: undefined,
      otpCreatedAt: undefined,
      otpExpiresIn: undefined,
      refreshToken: undefined,
    };
    return res.status(status.CREATED).json({
      status: "success",
      statusCode: status.CREATED,
      data: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
});

const upload = AsyncHandler(async (req, res, next) => {
  try {
    const uploader = (path) => cloudinaryUpload(path, "image");
    const files = req.files;
    if (files.length < 1) {
      throw new BadRequestError("File not found : Error uploading");
    }
    const urls = [];
    for (const file of files) {
      const { path } = file;
      const newPath = await uploader(path);
      urls.push(newPath);
      fs.unlinkSync(path);
    }
    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: urls[0],
    });
  } catch (error) {
    next(error);
  }
});

const addExpertContact = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    await validateDbId(id, userId);

    const expert = await User.findById(id);
    if (!expert || expert.role != 2)
      throw new ForbiddenRequestError("ID must be that of a consultant");

    const user = await User.findByIdAndUpdate(userId, {
      $addToSet: { expertsContacted: id },
    }).lean();

    const sanitizedUser = {
      ...user,
      hash: undefined,
      __v: undefined,
      otp: undefined,
      otpCreatedAt: undefined,
      otpExpiresIn: undefined,
      refreshToken: undefined,
    };
    return res.status(status.CREATED).json({
      status: "success",
      statusCode: status.CREATED,
      data: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
});

const getExpertContact = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const expertArr = await User.find({ role: 2 });
    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        expertArr,
      },
    });
  } catch (error) {
    next(error);
  }
});

const getAllPatients = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const patientArr = await User.find({ role: 3 });
    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        patientArr,
      },
    });
  } catch (error) {
    next(error);
  }
});

const getContactHistory = AsyncHandler(async (req, res, next) => {
  try {
    const id = req.userId;
    await validateDbId(id);

    const user = await User.findById(id).populate("expertsContacted");
    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        history: user.expertsContacted,
      },
    });
  } catch (error) {
    next(error);
  }
});

const getUsersContacted = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    await validateDbId(userId);

    const usersContacted = await User.find({
      expertsContacted: { $in: [userId] },
    });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        usersContacted,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getAllUsers,
  getUsersContacted,
  getAllPatients,
  updateProfile,
  updatePassword,
  getExpertContact,
  addExpertContact,
  getContactHistory,
  createAdmin,
  createConsultant,
  upload,
  resendConsultantMail,
  deleteConsultant,
  uploadProfileImage,
};
