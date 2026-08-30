import { spawn } from "node:child_process";

// An explicit demo project and local emulators only. Never inherit real credentials.
const env = {
  ...process.env,
  FIREBASE_PROJECT_ID: "demo-indiebro-security",
  GCLOUD_PROJECT: "demo-indiebro-security",
  GOOGLE_CLOUD_PROJECT: "demo-indiebro-security",
  FIREBASE_SERVICE_ACCOUNT_JSON: "",
  GOOGLE_APPLICATION_CREDENTIALS: "",
  FIREBASE_TOKEN: "",
  STRIPE_SECRET_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
  GEMINI_API_KEY: "",
  FIREBASE_STORAGE_BUCKET: "",
  CI: "true",
  NODE_ENV: "test",
};
delete env.FIRESTORE_EMULATOR_HOST;
delete env.FIREBASE_AUTH_EMULATOR_HOST;
const child = spawn(
  process.execPath,
  [
    "node_modules/firebase-tools/lib/bin/firebase.js",
    "emulators:exec",
    "--only",
    "auth,firestore",
    "--project",
    "demo-indiebro-security",
    "--config",
    "firebase.emulators.json",
    "node --import tsx --test tests/firebase.integration.ts",
  ],
  { env, stdio: "inherit" },
);
child.on("error", () => {
  console.error(
    "Could not start Firebase emulators. Install dependencies and Java 21+.",
  );
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
