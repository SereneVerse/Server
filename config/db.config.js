const mongoose = require("mongoose");
const { nodeEnv, localMUrl, webMUrl } = require("./constants.config");

const selectDb = () => (nodeEnv === "production" ? webMUrl : localMUrl);

const ConnectDb = async () => {
  try {
    await mongoose.connect(selectDb());
    console.log(`MongoDB Connection Succeeded at ${mongoose.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = {
  ConnectDb,
  selectDb,
};
