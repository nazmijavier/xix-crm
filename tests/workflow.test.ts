import { test } from "node:test";
import assert from "node:assert/strict";
import {
  zoomCanvas,
  MIN_ZOOM,
  MAX_ZOOM,
  canvasViewport,
  centerCanvas,
  minimapProjection,
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

test("minimap viewport tracks canvas pan and zoom; clicking a map point centers it", () => {
  const size = { width: 1200, height: 800 };
  for (const zoom of [0.4, 1, 1.8]) {
    const target = { x: -320, y: 640 };
    const pos = centerCanvas(target, zoom, size);
    const rect = canvasViewport(pos, zoom, size);
    assert.ok(Math.abs(rect.x + rect.width / 2 - target.x) < 1e-8);
    assert.ok(Math.abs(rect.y + rect.height / 2 - target.y) < 1e-8);
    const panned = canvasViewport(
      { x: pos.x - 100, y: pos.y + 50 },
      zoom,
      size,
    );
    assert.ok(Math.abs((panned.x - rect.x) * zoom - 100) < 1e-8);
    assert.ok(Math.abs((panned.y - rect.y) * zoom + 50) < 1e-8);
  }
});

test("minimap keeps moved cards within its padded bounds and allows round-trip coordinates", () => {
  const nodes = [
    { id: "a", x: -800, y: -250 },
    { id: "branch", x: 2000, y: 1500, width: 190 },
  ];
  const map = minimapProjection(nodes);
  for (const n of nodes) {
    const x = n.x * map.scale + map.x;
    const y = n.y * map.scale + map.y;
    assert.ok(x >= 6 && x < 149);
    assert.ok(y >= 6 && y < 72);
    assert.ok(Math.abs((x - map.x) / map.scale - n.x) < 1e-8);
    assert.ok(Math.abs((y - map.y) / map.scale - n.y) < 1e-8);
  }
});

test("zoom keeps the canvas point under the anchor fixed and clamps only canvas scale", () => {
  const original = { x: -200, y: 90 };
  const anchor = { x: 600, y: 300 };
  for (const target of [0.1, 0.8, 1, 1.5, 3]) {
    const next = zoomCanvas(original, 0.75, target, anchor);
    assert.ok(next.zoom >= MIN_ZOOM && next.zoom <= MAX_ZOOM);
    assert.ok(
      Math.abs(
        (anchor.x - next.pos.x) / next.zoom - (anchor.x - original.x) / 0.75,
      ) < 1e-8,
    );
    assert.ok(
      Math.abs(
        (anchor.y + 48 - next.pos.y) / next.zoom -
          (anchor.y + 48 - original.y) / 0.75,
      ) < 1e-8,
    );
  }
  assert.equal(zoomCanvas(original, 1, 0, anchor).zoom, MIN_ZOOM);
  assert.equal(zoomCanvas(original, 1, 10, anchor).zoom, MAX_ZOOM);
});
