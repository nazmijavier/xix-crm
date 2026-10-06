import { useState, useRef, useEffect } from "react";
import {
  connections,
  connectionPath,
  dragPosition,
  restorePositions,
  nodeHeight,
} from "../workflowGeometry";
import { Icon, asset, Badge, Modal } from "./UI";
const F = (name: string) => asset("639-76174", name);
type NodeData = {
  id: string;
  x: number;
  y: number;
  title: string;
  detail: string;
  type: string;
  icon: string;
  width?: number;
};
const initialNodes: NodeData[] = [
  {
    id: "trigger",
    x: 20,
    y: 239.5,
    title: "Deal created or updated",
    detail: "When key deal fields change",
    type: "Trigger",
    icon: "imgFrame",
  },
  {
    id: "enrich",
    x: 318,
    y: 303.5,
    title: "Enrich the company",
    detail: "Adds company and tech data",
    type: "Action",
    icon: "imgFrame1",
  },
  {
    id: "branch",
    x: 258,
    y: 483.5,
    title: "Route by value",
    detail: "",
    type: "Branch",
    icon: "imgFrame2",
    width: 190,
  },
  {
    id: "enterprise",
    x: 712,
    y: 192.5,
    title: "Assign to the enterprise pod",
    detail: "Chooses owner from account data",
    type: "AI agent",
    icon: "imgFrame10",
  },
  {
    id: "round-robin",
    x: 712,
    y: 306.5,
    title: "Round-robin to an AE",
    detail: "Uses territory and availability",
    type: "Action",
    icon: "imgFrame3",
  },
  {
    id: "inbound",
    x: 712,
    y: 418.5,
    title: "Keep in the inbound queue",
    detail: "Waits for a rep to claim it",
    type: "Action",
    icon: "imgFrame4",
  },
  {
    id: "reminder",
    x: 712,
    y: 530.5,
    title: "Ask owner for deal value",
    detail: "Sends one Slack reminder",
    type: "Action",
    icon: "imgFrame5",
  },
  {
    id: "review",
    x: 712,
    y: 642.5,
    title: "Flag for manual review",
    detail: "Routes exceptions to RevOps",
    type: "Action",
    icon: "imgFrame6",
  },
  {
    id: "slack",
    x: 1002.5,
    y: 418.5,
    title: "Post to #deal-flow",
    detail: "Tags the assigned owner",
    type: "Action",
    icon: "imgFrame7",
  },
  {
    id: "log",
    x: 1274.5,
    y: 418.5,
    title: "Write to the activity log",
    detail: "Records the routing decision",
    type: "Action",
    icon: "imgFrame8",
  },
];
export default function Workflow({
  onShare,
  onNotice,
}: {
  onShare: () => void;
  onNotice: (s: string) => void;
}) {
  const [nodes, setNodes] = useState(() => {
    try {
      return restorePositions(
        initialNodes,
        localStorage.getItem("xix.workflow.positions"),
      );
    } catch {
      return initialNodes;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(
        "xix.workflow.positions",
        JSON.stringify(
          Object.fromEntries(nodes.map(({ id, x, y }) => [id, { x, y }])),
        ),
      );
    } catch {
      /* Moving cards still works when browser storage is unavailable. */
    }
  }, [nodes]);
  const canvas = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState("enterprise");
  const [config, setConfig] = useState<NodeData | null>(null);
  const [modal, setModal] = useState("");
  const [published, setPublished] = useState(
    () => localStorage.getItem("xix.workflow.live") === "true",
  );
  const [ran, setRan] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("xix.workflow.labels") || "{}");
    } catch {
      return {};
    }
  });
  const [edit, setEdit] = useState("");
  const [showMap, setShowMap] = useState(true);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    px: number;
    py: number;
    nodeId?: string;
    zoom: number;
    moved: boolean;
  } | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const bounds = {
    left: Math.min(...nodes.map((n) => n.x)),
    top: Math.min(...nodes.map((n) => n.y)),
    right: Math.max(...nodes.map((n) => n.x + (n.width || 220))),
    bottom: Math.max(...nodes.map((n) => n.y + nodeHeight(n))),
  };
  const mapScale = Math.min(
    154 / (bounds.right - bounds.left),
    64 / (bounds.bottom - bounds.top),
  );
  const fitToView = () => {
    if (!canvas.current) return;
    const { clientWidth: width, clientHeight: height } = canvas.current;
    const scale = Math.min(
      1,
      (width - 80) / (bounds.right - bounds.left),
      (height - 100) / (bounds.bottom - bounds.top),
    );
    setZoom(scale);
    setPos({
      x:
        (width - (bounds.right - bounds.left) * scale) / 2 -
        bounds.left * scale,
      y:
        48 +
        (height - (bounds.bottom - bounds.top) * scale) / 2 -
        bounds.top * scale,
    });
  };
  const active = nodes.find((n) => n.id === selected)!;
  const run = () => {
    setRan(true);
    setHistory((h) => [
      new Date().toLocaleTimeString() +
        " · Demo deal routed to Enterprise pod ($267,000)",
      ...h,
    ]);
    onNotice(
      "Simulation complete · Enterprise pod selected. No external actions were sent.",
    );
  };
  const changePublish = () => {
    setPublished(!published);
    localStorage.setItem("xix.workflow.live", String(!published));
    onNotice(
      published
        ? "Workflow saved as draft."
        : "Published in this demo. External services are not connected.",
    );
  };
  return (
    <>
      <header className="workflow-header">
        <div className="workflow-breadcrumb">
          <span className="workflow-folder">
            <Icon
              src={asset("639-76120", "imgMeyaOutlineFilesFolderOpen")}
              size={16}
            />
          </span>
          <span>Automations</span>
          <span className="muted">/</span>
          <span className="muted">Big Deal Routing</span>
          <span className="muted">V4</span>
          <Badge color={published ? "green" : "orange"}>
            {published ? "Live" : "Draft"}
          </Badge>
        </div>
        <div className="header-actions">
          <span>Draft</span>
          <button
            className={"switch " + (published ? "on" : "")}
            role="switch"
            aria-checked={published}
            aria-label="Workflow live status"
            onClick={changePublish}
          >
            <span />
          </button>
          <span>Live</span>
          <button className="button" onClick={onShare}>
            <Icon src={asset("639-76120", "imgIcon")} />
            Share
          </button>
          <button
            className="button icon-button"
            aria-label="Workflow options"
            onClick={() => setModal("Workflow options")}
          >
            ⋮
          </button>
          <button className="button primary" onClick={changePublish}>
            {published ? "Unpublish" : "Publish"}
          </button>
        </div>
      </header>
      <div
        className="workflow-canvas"
        ref={canvas}
        aria-label="Workflow canvas. Drag cards to move them; drag the background to pan."
        onPointerDown={(e) => {
          if (
            e.button !== 0 ||
            drag.current ||
            (e.target as HTMLElement).closest("button")
          )
            return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            pointerId: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            px: pos.x,
            py: pos.y,
            zoom: 1,
            moved: false,
          };
        }}
        onPointerMove={(e) => {
          const current = drag.current;
          if (!current || current.pointerId !== e.pointerId) return;
          if (
            !current.moved &&
            Math.hypot(e.clientX - current.x, e.clientY - current.y) < 3
          )
            return;
          current.moved = true;
          const next = dragPosition(
            { x: current.px, y: current.py },
            { x: current.x, y: current.y },
            { x: e.clientX, y: e.clientY },
            current.zoom,
          );
          if (current.nodeId) {
            setDraggingNode(current.nodeId);
            setNodes((items) =>
              items.map((n) =>
                n.id === current.nodeId ? { ...n, ...next } : n,
              ),
            );
          } else setPos(next);
        }}
        onPointerUp={(e) => {
          if (drag.current?.pointerId !== e.pointerId) return;
          drag.current = null;
          setDraggingNode(null);
        }}
        onPointerCancel={(e) => {
          if (drag.current?.pointerId !== e.pointerId) return;
          drag.current = null;
          setDraggingNode(null);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDraggingNode(null);
        }}
      >
        <div
          className="workflow-world"
          style={{
            transform: `translate(${pos.x}px,${pos.y}px) scale(${zoom})`,
          }}
        >
          <svg className="workflow-edges" aria-hidden="true">
            {connections.map(({ from, to, vertical }) => (
              <path
                key={`${from}-${to}`}
                data-connection={`${from}-${to}`}
                d={connectionPath(
                  nodes.find((n) => n.id === from)!,
                  nodes.find((n) => n.id === to)!,
                  vertical,
                )}
              />
            ))}
          </svg>
          {nodes.map((n) => (
            <button
              key={n.id}
              className={
                "workflow-node " +
                (selected === n.id ? "active " : "") +
                (draggingNode === n.id ? "dragging" : "")
              }
              data-node-id={n.id}
              style={{ left: n.x, top: n.y, width: n.width || 220 }}
              onPointerDown={(e) => {
                if (e.button !== 0 || drag.current) return;
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                setSelected(n.id);
                drag.current = {
                  pointerId: e.pointerId,
                  x: e.clientX,
                  y: e.clientY,
                  px: n.x,
                  py: n.y,
                  nodeId: n.id,
                  zoom,
                  moved: false,
                };
              }}
              onKeyDown={(e) => {
                const direction = {
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                  ArrowUp: [0, -1],
                  ArrowDown: [0, 1],
                }[e.key];
                if (!direction) return;
                e.preventDefault();
                const step = e.shiftKey ? 1 : 10;
                setSelected(n.id);
                setNodes((items) =>
                  items.map((item) =>
                    item.id === n.id
                      ? {
                          ...item,
                          x: item.x + direction[0] * step,
                          y: item.y + direction[1] * step,
                        }
                      : item,
                  ),
                );
              }}
              onClick={() => {
                setSelected(n.id);
              }}
              onDoubleClick={() => {
                setConfig(n);
                setEdit(labels[n.id] || n.title);
              }}
              aria-label={`${n.type}: ${labels[n.id] || n.title}. Drag or use arrow keys to move. Double click to configure.`}
            >
              <span className="node-heading">
                <span className="node-icon">
                  <Icon src={F(n.icon)} />
                </span>
                <span className="node-copy">
                  <span className="node-type">{n.type}</span>
                  <span className="node-title">{labels[n.id] || n.title}</span>
                  {n.detail && <span className="node-detail">{n.detail}</span>}
                </span>
              </span>
              {n.id === "branch" && (
                <span className="branch-options">
                  {[
                    "Over $250k",
                    "$50k – $250k",
                    "Under $50k",
                    "No value yet",
                  ].map((t) => (
                    <span key={t}>• {t}</span>
                  ))}
                </span>
              )}
              <span className="node-footer">
                <span>1 output</span>
                <i />
                <Icon src={F("imgIcon")} />
                <Icon src={F("imgIcon2")} size={13} />
              </span>
            </button>
          ))}
          <div
            className="node-tools"
            style={{ left: active.x + 27, top: active.y - 40 }}
          >
            {[
              ["Run selected node", "imgIcon4"],
              ["View connections", "imgFrame9"],
              ["Configure node", "imgIcon5"],
              ["Node notes", "imgMeyaOutlineCommunicationChat"],
              ["Copy node configuration", "imgIcon6"],
              ["Delete node", "imgIcon7"],
            ].map(([title, img]) => (
              <button
                aria-label={title}
                title={title}
                key={title}
                onClick={() => {
                  if (title === "Run selected node") run();
                  else if (title === "Configure node") {
                    setConfig(active);
                    setEdit(labels[active.id] || active.title);
                  } else setModal(title);
                }}
              >
                <Icon src={F(img)} />
              </button>
            ))}
          </div>
          {selected === "enterprise" && (
            <>
              <button
                className="node-port"
                style={{ left: active.x - 10, top: active.y + 38 }}
                aria-label="Enterprise input connection"
                onClick={() => setModal("View connections")}
              >
                +
              </button>
              <button
                className="node-port"
                style={{
                  left: active.x + (active.width || 220) - 10,
                  top: active.y + 38,
                }}
                aria-label="Enterprise output connection"
                onClick={() => setModal("View connections")}
              >
                +
              </button>
            </>
          )}
        </div>
      </div>
      <div className="workflow-left-tools">
        {["Workflow structure", "Run history", "Workflow settings"].map(
          (t, i) => (
            <button
              key={t}
              aria-label={t}
              title={t}
              onClick={() => setModal(t)}
            >
              <Icon src={asset("639-76479", i ? "imgIcon" + i : "imgIcon")} />
            </button>
          ),
        )}
      </div>
      <div className="workflow-bottom-tools">
        <button className="button primary" onClick={() => setModal("Ask AI")}>
          <Icon src={asset("639-76101", "imgIcon")} size={12} />
          Ask AI
        </button>
        <button className="button" onClick={() => setModal("Add node")}>
          <Icon src={asset("639-76101", "imgIcon1")} size={12} />
          Node
        </button>
        <span className="divider" />
        <button
          className="button icon-button"
          aria-label="Reset canvas"
          title="Reset canvas"
          onClick={() => {
            setPos({ x: 0, y: 0 });
            setZoom(1);
          }}
        >
          <Icon src={asset("639-76101", "imgIcon2")} />
        </button>
        <button
          className="button icon-button"
          aria-label="Reset selection"
          title="Reset selection"
          onClick={() => setSelected("enterprise")}
        >
          <Icon src={asset("639-76101", "imgIcon3")} />
        </button>
      </div>
      <div className="workflow-minimap">
        {showMap && (
          <button
            className="minimap"
            aria-label="Fit workflow to view"
            onClick={fitToView}
          >
            {nodes.map((n) => (
              <span
                key={n.id}
                style={{
                  left: (n.x - bounds.left) * mapScale + 8,
                  top: (n.y - bounds.top) * mapScale + 8,
                  width: (n.width || 220) * mapScale,
                  height: nodeHeight(n) * mapScale,
                  background: n.id === selected ? "#8c95ff" : undefined,
                }}
              />
            ))}
            <i />
          </button>
        )}
        <div className="zoom-controls">
          <button
            aria-label="Toggle minimap"
            onClick={() => setShowMap(!showMap)}
          >
            <Icon src={asset("639-76065", "imgIcon")} />
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}
          >
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in"
            onClick={() => setZoom(Math.min(1.8, zoom + 0.1))}
          >
            +
          </button>
          <button aria-label="Fit to screen" onClick={fitToView}>
            <Icon src={asset("639-76065", "imgIcon3")} />
          </button>
        </div>
      </div>
      <footer className="workflow-footer">
        <button onClick={() => setModal("Run log")}>Run log</button>
        <span className="divider" />
        <button onClick={() => setModal("Code")}>‹/› Code</button>
        <span className="workflow-status">
          {ran
            ? "Last simulation completed successfully"
            : "Nothing has run since you started editing"}
        </span>
        <span className="autosave">
          ● <span>Auto-saved draft</span>
        </span>
      </footer>
      {config && (
        <Modal title="Configure node" onClose={() => setConfig(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const next = { ...labels, [config.id]: edit.trim() };
              setLabels(next);
              localStorage.setItem("xix.workflow.labels", JSON.stringify(next));
              setConfig(null);
              onNotice("Node configuration saved.");
            }}
          >
            <label>
              Node name
              <input
                autoFocus
                required
                value={edit}
                onChange={(e) => setEdit(e.target.value)}
                maxLength={70}
              />
            </label>
            <p className="form-hint">
              {config.detail || "Routes deals by value."} This demo simulates
              the workflow locally.
            </p>
            <button className="button primary">Save changes</button>
          </form>
        </Modal>
      )}
      {modal && (
        <Modal title={modal} onClose={() => setModal("")}>
          <div className="modal-body">
            {modal === "Code" ? (
              <pre>
                {JSON.stringify(
                  {
                    name: "Big Deal Routing",
                    version: 4,
                    nodes: nodes.map((n) => ({
                      id: n.id,
                      type: n.type,
                      title: labels[n.id] || n.title,
                    })),
                    mode: "local-demo",
                  },
                  null,
                  2,
                )}
              </pre>
            ) : modal === "Run log" || modal === "Run history" ? (
              <>
                <p>
                  {history.length
                    ? "Recent local simulations"
                    : "No runs yet. Run a sample deal to test the routing rules."}
                </p>
                {history.map((h, i) => (
                  <p key={i}>{h}</p>
                ))}
                <button className="button primary" onClick={run}>
                  Run simulation
                </button>
              </>
            ) : modal === "View connections" ||
              modal === "Workflow structure" ? (
              <>
                <p>Deal changed → Enrich company → Route by value</p>
                <ul>
                  <li>Over $250k → Enterprise pod</li>
                  <li>$50k–$250k → Round-robin AE</li>
                  <li>Under $50k → Inbound queue</li>
                  <li>No value → Ask owner for value</li>
                  <li>Exception → RevOps review</li>
                </ul>
                <p>Enterprise pod → Post to #deal-flow → Activity log</p>
              </>
            ) : (
              <>
                <p>
                  {modal === "Ask AI"
                    ? "AI assistance is not connected in this open-source demo. You can inspect the routing logic and simulate a deal."
                    : modal === "Add node"
                      ? "This template contains ten connected nodes. Select any node and choose Configure to edit it. Adding or deleting connected nodes is outside this demo."
                      : modal === "Delete node"
                        ? "This connected template is preserved so the demo always has a working route. You can edit this node’s name using Configure."
                        : modal === "Copy node configuration"
                          ? JSON.stringify(active, null, 2)
                          : "Workflow changes are saved in this browser. Slack, enrichment, and AI actions are simulated; no external services are connected."}
                </p>
                <button
                  className="button primary"
                  onClick={() => {
                    setModal("");
                    setConfig(active);
                    setEdit(labels[active.id] || active.title);
                  }}
                >
                  Configure selected node
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
