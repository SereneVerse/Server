const Ably = require("ably");
const { ablyApiKey } = require("./constants.config");

let ablyClient;

const getAbly = () => {
  if (!ablyClient) {
    ablyClient = new Ably.Rest(ablyApiKey);
  }
  return ablyClient;
};

module.exports = { getAbly };
