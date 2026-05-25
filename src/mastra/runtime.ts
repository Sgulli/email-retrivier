import { Layer, ManagedRuntime } from "effect";
import { layer as NodeFileSystemLayer } from "@effect/platform-node/NodeFileSystem";
import { layer as NodePathLayer } from "@effect/platform-node/NodePath";
import { GmailAuth } from "./gmail/auth";
import { GmailClient } from "./gmail/client";
import { GmailService } from "./gmail/service";
import { AttachmentService } from "./gmail/attachment.service";
import { MinioService } from "./lib/minio";
import { DbService } from "./lib/db";

const Infra = Layer.mergeAll(NodeFileSystemLayer, NodePathLayer);

const WithClient = (userId: string) =>
  Layer.provideMerge(
    GmailClient.Live(userId),
    Layer.provideMerge(
      GmailAuth.Live,
      Layer.mergeAll(Infra, DbService.Default),
    ),
  );

export const AppLayer = (userId: string) =>
  Layer.mergeAll(
    Layer.provide(GmailService.Live, WithClient(userId)),
    Layer.provide(AttachmentService.Live, WithClient(userId)),
    MinioService.Default,
  );

/** Prefer {@link runAppEffect} at boundaries; it caches runtime per userId. */
export const AppRuntime = (userId: string) => ManagedRuntime.make(AppLayer(userId));
