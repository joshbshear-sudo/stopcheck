const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let client = null;

function getS3Client() {
  if (!client) {
    client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });
  }
  return client;
}

async function uploadFile(key, body, contentType) {
  const s3 = getS3Client();
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return key;
}

// Signed URLs: 15-minute expiry MAX per spec section 11.4
async function getSignedDownloadUrl(key) {
  const s3 = getS3Client();
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  }), { expiresIn: 900 }); // 15 minutes
}

// Immediate delete — no soft-delete per spec section 11.4
async function deleteFile(key) {
  const s3 = getS3Client();
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  }));
}

module.exports = { uploadFile, getSignedDownloadUrl, deleteFile };
