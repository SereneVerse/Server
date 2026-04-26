
require("dotenv").config();

const PORT = process.env.PORT || "3000";
const localMUrl = process.env.LOCAL_MONGO_URL;
const webMUrl = process.env.MONGO_URL;
// kept for backward compat during transition; prefer jwtAccessSecret / jwtRefreshSecret
const secret = process.env.JWT_KEY;
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_KEY;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_KEY;
const nodeEnv = process.env.NODE_ENV;
const mailHost = process.env.MAIL_HOST;
const mailPass = process.env.PASS;
const mailUser = process.env.USER;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryName = process.env.CLOUDINARY_CLOUD_NAME;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleClientRedirect = process.env.CLIENT_REDIRECT;
const sessionSecret = process.env.SESSION_SECRET;
const ablyApiKey = process.env.ABLY_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const cronSecret = process.env.CRON_SECRET;

module.exports = {
  PORT,
  localMUrl,
  webMUrl,
  secret,
  jwtAccessSecret,
  jwtRefreshSecret,
  nodeEnv,
  mailHost,
  mailUser,
  mailPass,
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryName,
  googleClientId,
  googleClientSecret,
  googleClientRedirect,
  sessionSecret,
  ablyApiKey,
  anthropicApiKey,
  cronSecret,
};
