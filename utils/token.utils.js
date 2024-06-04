const { secret } = require("../config/constants.config");
const jwt = require("jsonwebtoken");

const signToken = async (id) => {
  try {
    let payload = {
      id,
    };
    let token = jwt.sign(payload, secret, {
      expiresIn: "1h",
    });
    return token;
  } catch (error) {
    throw new jwt.JsonWebTokenError(error);
  }
};

const verifyToken = async (token) => {
  try {
    let payload = jwt.verify(token, secret);
    return payload.id;
  } catch (error) {
    throw new jwt.JsonWebTokenError(error);
  }
};

const signRefreshToken = async (id) => {
  try {
    let payload = {
      id,
    };
    let token = jwt.sign(payload, secret, {
      expiresIn: "7d",
    });
    return token;
  } catch (error) {
    throw new jwt.JsonWebTokenError(error);
  }
};

// const signGoogleToken = async (id) => {
//   try {
//     let payload = {
//       id,
//     };
//     let token = jwt.sign(payload, secret, {
//       expiresIn: "2d",
//     });
//     return token;
//   } catch (error) {
//     throw new Error(error);
//   }
// };

module.exports = {
  signRefreshToken,
  signToken,
  verifyToken,
};
