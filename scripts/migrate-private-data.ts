// Offline maintenance utility. Defaults to a read-only inventory. Never run this
// against production until writers are stopped, access rules are locked down,
// keys are backed up securely, and the dry-run counts have been reviewed.
import {
  FieldValue,
  type CollectionReference,
  type DocumentSnapshot,
  type DocumentReference,
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { economyDb } from "../server/economy";
import { getFirebaseAdminApp } from "../server/auth";
import {
  assertEncryptionConfigured,
  sealPrivate,
  openPrivate,
  sealBytes,
  openBytes,
} from "../server/dataProtection";
import { encodeJudgeProfile } from "../server/profileProtection";
import { encodeStoredTrack } from "../server/judgement";
import { conversationId } from "../server/messaging";

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const project = option("--project"),
  apply = args.includes("--apply");
if (!project || !/^[a-z][a-z0-9-]{4,62}$/.test(project))
  throw new Error("Provide --project with an explicit Firebase project ID.");
if (apply && option("--confirm-project") !== project)
  throw new Error(
    "Writes require --apply --confirm-project with the same project ID.",
  );
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PROJECT_ID !== project
)
  throw new Error("Project mismatch.");
process.env.FIREBASE_PROJECT_ID = project;
if (apply) assertEncryptionConfigured();
const counts = {
  profiles: 0,
  tracks: 0,
  messages: 0,
  conversations: 0,
  legacyAiBodies: 0,
};
async function* documents(collection: CollectionReference) {
  let cursor: DocumentSnapshot | undefined;
  while (true) {
    let query = collection.orderBy("__name__").limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) return;
    for (const doc of page.docs) yield doc;
    cursor = page.docs.at(-1);
  }
}
async function replace(ref: DocumentReference, convert: (data: any) => any) {
  await economyDb().runTransaction(async (t) => {
    const current = await t.get(ref);
    const data = current.data() as any;
    if (!data || data.private) return;
    const next = convert(data);
    t.set(ref, next);
  });
}
async function run() {
  const db = economyDb();
  for await (const doc of documents(db.collection("judgeProfilesV2"))) {
    if (doc.data().private) continue;
    counts.profiles++;
    if (apply)
      await replace(doc.ref, (data) => {
        if (data.id !== doc.id) throw new Error("Profile ownership mismatch.");
        return encodeJudgeProfile(data);
      });
  }
  for await (const doc of documents(db.collection("judgeTracksV2"))) {
    const data = doc.data();
    if (data.private) continue;
    counts.tracks++;
    if (!apply) continue;
    if (data.id !== doc.id || !data.ownerId)
      throw new Error("Track ownership mismatch.");
    let audioMimeType = data.audioMimeType;
    if (data.audioPath) {
      if (!process.env.FIREBASE_STORAGE_BUCKET)
        throw new Error("Explicit storage bucket required.");
      const file = getStorage(getFirebaseAdminApp())
        .bucket(process.env.FIREBASE_STORAGE_BUCKET)
        .file(data.audioPath);
      const [metadata] = await file.getMetadata();
      if (Number(metadata.size) > 22_000_000)
        throw new Error("Audio exceeds migration limit.");
      const [bytes] = await file.download();
      if (metadata.metadata?.privateEncryption === "v1") {
        openBytes(JSON.parse(bytes.toString()), `audio:${doc.id}`);
        audioMimeType = metadata.metadata.audioMimeType;
      } else {
        audioMimeType = metadata.contentType;
        if (!audioMimeType?.startsWith("audio/"))
          throw new Error("Unexpected audio media type.");
        const encrypted = sealBytes(bytes, `audio:${doc.id}`);
        if (!openBytes(encrypted, `audio:${doc.id}`).equals(bytes))
          throw new Error("Audio verification failed.");
        await file.save(Buffer.from(JSON.stringify(encrypted)), {
          resumable: false,
          preconditionOpts: { ifGenerationMatch: Number(metadata.generation) },
          metadata: {
            contentType: "application/octet-stream",
            metadata: { privateEncryption: "v1", audioMimeType },
          },
        });
      }
    }
    await replace(doc.ref, (current) =>
      encodeStoredTrack({
        ...current,
        ...(audioMimeType ? { audioMimeType } : {}),
      }),
    );
  }
  for await (const doc of documents(db.collection("dmConversations"))) {
    const data = doc.data(),
      members = data.members;
    if (
      !Array.isArray(members) ||
      members.length !== 2 ||
      conversationId(members[0], members[1]) !== doc.id
    ) {
      // A foreign/legacy schema must be reviewed, never assigned a guessed owner.
      throw new Error("Conversation ownership requires manual review.");
    }
    for await (const message of documents(doc.ref.collection("messages"))) {
      if (message.data().private) continue;
      counts.messages++;
      if (apply)
        await replace(message.ref, (current) => {
          if (
            current.id !== message.id ||
            conversationId(current.senderId, current.recipientId) !== doc.id
          )
            throw new Error("Message ownership mismatch.");
          const context = `dm:${doc.id}:${message.id}`,
            privateBody = sealPrivate(current, context);
          openPrivate(privateBody, context);
          return { timestamp: current.timestamp, private: privateBody };
        });
    }
    if (!data.private) {
      counts.conversations++;
      if (apply)
        await replace(doc.ref, (current) => ({
          members: current.members,
          updatedAt: current.updatedAt,
          unread: current.unread || {},
          private: sealPrivate(
            {
              ...current,
              members: current.members,
              names: current.names || {},
              lastMessage: current.lastMessage || "",
            },
            `dm-preview:${doc.id}`,
          ),
        }));
    }
  }
  for await (const doc of documents(db.collection("usageJobs"))) {
    if (!Object.hasOwn(doc.data(), "response")) continue;
    counts.legacyAiBodies++;
    // Old replay bodies have no trustworthy retention record. The dry-run and
    // deployment guide disclose removal; financial/idempotency records survive.
    if (apply) await doc.ref.update({ response: FieldValue.delete() });
  }
  console.log(
    JSON.stringify({ mode: apply ? "applied" : "read-only inventory", counts }),
  );
}
run()
  .catch(() => {
    console.error(
      "STOP: migration incomplete. No record contents or credentials were logged. Keep maintenance mode enabled and resolve the configuration/schema error before retrying.",
    );
    process.exitCode = 1;
  })
  .finally(() => economyDb().terminate());
