import { test } from "node:test";
import assert from "node:assert/strict";
import { refreshWallet, spend } from "../server/economy";
test("monthly refill preserves purchased Coins and permanent storage; downgrade never deletes files", () => {
  const old = refreshWallet(undefined, true, new Date("2026-08-15T12:00Z"));
  old.monthly = 12;
  old.purchased = 315;
  old.extraStorageBytes = 10e9;
  old.storageBytes = 15e9;
  const next = refreshWallet(old, false, new Date("2026-09-01T00:00Z"));
  assert.equal(next.monthly, 150);
  assert.equal(next.purchased, 315);
  assert.equal(next.extraStorageBytes, 10e9);
  assert.equal(next.storageBytes, 15e9);
});
test("upgrading adds only the allowance difference and cannot farm repeated upgrades", () => {
  const w = refreshWallet(undefined, false, new Date("2026-08-15T12:00Z"));
  spend(w, 100);
  const pro = refreshWallet(w, true, new Date("2026-08-16T12:00Z"));
  assert.equal(pro.monthly, 1400);
  const free = refreshWallet(pro, false, new Date("2026-08-17T12:00Z"));
  assert.equal(
    refreshWallet(free, true, new Date("2026-08-18T12:00Z")).monthly,
    1400,
  );
});
test("included Coins spend first; invalid and unaffordable requests cannot change balances", () => {
  const w = refreshWallet(undefined, false);
  w.monthly = 10;
  w.purchased = 100;
  assert.deepEqual(spend(w, 25), {
    monthly: 10,
    purchased: 15,
    month: w.month,
  });
  assert.equal(w.purchased, 85);
  assert.equal(w.monthly, 0);
  for (const n of [-1, 1.5, Infinity, NaN, 1000])
    assert.throws(() => spend(w, n));
  assert.equal(w.purchased, 85);
});
