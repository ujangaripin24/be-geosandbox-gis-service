const { reciverMessageData } = require("./message-broker.pkg");

let consumerRegistered = false;

const consumeCompanyCreatedQueue = async () => {
    await reciverMessageData(["gis_company_created_queue"], async (msg) => {
        if (!msg) return;

        const payload = JSON.parse(msg.content.toString());
        console.log("[gis-service] Received 'gis_company_created_queue' payload:", payload)
    })
}