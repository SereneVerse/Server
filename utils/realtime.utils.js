const { getAbly } = require("../config/ably.config");

/**
 * Publishes a message to an Ably channel.
 * Mirrors the old `io.to(channel).emit(event, data)` pattern.
 */
const publish = async (channelName, event, data) => {
  const ably = getAbly();
  const channel = ably.channels.get(channelName);
  await channel.publish(event, data);
};

/**
 * Publish to a user-specific channel: `user:<userId>`
 */
const publishToUser = (userId, event, data) =>
  publish(`user:${userId}`, event, data);

/**
 * Publish to a chat thread channel: `chat:<userA>-<userB>`
 * Channel name is sorted so A-B and B-A resolve to the same channel.
 */
const publishToChat = (userA, userB, event, data) => {
  const sorted = [String(userA), String(userB)].sort().join("-");
  return publish(`chat:${sorted}`, event, data);
};

module.exports = { publish, publishToUser, publishToChat };
