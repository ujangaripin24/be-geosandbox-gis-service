const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");

const rustfsClient = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
});

async function connectionStorageS3() {
  try {
    await rustfsClient.send(new ListBucketsCommand({}));
    console.log("RustFS: Connected successfully!");
  } catch (error) {
    console.error(`RustFS Error: ${error.message}`);
  }
}

connectionStorageS3();

module.exports = {rustfsClient, connectionStorageS3};