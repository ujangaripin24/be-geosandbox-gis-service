const { reciverMessageData, reprocessDLQMessages } = require("./message-broker.pkg");
const { getChannel, onChannelReady } = require("../../config/message-broker.config");
const { DetailUsers } = require("../../models");

let consumerRegistered = false;

const consumeUserUpdatedQueue = async () => {
  await reciverMessageData(["gis_user_activated", "gis_user_update"], async (msg) => {
    if (!msg) return;

    const payload = JSON.parse(msg.content.toString());
    console.log(
      "[gis-service] Received user event payload:",
      payload,
    );
    const { uuid, username, email } = payload;

    if (!uuid) {
      console.warn("[gis-service] Missing uuid in message payload");
      return;
    }

    const user = await DetailUsers.findOne({ where: { uuid } });
    if (user) {
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
        console.log(
          `[gis-service] Successfully updated DetailUsers for uuid: ${uuid}`,
          updateData,
        );
      }
    } else {
      console.warn(
        `[gis-service] DetailUsers record for uuid ${uuid} not found. Creating it.`,
      );
      await DetailUsers.create({ uuid, username, email });
      console.log(
        `[gis-service] Successfully created DetailUsers for uuid: ${uuid}`,
      );
    }
  });
};

/**
 * Listens to the GIS-specific user update queue from RabbitMQ,
 * synchronizes username/email in the GIS database, and auto-replays DLQ messages on startup.
 */
const listenUserUpdatedQueue = async () => {
  if (consumerRegistered) return;
  consumerRegistered = true;

  const startListener = async () => {
    await consumeUserUpdatedQueue();
    setTimeout(async () => {
      try {
        await reprocessDLQMessages("gis_user_activated");
        await reprocessDLQMessages("gis_user_update");
      } catch (dlqErr) {
        console.error("[gis-service] Auto DLQ replay error:", dlqErr.message);
      }
    }, 3000);
  };

  onChannelReady(startListener);

  try {
    if (getChannel()) await startListener();
  } catch (error) {
    console.error(
      "[gis-service] Failed to start user event listener:",
      error.message,
    );
  }
};

module.exports = {
  listenUserUpdatedQueue,
};
