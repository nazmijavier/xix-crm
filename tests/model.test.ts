import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seedDeals,
  filterDeals,
  moveDeal,
  total,
  parseImport,
  csvExport,
} from "../src/model.ts";
test("moving a deal changes one stage, resets stage age, and preserves pipeline value", () => {
  const moved = moveDeal(seedDeals, "openai", "Proposal");
  assert.equal(moved.find((d) => d.id === "openai")?.stage, "Proposal");
  assert.equal(moved.find((d) => d.id === "openai")?.age, 0);
  assert.equal(total(moved), 3509000);
  assert.equal(seedDeals.find((d) => d.id === "openai")?.stage, "Negotiation");
  assert.equal(
    moveDeal(seedDeals, "openai", "Negotiation").find((d) => d.id === "openai")
      ?.age,
    30,
  );
});
test("filters combine search, owner, stage and nonmutating value sort", () => {
  const result = filterDeals(seedDeals, {
    query: "ENTERPRISE",
    stage: "Qualified",
    owner: "Guillermo Rauch",
    sort: "value-desc",
  });
  assert.deepEqual(
    result.map((d) => d.id),
    ["vercel"],
  );
  assert.equal(
    filterDeals(seedDeals, {
      query: "no result",
      stage: "",
      owner: "",
      sort: "",
    }).length,
    0,
  );
  assert.equal(
    filterDeals(seedDeals, {
      query: "",
      stage: "",
      owner: "",
      sort: "value-desc",
    })[0].id,
    "intel",
  );
  assert.equal(seedDeals[0].id, "nestle");
});
test("JSON round trip preserves records; invalid and duplicate imports are rejected", () => {
  assert.deepEqual(parseImport(JSON.stringify(seedDeals)), seedDeals);
  for (const value of [
    null,
    {},
    [{ ...seedDeals[0], probability: 101 }],
    [{ ...seedDeals[0], stage: "Unknown" }],
    [{ ...seedDeals[0], value: -1 }],
    [{ ...seedDeals[0], notes: [null] }],
    [seedDeals[0], seedDeals[0]],
  ])
    assert.throws(() => parseImport(JSON.stringify(value)));
});
test("CSV protects spreadsheet formulas and escapes quotes and commas", () => {
  const csv = csvExport([
    { ...seedDeals[0], name: '=HYPERLINK("bad")', company: "Acme, Inc." },
  ]);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"Acme, Inc."'));
  assert.equal(csv.split("\r\n").length, 2);
});
