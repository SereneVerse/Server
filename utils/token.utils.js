const { jwtAccessSecret, jwtRefreshSecret } = require("../config/constants.config");
const jwt = require("jsonwebtoken");

const signToken = async (id) => {
  try {
    return jwt.sign({ id }, jwtAccessSecret, { expiresIn: "1h" });
  } catch (error) {
    throw new jwt.JsonWebTokenError(error);
  }
};

const verifyToken = async (token) => {
  try {
    const payload = jwt.verify(token, jwtAccessSecret);
    return payload.id;
  } catch (error) {
    throw new jwt.JsonWebTokenError(error);
  }
};

const signRefreshToken = async (id) => {
  try {
    return jwt.sign({ id }, jwtRefreshSecret, { expiresIn: "7d" });
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
