const { reciverMessageData, reprocessDLQMessages, } = require("./message-broker.pkg");
const { TblCompany } = require("../../models");
const { getChannel, onChannelReady, } = require("../../config/message-broker.config");

let consumerRegistered = false;

const consumeCompanyCreatedQueue = async () => {
  await reciverMessageData(["gis_company_created_queue"], async (msg) => {
    if (!msg) return;

    const payload = JSON.parse(msg.content.toString());
    console.log(
      "[gis-service] Received 'gis_company_created_queue' payload:",
      payload,
    );

    const { uuid, event_type, name } = payload;

    if (!uuid) {
      console.warn(
        "[gis-service] Missing uuid in message payload, skipping message",
      );
      return;
    }

    const company = await TblCompany.findOne({ where: { uuid } });

    if (!company) {
      await TblCompany.create({
        uuid,
        event_type: event_type,
        name,
      });
      console.log("[gis-service] Created company:", {
        uuid,
        event_type,
        name,
      });
    } else {
      console.warn(
        `[gis-service] TblCompany record for uuid ${uuid} already exists.`,
      );
    }
  });
};

const consumeCompanyUpdatedQueue = async () => {
  await reciverMessageData(["gis_company_updated_queue"], async (msg) => {
    if (!msg) return;

    const payload = JSON.parse(msg.content.toString());
    console.log(
      "[gis-service] Received 'gis_company_updated_queue' payload:",
      payload,
    );

    const { uuid, event_type, name } = payload;

    if (!uuid) {
      console.warn(
        "[gis-service] Missing uuid in message payload, skipping message",
      );
      return;
    }

    const company = await TblCompany.findOne({ where: { uuid } });

    if (company) {
      const updateData = {};
      if (name) updateData.name = name;
      if (event_type) updateData.event_type = event_type;

      if (Object.keys(updateData).length > 0) {
        await company.update(updateData);
        console.log("[gis-service] Updated company:", {
          uuid,
          ...updateData,
        });
      }
    } else {
      console.warn(
        `[gis-service] TblCompany record for uuid ${uuid} not found. Auto-creating record.`,
      );
      await TblCompany.create({
        uuid,
        event_type: event_type || "EVENT_UPDATE_COMPANY_USER_SERVICE",
        name: name || "",
      });
      console.log("[gis-service] Auto-created company:", {
        uuid,
        event_type,
        name,
      });
    }
  });
};

const consumeCompanyDeletedQueue = async () => {
  await reciverMessageData(["gis_company_deleted_queue"], async (msg) => {
    if (!msg) return;

    const payload = JSON.parse(msg.content.toString());
    console.log(
      "[gis-service] Received 'gis_company_deleted_queue' payload:",
      payload,
    );

    const { uuid } = payload;

    if (!uuid) {
      console.warn(
        "[gis-service] Missing uuid in message payload, skipping message",
      );
      return;
    }

    const company = await TblCompany.findOne({ where: { uuid } });
    if (company) {
      await company.destroy();
      console.log("[gis-service] Deleted company:", { uuid });
    } else {
      console.warn(
        `[gis-service] TblCompany record for uuid ${uuid} not found.`,
      );
    }
  });
};

/**
 * Listens to 'gis_company_created_queue', 'gis_company_updated_queue', and 'gis_company_deleted_queue'
 * from RabbitMQ and syncs TblCompany records in GIS database.
 * Also attempts to reprocess any DLQ messages when listener starts.
 */
const listenCompanyUpdateQueue = async () => {
  if (consumerRegistered) return;
  consumerRegistered = true;

  const startListener = async () => {
    await consumeCompanyCreatedQueue();
    await consumeCompanyUpdatedQueue();
    await consumeCompanyDeletedQueue();
    setTimeout(async () => {
      try {
        await reprocessDLQMessages("gis_company_created_queue");
        await reprocessDLQMessages("gis_company_updated_queue");
        await reprocessDLQMessages("gis_company_deleted_queue");
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
      "[gis-service] Failed to start 'company_update' listener:",
      error.message,
    );
  }
};

module.exports = {
  listenCompanyUpdateQueue,
};