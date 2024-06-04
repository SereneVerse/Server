const { verifyToken } = require("../utils/token.utils");

const socketAuthMiddleware = async (socket) => {
  try {
    const { token, id } = socket.handshake.auth;
    if (!token || !id) throw new Error("no token or id provided");
    const payload = await verifyToken(token);
    if (!payload) throw new Error("error verifying token");
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  socketAuthMiddleware,
};
