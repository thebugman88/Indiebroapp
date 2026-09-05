import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";
import Stripe from "stripe";
import { PRODUCTS } from "../shared/economy.ts";

const config = {};
for (const path of [".env", ".env.local"])
  if (existsSync(path)) Object.assign(config, parse(readFileSync(path)));
Object.assign(config, process.env);

const definitions = [
  ["coins100", "STRIPE_PRICE_ID_COINS100"],
  ["coins250", "STRIPE_PRICE_ID_COINS250"],
];

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

if (!/^(?:sk|rk)_live_/.test(config.STRIPE_SECRET_KEY || ""))
  fail("STRIPE_SECRET_KEY must be a live restricted or secret key.");

for (const [, variable] of definitions)
  if (!/^price_[A-Za-z0-9]+$/.test(config[variable] || ""))
    fail(`${variable} must contain a Stripe price ID.`);

if (
  config.STRIPE_PRICE_ID_COINS100 &&
  config.STRIPE_PRICE_ID_COINS100 === config.STRIPE_PRICE_ID_COINS250
)
  fail("Coin packs must use different Stripe prices.");

if (!process.exitCode) {
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);
  const productIds = new Set();
  for (const [productId, variable] of definitions) {
    try {
      const expected = PRODUCTS[productId];
      const price = await stripe.prices.retrieve(config[variable], {
        expand: ["product"],
      });
      const product = price.product;
      const productOK =
        typeof product !== "string" &&
        !product.deleted &&
        product.active &&
        product.name === expected.name;
      if (
        !price.livemode ||
        !price.active ||
        price.currency !== "usd" ||
        price.unit_amount !== expected.cents ||
        price.type !== "one_time" ||
        price.recurring ||
        !productOK
      ) {
        fail(`${variable} does not match the active live ${expected.name} offer.`);
        continue;
      }
      productIds.add(product.id);
      console.log(`PASS ${expected.name}: live, active, $${(expected.cents / 100).toFixed(2)} USD one time`);
    } catch {
      fail(`${variable} could not be retrieved from the configured live Stripe account.`);
    }
  }
  if (productIds.size !== definitions.length)
    fail("The two Coin packs must be separate active Stripe products.");
}

if (!process.exitCode)
  console.log("\nBoth live Coin-pack products are configured correctly.");
