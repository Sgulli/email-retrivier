import { Client as MinioS3Client } from "minio";

export function createMinioClient() {
  return new MinioS3Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    useSSL: process.env.MINIO_USE_SSL === "true",
  });
}

export function getBucket() {
  return process.env.MINIO_BUCKET || "email-attachments";
}

export const minioClient = createMinioClient();
export const minioBucket = getBucket();
