import { test } from "node:test";
import assert from "node:assert/strict";
import {
  connectionPath,
  connections,
  dragPosition,
  restorePositions,
} from "../src/workflowGeometry.ts";

test("drag follows pointer distance at different zoom levels and allows negative coordinates", () => {
  for (const zoom of [0.4, 1, 1.8]) {
    const result = dragPosition(
      { x: 100, y: 80 },
      { x: 300, y: 200 },
      { x: 180, y: 230 },
      zoom,
    );
    assert.ok(Math.abs((result.x - 100) * zoom + 120) < 1e-8);
    assert.ok(Math.abs((result.y - 80) * zoom - 30) < 1e-8);
  }
});

test("connections stay attached when either card moves, including behind the source", () => {
  const from = { id: "enterprise", x: 712, y: 192.5 };
  const to = { id: "slack", x: 1002.5, y: 418.5 };
  assert.match(connectionPath(from, to), /^M 932 240\.5 C .*1002\.5 466\.5$/);
  assert.match(
    connectionPath({ ...from, x: 672, y: 102.5 }, to),
    /^M 892 150\.5 C .*1002\.5 466\.5$/,
  );
  assert.match(
    connectionPath(from, { ...to, x: -100, y: -50 }),
    /^M 932 240\.5 C .*-100 -2$/,
  );
});

test("branch height and vertical enrich connection use actual card edges", () => {
  const branch = { id: "branch", x: 258, y: 483.5, width: 190 };
  assert.match(
    connectionPath(branch, { id: "enterprise", x: 712, y: 192.5 }),
    /^M 448 586 C .*712 240\.5$/,
  );
  assert.match(
    connectionPath({ id: "enrich", x: 318, y: 303.5 }, branch, true),
    /^M 428 399\.5 C .*353 483\.5$/,
  );
  assert.equal(connections.length, 9);
  assert.equal(connections.filter((c) => c.from === "branch").length, 5);
});

test("restore saves only valid positions while preserving node content and untouched cards", () => {
  const defaults = [
    { id: "a", x: 1, y: 2, title: "Original" },
    { id: "b", x: 3, y: 4, title: "Other" },
  ];
  const result = restorePositions(
    defaults,
    JSON.stringify({
      a: { x: -30, y: 80, title: "Changed" },
      b: { x: "bad", y: 2 },
    }),
  );
  assert.deepEqual(result, [
    { id: "a", x: -30, y: 80, title: "Original" },
    defaults[1],
  ]);
  assert.deepEqual(restorePositions(defaults, "invalid JSON"), defaults);
  assert.deepEqual(restorePositions(defaults, null), defaults);
  assert.equal(defaults[0].x, 1);
});
