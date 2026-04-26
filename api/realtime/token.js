const Ably = require("ably");
const { ablyApiKey } = require("../../config/constants.config");
const { verifyToken } = require("../../utils/token.utils");

/**
 * Issues a scoped Ably token for an authenticated user.
 * The client calls this endpoint on startup and uses the token to connect to Ably directly.
 * No Ably API key is ever sent to the client.
 */
module.exports = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, jwt] = authHeader.split(" ");

    if (scheme !== "Bearer" || !jwt) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = await verifyToken(jwt);
    if (!userId) return res.status(401).json({ error: "Invalid token" });

    const ably = new Ably.Rest(ablyApiKey);
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: String(userId),
      capability: {
        [`user:${userId}`]: ["subscribe", "publish"],
        [`chat:*`]: ["subscribe", "publish"],
        [`notifications:${userId}`]: ["subscribe"],
      },
    });

    return res.status(200).json(tokenRequest);
  } catch (err) {
    return res.status(500).json({ error: "Could not issue realtime token" });
  }
};
