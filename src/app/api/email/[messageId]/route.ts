import { getAuth } from "@/lib/auth-server";
import { emailMessageDetailSchema } from "@/lib/email-message-detail";
import { withAttachments, withGmail } from "@/mastra/run-app";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messageId } = await params;
  if (!messageId?.trim()) {
    return Response.json({ error: "messageId is required" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    const [message, attachments] = await Promise.all([
      withGmail(userId, (gmail) => gmail.fetchMessage(messageId)),
      withAttachments(userId, (svc) => svc.listAttachments(messageId)),
    ]);

    const body = emailMessageDetailSchema.parse({
      messageId: message.id,
      subject: message.subject,
      from: message.from,
      snippet: message.snippet,
      internalDate: message.internalDate,
      attachments: attachments.map((a) => ({
        attachmentId: a.attachmentId,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        inline: a.inline,
      })),
    });

    return Response.json(body);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch message";
    return Response.json({ error: message }, { status: 502 });
  }
}
