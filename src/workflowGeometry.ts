export type Point = { x: number; y: number };
export type WorkflowNode = Point & { id: string; width?: number };
export type Connection = { from: string; to: string; vertical?: boolean };

export const connections: Connection[] = [
  { from: "trigger", to: "enrich" },
  { from: "enrich", to: "branch", vertical: true },
  ...["enterprise", "round-robin", "inbound", "reminder", "review"].map(
    (to) => ({ from: "branch", to }),
  ),
  { from: "enterprise", to: "slack" },
  { from: "slack", to: "log" },
];

export function nodeHeight(node: WorkflowNode) {
  return node.id === "branch" ? 205 : 96;
}

export function connectionPath(
  from: WorkflowNode,
  to: WorkflowNode,
  vertical = false,
) {
  const start = vertical
    ? { x: from.x + (from.width || 220) / 2, y: from.y + nodeHeight(from) }
    : { x: from.x + (from.width || 220), y: from.y + nodeHeight(from) / 2 };
  const end = vertical
    ? { x: to.x + (to.width || 220) / 2, y: to.y }
    : { x: to.x, y: to.y + nodeHeight(to) / 2 };
  const bend = Math.max(
    40,
    Math.abs(vertical ? end.y - start.y : end.x - start.x) / 2,
  );
  return vertical
    ? `M ${start.x} ${start.y} C ${start.x} ${start.y + bend}, ${end.x} ${end.y - bend}, ${end.x} ${end.y}`
    : `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`;
}

export function dragPosition(
  origin: Point,
  start: Point,
  current: Point,
  zoom: number,
): Point {
  return {
    x: origin.x + (current.x - start.x) / zoom,
    y: origin.y + (current.y - start.y) / zoom,
  };
}

export function restorePositions<T extends WorkflowNode>(
  defaults: T[],
  raw: string | null,
): T[] {
  try {
    const saved = JSON.parse(raw || "null");
    return defaults.map((node) => {
      const position = saved?.[node.id];
      return position &&
        Number.isFinite(position.x) &&
        Number.isFinite(position.y)
        ? { ...node, x: position.x, y: position.y }
        : node;
    });
  } catch {
    return defaults;
  }
}

export type CanvasSize = { width: number; height: number };

export function canvasViewport(pos: Point, zoom: number, size: CanvasSize) {
  return {
    x: -pos.x / zoom,
    y: (48 - pos.y) / zoom,
    width: size.width / zoom,
    height: size.height / zoom,
  };
}

export function centerCanvas(
  point: Point,
  zoom: number,
  size: CanvasSize,
): Point {
  return {
    x: size.width / 2 - point.x * zoom,
    y: 48 + size.height / 2 - point.y * zoom,
  };
}

export function minimapProjection(nodes: WorkflowNode[]) {
  const left = Math.min(...nodes.map((n) => n.x)) - 80;
  const top = Math.min(...nodes.map((n) => n.y)) - 80;
  const right = Math.max(...nodes.map((n) => n.x + (n.width || 220))) + 80;
  const bottom = Math.max(...nodes.map((n) => n.y + nodeHeight(n))) + 80;
  const scale = Math.min(143 / (right - left), 66 / (bottom - top));
  return {
    scale,
    x: (155 - (right - left) * scale) / 2 - left * scale,
    y: (78 - (bottom - top) * scale) / 2 - top * scale,
  };
}

export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 1.8;

export function zoomCanvas(
  pos: Point,
  currentZoom: number,
  targetZoom: number,
  anchor: Point,
) {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom));
  return {
    zoom,
    pos: {
      x: anchor.x - ((anchor.x - pos.x) / currentZoom) * zoom,
      y: anchor.y + 48 - ((anchor.y + 48 - pos.y) / currentZoom) * zoom,
    },
  };
}
