const { Client } = require('minio');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

const bucketName = process.env.MINIO_BUCKET || 'skill-connect-bucket';

// Initialize bucket if not exists
const initializeBucket = async () => {
  try {
    console.log('[v0] Initializing MinIO bucket...');
    const exists = await minioClient.bucketExists(bucketName);
    
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`[v0] MinIO bucket '${bucketName}' created`);
    } else {
      console.log(`[v0] MinIO bucket '${bucketName}' already exists`);
    }

    // Set bucket policy to public
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: '*' },
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
        },
      ],
    };
    
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`[v0] MinIO bucket policy configured for public access`);
  } catch (err) {
    console.error('[v0] Error initializing MinIO bucket:', err.message);
  }
};

initializeBucket();

// Upload file to MinIO from file path
const uploadFile = async (filePath, fileName, contentType = 'application/octet-stream') => {
  try {
    console.log(`[v0] Uploading file to MinIO: ${fileName}`);
    
    const fileStream = fs.createReadStream(filePath);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    
    const objectName = `${Date.now()}-${fileName}`;

    await minioClient.putObject(bucketName, objectName, fileStream, fileSize, {
      'Content-Type': contentType,
    });

    const url = getFileUrl(objectName);
    console.log(`[v0] File uploaded successfully: ${url}`);

    return {
      success: true,
      url: url,
      objectName: objectName,
      fileName: fileName,
      fileSize: fileSize,
      contentType: contentType,
    };
  } catch (err) {
    console.error('[v0] Error uploading file to MinIO:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

// Upload buffer to MinIO
const uploadBuffer = async (fileBuffer, fileName, contentType = 'application/octet-stream') => {
  try {
    console.log(`[v0] Uploading buffer to MinIO: ${fileName}`);
    
    const objectName = `${Date.now()}-${fileName}`;

    await minioClient.putObject(bucketName, objectName, fileBuffer, fileBuffer.length, {
      'Content-Type': contentType,
    });

    const url = getFileUrl(objectName);
    console.log(`[v0] Buffer uploaded successfully: ${url}`);

    return {
      success: true,
      url: url,
      objectName: objectName,
      fileName: fileName,
      fileSize: fileBuffer.length,
      contentType: contentType,
    };
  } catch (err) {
    console.error('[v0] Error uploading buffer to MinIO:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

// Download file from MinIO
const downloadFile = async (objectName, localPath) => {
  try {
    console.log(`[v0] Downloading file from MinIO: ${objectName}`);
    
    await minioClient.fGetObject(bucketName, objectName, localPath);
    
    console.log(`[v0] File downloaded successfully: ${localPath}`);
    return {
      success: true,
      path: localPath,
    };
  } catch (err) {
    console.error('[v0] Error downloading file from MinIO:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

// Delete file from MinIO
const deleteFile = async (objectName) => {
  try {
    console.log(`[v0] Deleting file from MinIO: ${objectName}`);
    
    await minioClient.removeObject(bucketName, objectName);
    
    console.log(`[v0] File deleted successfully: ${objectName}`);
    return {
      success: true,
    };
  } catch (err) {
    console.error('[v0] Error deleting file from MinIO:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

// Get file URL
const getFileUrl = (objectName) => {
  return `http://${process.env.MINIO_ENDPOINT || 'minio'}:${process.env.MINIO_PORT || 9000}/${bucketName}/${objectName}`;
};

// Generate presigned URL (for temporary access)
const getPresignedUrl = async (objectName, expirySeconds = 3600) => {
  try {
    const url = await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
    console.log(`[v0] Presigned URL generated for: ${objectName}`);
    return {
      success: true,
      url: url,
    };
  } catch (err) {
    console.error('[v0] Error generating presigned URL:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

// List all files in bucket
const listFiles = async (prefix = '') => {
  try {
    const files = [];
    const objectsList = minioClient.listObjects(bucketName, prefix, true);

    return new Promise((resolve, reject) => {
      objectsList.on('data', (obj) => {
        files.push({
          name: obj.name,
          size: obj.size,
          etag: obj.etag,
          lastModified: obj.lastModified,
          url: getFileUrl(obj.name),
        });
      });

      objectsList.on('error', (err) => {
        console.error('[v0] Error listing files:', err.message);
        reject(err);
      });

      objectsList.on('end', () => {
        resolve({
          success: true,
          files: files,
        });
      });
    });
  } catch (err) {
    console.error('[v0] Error listing files from MinIO:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

module.exports = {
  minioClient,
  initializeBucket,
  uploadFile,
  uploadBuffer,
  downloadFile,
  deleteFile,
  getFileUrl,
  getPresignedUrl,
  listFiles,
  bucketName,
};
