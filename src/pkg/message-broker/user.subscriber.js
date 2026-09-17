const { reciverMessageData } = require("./message-broker.pkg");
const { getChannel, onChannelReady } = require("../../config/message-broker.config");
const { DetailUsers } = require("../../models");

let consumerRegistered = false;

const consumeUserUpdatedQueue = async () => {
  await reciverMessageData("gis_user_update", async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      console.log(
        "[gis-service] Received 'user_update' payload:",
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
    } catch (err) {
      console.error(
        "[gis-service] Error processing 'user_update' message:",
        err.message,
      );
    }
  });
};

/**
 * Listens to the GIS-specific user update queue from RabbitMQ
 * and synchronizes username/email in the GIS database.
 */
const listenUserUpdatedQueue = async () => {
  if (consumerRegistered) return;
  consumerRegistered = true;
  onChannelReady(consumeUserUpdatedQueue);

  try {
    if (getChannel()) await consumeUserUpdatedQueue();
  } catch (error) {
    console.error(
      "[gis-service] Failed to start 'user_update' listener:",
      error.message,
    );
  }
};

module.exports = {
  listenUserUpdatedQueue,
};
