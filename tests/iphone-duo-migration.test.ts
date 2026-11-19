import { test, TestContext } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { CachedProduct } from "../src/types";
import { migrateIphoneDuoCache, planIphoneDuoMigration } from "../src/migrations";

const duo: CachedProduct = {
  id: "stable-duo-id", brand: "Apple", category: "Аксессуары",
  model: "iPhone Duo 256 Night Sky", name: "iPhone Duo 256 Night Sky",
  rawNames: ["Apple iPhone Duo 256 Night Sky (ESIM)"],
  attributes: { storage: "256GB", color: "Night Sky", sim: "ESIM", activated: true },
};

function fixture(t: TestContext, content: string = JSON.stringify([duo])) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aaa-iphone-duo-test-"));
  const dataPath = path.join(root, "data");
  fs.mkdirSync(dataPath);
  const cachePath = path.join(dataPath, "products-cache.json");
  fs.writeFileSync(cachePath, content);
  t.after(() => {
    // Удаляем только созданный этим тестом каталог, проверив абсолютную границу.
    const resolved = path.resolve(root);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("aaa-iphone-duo-test-")) {
      throw new Error("Unexpected test directory");
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return { root, dataPath, cachePath, backupDir: path.join(root, "backups") };
}

test("migration changes only Duo category/model, including existing smartphone cards", () => {
  const input = [duo, { ...duo, id: "short-model", category: "Смартфоны", model: "Duo" },
    { ...duo, id: "correct", category: "Смартфоны", model: "iPhone Duo" }];
  const before = structuredClone(input);
  const plan = planIphoneDuoMigration(input);
  assert.equal(plan.changes.length, 2);
  assert.deepEqual(input, before);
  assert.deepEqual(plan.products.map(product => product.id), input.map(product => product.id));
  for (let i = 0; i < input.length; i++) {
    assert.deepEqual(plan.products[i], { ...input[i], category: "Смартфоны", model: "iPhone Duo" });
  }
  assert.equal(planIphoneDuoMigration(plan.products).changes.length, 0);
});

test("migration preserves Air, accessories, non-Apple and incomplete Duo names", () => {
  const input = [
    { ...duo, name: "iPhone Air 256 Night Sky" },
    { ...duo, name: "MagSafe Duo Charger" },
    { ...duo, name: "iPhone Duo 256 Night Sky Case Kit" },
    { ...duo, brand: "Other" },
    { ...duo, name: "iPhone Duo" },
  ].map((product, index) => ({ ...product, id: `untouched-${index}` }));
  assert.deepEqual(planIphoneDuoMigration(input), { products: input, changes: [] });
});

test("dry run leaves original bytes intact and creates no backups/reports", t => {
  const { cachePath, backupDir } = fixture(t, JSON.stringify([duo], null, 4) + "\n");
  const original = fs.readFileSync(cachePath);
  const report = migrateIphoneDuoCache({ cachePath, log: () => {} });
  assert.equal(report.changes.length, 1);
  assert.deepEqual(fs.readFileSync(cachePath), original);
  assert.equal(fs.existsSync(backupDir), false);
});

test("apply backs up exact input, writes report and fixes cache atomically; rerun is a no-op", t => {
  const { cachePath, backupDir } = fixture(t);
  const original = fs.readFileSync(cachePath);
  const result = migrateIphoneDuoCache({ cachePath, apply: true, log: () => {} });
  assert.ok(result.backupPath);
  assert.ok(result.reportPath);
  assert.deepEqual(fs.readFileSync(result.backupPath!), original);
  const updated = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  assert.deepEqual(updated, [{ ...duo, category: "Смартфоны", model: "iPhone Duo" }]);
  assert.deepEqual(JSON.parse(fs.readFileSync(result.reportPath!, "utf8")).changes, result.changes);
  const files = fs.readdirSync(backupDir);
  const updatedBytes = fs.readFileSync(cachePath);
  assert.deepEqual(migrateIphoneDuoCache({ cachePath, apply: true, log: () => {} }).changes, []);
  assert.deepEqual(fs.readdirSync(backupDir), files);
  assert.deepEqual(fs.readFileSync(cachePath), updatedBytes);
});

test("missing cache is skipped without creating data", t => {
  const { root, dataPath } = fixture(t);
  const missing = path.join(dataPath, "missing.json");
  assert.deepEqual(migrateIphoneDuoCache({ cachePath: missing, apply: true, log: () => {} }).changes, []);
  assert.equal(fs.existsSync(missing), false);
  assert.deepEqual(fs.readdirSync(root), ["data"]);
});

for (const content of ["broken json", "{}", '[{"id":"incomplete"}]', JSON.stringify([duo, duo])]) {
  test(`invalid cache is not overwritten: ${content.slice(0, 25)}`, t => {
    const { cachePath, backupDir } = fixture(t, content);
    assert.throws(() => migrateIphoneDuoCache({ cachePath, apply: true, log: () => {} }));
    assert.equal(fs.readFileSync(cachePath, "utf8"), content);
    assert.equal(fs.existsSync(backupDir), false);
  });
}

test("failed atomic replacement preserves original and backup", t => {
  const { cachePath } = fixture(t);
  const original = fs.readFileSync(cachePath);
  t.mock.method(fs, "renameSync", () => { throw new Error("simulated disk error"); });
  assert.throws(() => migrateIphoneDuoCache({ cachePath, apply: true, log: () => {} }), /simulated disk error/);
  assert.deepEqual(fs.readFileSync(cachePath), original);
});

test("CLI previews, applies and reruns against isolated DATA_PATH without bot or services", t => {
  const { cachePath, dataPath, backupDir } = fixture(t);
  const original = fs.readFileSync(cachePath);
  const run = (...args: string[]) => {
    const result = spawnSync(process.execPath, ["-r", require.resolve("ts-node/register"),
      path.resolve("scripts/migrate-iphone-duo.ts"), "--cache", cachePath, ...args], {
      env: { ...process.env, DATA_PATH: dataPath }, encoding: "utf8", timeout: 60000,
    });
    assert.equal(result.status, 0, result.stderr || String(result.error));
    return result.stdout;
  };
  assert.ok(run().includes("исправлений 1"));
  assert.deepEqual(fs.readFileSync(cachePath), original);
  assert.equal(fs.existsSync(backupDir), false);
  assert.ok(run("--apply").includes("Миграция iPhone Duo завершена"));
  assert.equal(JSON.parse(fs.readFileSync(cachePath, "utf8"))[0].id, duo.id);
  const files = fs.readdirSync(backupDir);
  assert.ok(run("--apply").includes("исправлений 0"));
  assert.deepEqual(fs.readdirSync(backupDir), files);
});
