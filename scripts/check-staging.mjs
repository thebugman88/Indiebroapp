import { readFileSync, existsSync } from "node:fs";
import { parse } from "dotenv";
import { GoogleAuth } from "google-auth-library";

// Configuration presence/shape only; no remote writes, no secret values in output.
const config = {};
for (const path of [".env", ".env.local"])
  if (existsSync(path)) Object.assign(config, parse(readFileSync(path)));
Object.assign(config, process.env);
let failures = 0;
const check = (label, ok) => {
  console.log(`${ok ? "PASS" : "MISSING/INVALID"} ${label}`);
  if (!ok) failures++;
};
const present = (name) =>
  typeof config[name] === "string" &&
  config[name].trim() &&
  !/^(MY_|YOUR_|REPLACE|example)/i.test(config[name]);
for (const name of [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "STRIPE_PRICE_ID_PRO",
  "STRIPE_PRICE_ID_COINS100",
  "STRIPE_PRICE_ID_COINS250",
  "STRIPE_WEBHOOK_SECRET",
  "GEMINI_API_KEY",
])
  check(name, !!present(name));
check(
  "matching browser/server Firebase project",
  !!present("FIREBASE_PROJECT_ID") &&
    config.FIREBASE_PROJECT_ID === config.VITE_FIREBASE_PROJECT_ID,
);
let originOK = false;
try {
  const url = new URL(config.APP_PUBLIC_URL);
  originOK =
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    url.pathname === "/" &&
    !url.search &&
    !url.hash;
} catch {}
check("APP_PUBLIC_URL (HTTPS origin only)", originOK);
check(
  "Stripe TEST secret key for staging",
  /^sk_test_/.test(config.STRIPE_SECRET_KEY || ""),
);
check(
  "Stripe recurring price identifier",
  /^price_/.test(config.STRIPE_PRICE_ID_PRO || ""),
);
check(
  "Stripe webhook signing secret",
  /^whsec_/.test(config.STRIPE_WEBHOOK_SECRET || ""),
);
check(
  "no emulator settings in remote staging",
  !config.FIREBASE_AUTH_EMULATOR_HOST &&
    !config.FIRESTORE_EMULATOR_HOST &&
    !config.FIREBASE_STORAGE_EMULATOR_HOST,
);
let credentialsOK = false;
try {
  if (present("FIREBASE_SERVICE_ACCOUNT_JSON")) {
    const account = JSON.parse(config.FIREBASE_SERVICE_ACCOUNT_JSON);
    credentialsOK =
      account.project_id === config.FIREBASE_PROJECT_ID &&
      typeof account.client_email === "string" &&
      typeof account.private_key === "string" &&
      account.private_key.includes("BEGIN PRIVATE KEY");
  } else if (present("GOOGLE_APPLICATION_CREDENTIALS")) {
    const account = JSON.parse(
      readFileSync(config.GOOGLE_APPLICATION_CREDENTIALS, "utf8"),
    );
    credentialsOK = [
      "service_account",
      "external_account",
      "external_account_authorized_user",
      "authorized_user",
    ].includes(account.type);
  } else {
    // ADC on a managed host may have no file. Detection does not print credentials.
    const googleAuth = new GoogleAuth();
    await Promise.race([
      googleAuth.getApplicationDefault().then(() => {
        credentialsOK = true;
      }),
      new Promise((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error("ADC detection timed out")),
          2000,
        );
        timer.unref();
      }),
    ]);
  }
} catch {}
check(
  "server credentials / application default credentials detected",
  credentialsOK,
);
console.log(
  failures
    ? `\n${failures} configuration checks need attention. No staging service was modified.`
    : "\nConfiguration shape passed. Live IAM, private bucket, rules/indexes, login, provider and payment checks are still required.",
);
process.exitCode = failures ? 1 : 0;
