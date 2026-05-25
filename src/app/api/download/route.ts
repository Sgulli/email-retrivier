import { getAuth } from "@/lib/auth-server";
import { createMinioClient, getBucket } from "@/mastra/lib/minio-client";
import { createZipFromBuffers, type ZipEntry } from "@/lib/create-zip";
import { z } from "zod";

const minioClient = createMinioClient();
const minioBucket = getBucket();

const schema = z.object({
  files: z.array(
    z.object({
      objectName: z.string(),
      filename: z.string(),
    }),
  ),
});

export async function POST(req: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { files } = await req.json();

  const result = schema.safeParse({ files });
  if (!result.success) {
    return Response.json(
      {
        error: result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const { files: validatedFiles } = result.data;

  if (!validatedFiles?.length) {
    return Response.json({ error: "No files specified" }, { status: 400 });
  }

  const fileBuffers: ZipEntry[] = [];

  for (const f of validatedFiles) {
    try {
      const stream = await minioClient.getObject(minioBucket, f.objectName);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      fileBuffers.push({ name: f.filename, buffer: Buffer.concat(chunks) });
    } catch (err) {
      console.warn(`Skipping missing file: ${f.objectName}`, err);
    }
  }

  if (fileBuffers.length === 0) {
    return Response.json(
      { error: "No files could be retrieved" },
      { status: 502 },
    );
  }

  const zipBuffer = await createZipFromBuffers(fileBuffers);

  return new Response(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="attachments.zip"; filename*=UTF-8''attachments.zip`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
