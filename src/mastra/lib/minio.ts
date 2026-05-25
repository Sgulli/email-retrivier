import { Client as MinioClient } from "minio";
import { Effect } from "effect";
import * as crypto from "node:crypto";
import { Readable } from "node:stream";

export class MinioService extends Effect.Service<MinioService>()("MinioService", {
  effect: Effect.gen(function* () {
    const endpoint = process.env.MINIO_ENDPOINT || "localhost";
    const port = parseInt(process.env.MINIO_PORT || "9000", 10);
    const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
    const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
    const bucket = process.env.MINIO_BUCKET || "email-attachments";
    const useSSL = process.env.MINIO_USE_SSL === "true";

    const client = new MinioClient({
      endPoint: endpoint,
      port,
      accessKey,
      secretKey,
      useSSL,
    });

    const ensureBucket = () =>
      Effect.tryPromise({
        try: async () => {
          const exists = await client.bucketExists(bucket);
          if (!exists) {
            await client.makeBucket(bucket);
          }
        },
        catch: (cause) =>
          new Error(
            `Failed to ensure MinIO bucket: ${cause instanceof Error ? cause.message : String(cause)}`,
          ),
      });

    const generateObjectName = (originalFilename: string) => {
      const ext = originalFilename.includes(".")
        ? originalFilename.split(".").pop()!
        : "";
      const base = originalFilename.replace(/\.[^/.]+$/, "");
      const sanitized = base.replace(/[/\\?%*:|"<>]/g, "_").trim();
      const id = crypto.randomUUID();
      return ext ? `${id}/${sanitized}.${ext}` : `${id}/${sanitized}`;
    };

    const uploadFile = (buffer: Buffer, filename: string, mimeType: string) =>
      Effect.gen(function* () {
        yield* ensureBucket();
        const objectName = generateObjectName(filename);

        const result = yield* Effect.tryPromise({
          try: () =>
            client.putObject(bucket, objectName, buffer, buffer.length, {
              "Content-Type": mimeType,
            }),
          catch: (cause) =>
            new Error(
              `Failed to upload to MinIO: ${cause instanceof Error ? cause.message : String(cause)}`,
            ),
        });

        return { objectName, etag: result.etag };
      });

    const getFileStream = (objectName: string) =>
      Effect.tryPromise({
        try: () => client.getObject(bucket, objectName),
        catch: (cause) =>
          new Error(
            `Failed to get file from MinIO: ${cause instanceof Error ? cause.message : String(cause)}`,
          ),
      });

    const getPresignedUrl = (objectName: string, expires = 3600) =>
      Effect.tryPromise({
        try: () => client.presignedGetObject(bucket, objectName, expires),
        catch: (cause) =>
          new Error(
            `Failed to generate presigned URL: ${cause instanceof Error ? cause.message : String(cause)}`,
          ),
      });

    return { ensureBucket, uploadFile, getFileStream, getPresignedUrl } as const;
  }),
}) {}
