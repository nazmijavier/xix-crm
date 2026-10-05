import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import searchIcon from "meya-icons/outline/search.svg";
import closeIcon from "meya-icons/outline/x.svg";
import Sidebar from "./components/Sidebar";
import { DealsList, DealsBoard } from "./components/Deals";
import RecordPeek from "./components/RecordPeek";
import Workflow from "./components/Workflow";
import {
  Icon,
  asset,
  Modal,
  CompanyLogo,
  Badge,
  Avatar,
} from "./components/UI";
import {
  loadDeals,
  seedDeals,
  stages,
  filterDeals,
  moveDeal,
  total,
  money,
  shortMoney,
  parseImport,
  csvExport,
  closeDate,
} from "./model";
import type { Deal, Stage, Filters } from "./model";
const H = (n: string) => asset("639-74116", n);
const T = (n: string) => asset("639-74143", n);
function readRoute() {
  return location.pathname.startsWith("/workflows")
    ? "workflow"
    : location.pathname === "/" || location.pathname.includes("/board")
      ? "board"
      : "list";
}
export default function App() {
  const [deals, setDeals] = useState(loadDeals);
  const [view, setView] = useState(readRoute);
  const [collapsed, setCollapsed] = useState(readRoute() === "workflow");
  const [filters, setFilters] = useState<Filters>({
    query: "",
    stage: "",
    owner: "",
    sort: "",
  });
  const [groupBy, setGroupBy] = useState("Stage");
  const [panel, setPanel] = useState("");
  const [menu, setMenu] = useState("");
  const [recordId, setRecordId] = useState(
    () => new URLSearchParams(location.search).get("record") || "",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Partial<Deal> | null>(null);
  const [toast, setToast] = useState("");
  const [undo, setUndo] = useState<Deal[] | null>(null);
  const [importError, setImportError] = useState("");
  const [fullRecord, setFullRecord] = useState(false);
  const [workspace, setWorkspace] = useState(
    () => localStorage.getItem("xix.workspace") || "Meya Studio",
  );
  const [fileName, setFileName] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notice = (s: string) => {
    setToast(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 12000);
  };
  useEffect(() => {
    try {
      localStorage.setItem("xix.deals.v1", JSON.stringify(deals));
    } catch {
      notice(
        "Your browser could not save changes. Export your data to keep a copy.",
      );
    }
  }, [deals]);
  useEffect(() => {
    const pop = () => {
      setView(readRoute());
      setRecordId(new URLSearchParams(location.search).get("record") || "");
      setCollapsed(readRoute() === "workflow");
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPanel("Search");
      }
      if (e.key === "Escape") setMenu("");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const click = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu("");
    };
    document.addEventListener("pointerdown", click);
    return () => document.removeEventListener("pointerdown", click);
  }, [menu]);
  const navigate = (v: string) => {
    setView(v);
    setCollapsed(v === "workflow");
    setRecordId("");
    setFullRecord(false);
    setMenu("");
    history.pushState(
      {},
      "",
      v === "workflow"
        ? "/workflows"
        : v === "board"
          ? "/deals/board"
          : "/deals",
    );
  };
  const openRecord = (d: Deal) => {
    setRecordId(d.id);
    setFullRecord(false);
    const u = new URL(location.href);
    u.searchParams.set("record", d.id);
    history.pushState({}, "", u);
  };
  const closeRecord = () => {
    setRecordId("");
    setFullRecord(false);
    const u = new URL(location.href);
    u.searchParams.delete("record");
    history.replaceState({}, "", u);
  };
  const visible = filterDeals(deals, filters);
  const record = deals.find((d) => d.id === recordId);
  const index = record ? deals.findIndex((d) => d.id === record.id) : -1;
  const update = (d: Deal) => {
    setUndo(deals);
    setDeals((ds) => ds.map((x) => (x.id === d.id ? d : x)));
    notice("Deal updated.");
  };
  const add = (stage: Stage = "Discovery") => {
    setEditing({
      stage,
      probability: 10,
      value: 0,
      closes: "2026-11-01",
      owner: "Meya",
      industry: "Technology",
      color: "blue",
    });
  };
  const showPanel = (p: string) => {
    setMenu("");
    if (p === "Add deal") add();
    else setPanel(p);
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      notice(
        "Link copied. It opens the demo; private local changes are not shared.",
      );
    } catch {
      setPanel("Share");
    }
  };
  const download = (type: string) => {
    const content =
      type === "json" ? JSON.stringify(visible, null, 2) : csvExport(visible);
    const url = URL.createObjectURL(
      new Blob([content], {
        type: type === "json" ? "application/json" : "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "xix-deals." + type;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice(`${visible.length} deals exported.`);
  };
  const saveDeal = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const current = editing?.id
      ? deals.find((d) => d.id === editing.id)
      : undefined;
    const d: Deal = {
      id: current?.id || crypto.randomUUID(),
      name: String(fd.get("name")).trim(),
      company: String(fd.get("company")).trim(),
      owner: String(fd.get("owner")).trim(),
      industry: String(fd.get("industry")).trim(),
      stage: String(fd.get("stage")) as Stage,
      value: Number(fd.get("value")),
      probability: Number(fd.get("probability")),
      closes: String(fd.get("closes")),
      color: current?.color || "blue",
      age: current?.stage === fd.get("stage") ? current.age : 0,
      notes: current?.notes || [],
    };
    if (!d.name || !d.company || !d.owner) return;
    setUndo(deals);
    setDeals((ds) =>
      current ? ds.map((x) => (x.id === d.id ? d : x)) : [...ds, d],
    );
    setEditing(null);
    notice(current ? "Deal updated." : "Deal added to " + d.stage + ".");
  };
  const filterCount = Number(!!filters.stage) + Number(!!filters.owner);
  const toggleMenu = (m: string) => setMenu(menu === m ? "" : m);
  const menuButton = (
    label: string,
    icon: string,
    text: string,
    extra?: string,
  ) => (
    <button
      className={"toolbar-button " + (menu === label ? "active" : "")}
      onClick={() => toggleMenu(label)}
      aria-expanded={menu === label}
    >
      <Icon src={T(icon)} />
      {text}
      {extra}
    </button>
  );
  return (
    <div
      className={
        "app " +
        (collapsed ? "sidebar-is-collapsed " : "") +
        (record ? "record-is-open" : "")
      }
    >
      <Sidebar
        workspaceName={workspace}
        collapsed={collapsed}
        workflow={view === "workflow"}
        onNavigate={navigate}
        onSearch={() => setPanel("Search")}
        onCollapse={() => setCollapsed(!collapsed)}
        onPanel={showPanel}
      />
      <main
        className={"main-surface " + (view === "workflow" ? "workflow" : "")}
        id="main-content"
      >
        {view === "workflow" ? (
          <Workflow onShare={share} onNotice={notice} />
        ) : (
          <>
            <header className="deals-header">
              <div className="page-title">
                <Icon src={H("imgFrame2147236491")} size={24} />
                <h1>Deals</h1>
                <span className="pipeline-summary">
                  {deals.length} open · ${(total(deals) / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="header-actions">
                <div className="view-switch" aria-label="Deal view">
                  <button
                    className={view === "list" ? "active" : ""}
                    onClick={() => navigate("list")}
                    aria-pressed={view === "list"}
                  >
                    <Icon src={H("imgFrame")} />
                    List
                  </button>
                  <button
                    className={view === "board" ? "active" : ""}
                    onClick={() => navigate("board")}
                    aria-pressed={view === "board"}
                  >
                    <Icon src={H("imgFrame1")} />
                    Board
                  </button>
                </div>
                <button
                  className="button export-button"
                  onClick={() => setPanel("Export or import")}
                >
                  <Icon src={H("imgFrame2")} />
                  Export or Import
                </button>
                <button className="button" onClick={share}>
                  Share
                </button>
                <button className="button primary" onClick={() => add()}>
                  <Icon src={H("imgPlus")} />
                  Add
                </button>
              </div>
            </header>
            <div className="toolbar-area" ref={menuRef}>
              <div className="deals-toolbar">
                <button
                  className="toolbar-button"
                  onClick={() => toggleMenu("Pipeline")}
                  aria-expanded={menu === "Pipeline"}
                >
                  Pipeline
                  <Icon src={T("imgFrame")} />
                </button>
                {menuButton(
                  "Filter",
                  "imgFrame1",
                  "Filter",
                  filterCount ? " " + filterCount : "",
                )}
                {menuButton("Group", "imgFrame2", "Group: " + groupBy)}
                {menuButton(
                  "Sort",
                  "imgFrame3",
                  "Sort",
                  filters.sort ? " •" : "",
                )}
                <div className="spacer" />
                <span className="stale-count">
                  {deals.length} deals sitting longer than usual
                </span>
                <button
                  className="toolbar-button ask-xix"
                  onClick={() => setPanel("Ask Xix")}
                >
                  <Icon src={T("imgFrame4")} />
                  Ask Xix
                </button>
              </div>
              {menu && (
                <div className={"popover popover-" + menu.toLowerCase()}>
                  <strong>
                    {menu === "Pipeline"
                      ? "Sales pipeline"
                      : menu === "Filter"
                        ? "Filter deals"
                        : menu === "Group"
                          ? "Group deals by"
                          : "Sort deals"}
                  </strong>
                  {menu === "Pipeline" ? (
                    <>
                      <button
                        className="menu-item"
                        onClick={() => {
                          setFilters({ ...filters, stage: "" });
                          setMenu("");
                        }}
                      >
                        All open deals <span>{deals.length}</span>
                      </button>
                      {stages.map((s) => (
                        <button
                          className="menu-item"
                          key={s}
                          onClick={() => {
                            setFilters({ ...filters, stage: s });
                            setMenu("");
                          }}
                        >
                          {s}
                          <span>
                            {deals.filter((d) => d.stage === s).length}
                          </span>
                        </button>
                      ))}
                    </>
                  ) : menu === "Filter" ? (
                    <>
                      <label>
                        Stage
                        <select
                          value={filters.stage}
                          onChange={(e) =>
                            setFilters({ ...filters, stage: e.target.value })
                          }
                        >
                          <option value="">All stages</option>
                          {stages.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Owner
                        <select
                          value={filters.owner}
                          onChange={(e) =>
                            setFilters({ ...filters, owner: e.target.value })
                          }
                        >
                          <option value="">All owners</option>
                          {[...new Set(deals.map((d) => d.owner))].map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="button"
                        onClick={() => {
                          setFilters({ ...filters, stage: "", owner: "" });
                          setMenu("");
                        }}
                      >
                        Clear filters
                      </button>
                    </>
                  ) : menu === "Group" ? (
                    ["Stage", "Owner", "None"].map((g) => (
                      <button
                        className="menu-item"
                        key={g}
                        onClick={() => {
                          setGroupBy(g);
                          setMenu("");
                          if (view === "board" && g !== "Stage")
                            navigate("list");
                        }}
                      >
                        {g}
                        <span>{g === groupBy ? "✓" : ""}</span>
                      </button>
                    ))
                  ) : (
                    [
                      ["", "Default order"],
                      ["value-desc", "Value: highest first"],
                      ["close-asc", "Close date: earliest first"],
                      ["name-asc", "Name: A to Z"],
                    ].map(([v, t]) => (
                      <button
                        className="menu-item"
                        key={v}
                        onClick={() => {
                          setFilters({ ...filters, sort: v });
                          setMenu("");
                        }}
                      >
                        {t}
                        <span>{filters.sort === v ? "✓" : ""}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {(filters.query || filterCount > 0 || selected.size > 0) && (
              <div className="filter-strip">
                {filters.query && <span>Search: {filters.query}</span>}
                {filters.stage && (
                  <Badge stage={filters.stage as Stage}>{filters.stage}</Badge>
                )}
                {filters.owner && <span>{filters.owner}</span>}
                {(filters.query || filterCount > 0) && (
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        query: "",
                        stage: "",
                        owner: "",
                      })
                    }
                  >
                    Clear filters ×
                  </button>
                )}
                {selected.size > 0 && (
                  <>
                    <span>{selected.size} selected</span>
                    <select
                      aria-label="Move selected deals to stage"
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const nextStage = e.target.value as Stage;
                        setUndo(deals);
                        setDeals((ds) =>
                          ds.map((d) =>
                            selected.has(d.id)
                              ? { ...d, stage: nextStage, age: 0 }
                              : d,
                          ),
                        );
                        setSelected(new Set());
                        notice("Selected deals moved.");
                      }}
                    >
                      <option value="" disabled>
                        Move to…
                      </option>
                      {stages.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button onClick={() => setPanel("Delete selected deals")}>
                      Delete
                    </button>
                    <button onClick={() => setSelected(new Set())}>
                      Deselect
                    </button>
                  </>
                )}
              </div>
            )}
            {view === "list" ? (
              <DealsList
                deals={visible}
                onOpen={openRecord}
                onAdd={() => add()}
                selected={selected}
                onSelect={(ids) => setSelected(new Set(ids))}
                groupBy={groupBy}
              />
            ) : (
              <DealsBoard
                deals={visible}
                onOpen={openRecord}
                onAdd={add}
                onMove={(id, s) => {
                  setUndo(deals);
                  setDeals((ds) => moveDeal(ds, id, s));
                  notice("Deal moved to " + s + ".");
                }}
              />
            )}
            <footer className="deals-footer">
              <button onClick={() => add()}>+ Add record</button>
              <span>
                {visible.length} {visible.length === 1 ? "record" : "records"}
              </span>
              <span>{shortMoney(total(visible))} ARR</span>
              <div className="spacer" />
              <span className="page-count">
                {visible.length ? `1–${visible.length}` : "0"} of{" "}
                {visible.length}
              </span>
            </footer>
          </>
        )}
      </main>
      {record && !fullRecord && (
        <RecordPeek
          deal={record}
          index={index}
          count={deals.length}
          onClose={closeRecord}
          onStep={(n) => openRecord(deals[index + n])}
          onEdit={() => setEditing(record)}
          onUpdate={update}
          onDelete={() => setPanel("Delete deal")}
          onExpand={() => setFullRecord(true)}
        />
      )}{" "}
      {record && fullRecord && (
        <Modal title={record.name} wide onClose={closeRecord}>
          <div className="full-record">
            <CompanyLogo company={record.company} size={48} />
            <h3>{record.company}</h3>
            <div className="metrics">
              <div>
                Value<strong>{money(record.value)}</strong>
              </div>
              <div>
                Stage<strong>{record.stage}</strong>
              </div>
              <div>
                Probability<strong>{record.probability}%</strong>
              </div>
              <div>
                Closes<strong>{closeDate(record.closes)}</strong>
              </div>
            </div>
            <p>
              <Avatar name={record.owner} /> {record.owner}
            </p>
            <h3>Notes</h3>
            {record.notes.map((n, i) => (
              <p key={i}>{n}</p>
            ))}
            <button
              className="button primary"
              onClick={() => setEditing(record)}
            >
              Edit deal
            </button>
            <button className="button" onClick={() => setFullRecord(false)}>
              Back to record peek
            </button>
          </div>
        </Modal>
      )}
      {editing && (
        <Modal
          title={editing.id ? "Edit deal" : "Add deal"}
          onClose={() => setEditing(null)}
        >
          <form className="deal-form" onSubmit={saveDeal}>
            <label>
              Deal name
              <input
                name="name"
                defaultValue={editing.name}
                required
                autoFocus
                maxLength={120}
                placeholder="e.g. Acme enterprise expansion"
              />
            </label>
            <div className="form-grid">
              <label>
                Company
                <input
                  name="company"
                  defaultValue={editing.company}
                  required
                  maxLength={60}
                />
              </label>
              <label>
                Owner
                <input
                  name="owner"
                  defaultValue={editing.owner}
                  required
                  maxLength={60}
                />
              </label>
              <label>
                Stage
                <select name="stage" defaultValue={editing.stage}>
                  {stages.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Value (USD)
                <input
                  name="value"
                  type="number"
                  min="0"
                  max="1000000000"
                  step="1"
                  defaultValue={editing.value}
                  required
                />
              </label>
              <label>
                Probability (%)
                <input
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editing.probability}
                  required
                />
              </label>
              <label>
                Close date
                <input
                  name="closes"
                  type="date"
                  defaultValue={editing.closes}
                  required
                />
              </label>
            </div>
            <label>
              Industry
              <input
                name="industry"
                defaultValue={editing.industry}
                required
                maxLength={50}
              />
            </label>
            <div className="form-actions">
              <button
                className="button"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="button primary" type="submit">
                {editing.id ? "Save changes" : "Create deal"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {panel && (
        <Modal
          title={panel}
          onClose={() => {
            setPanel("");
            setImportError("");
          }}
          wide={["People", "Companies", "Reports", "Home", "Forecast"].includes(
            panel,
          )}
        >
          {panel === "Search" ? (
            <div className="search-dialog">
              <div className="search-input">
                <Icon src={searchIcon} size={18} />
                <input
                  autoFocus
                  aria-label="Search deals, companies, people"
                  placeholder="Search deals, companies, people…"
                  value={filters.query}
                  onChange={(e) =>
                    setFilters({ ...filters, query: e.target.value })
                  }
                />
              </div>
              <div className="search-results">
                {visible.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setPanel("");
                      openRecord(d);
                    }}
                  >
                    <CompanyLogo company={d.company} />
                    <span>
                      {d.name}
                      <small>
                        {d.company} · {d.owner}
                      </small>
                    </span>
                    <Badge stage={d.stage}>{d.stage}</Badge>
                  </button>
                ))}
                {!visible.length && <p>No results. Try a different name.</p>}
              </div>
              <button
                className="button"
                onClick={() => {
                  setPanel("");
                  if (view === "workflow") navigate("list");
                }}
              >
                Show {visible.length} results in Deals
              </button>
            </div>
          ) : panel === "Export or import" ? (
            <div className="modal-body">
              <p>
                Export the {visible.length} visible deals, or import a Xix JSON
                export. Imported records are merged by ID.
              </p>
              <div className="form-actions">
                <button className="button" onClick={() => download("csv")}>
                  Export CSV
                </button>
                <button
                  className="button primary"
                  onClick={() => download("json")}
                >
                  Export JSON
                </button>
              </div>
              <hr />
              <input
                type="file"
                ref={fileRef}
                accept=".json,application/json"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setFileName(f.name);
                  try {
                    if (f.size > 5_000_000)
                      throw new Error("Choose a file smaller than 5 MB.");
                    const incoming = parseImport(await f.text());
                    setUndo(deals);
                    setDeals((ds) => {
                      const map = new Map(ds.map((d) => [d.id, d]));
                      incoming.forEach((d) => map.set(d.id, d));
                      return [...map.values()];
                    });
                    setImportError("");
                    notice(incoming.length + " deals imported.");
                    setPanel("");
                  } catch (err) {
                    setImportError((err as Error).message);
                  }
                  e.target.value = "";
                }}
              />
              <p className="form-hint">
                JSON only · up to 5 MB · {fileName || "No file selected"}
              </p>
              {importError && (
                <p className="error" role="alert">
                  {importError}
                </p>
              )}
            </div>
          ) : panel.startsWith("Delete") ? (
            <div className="modal-body">
              <p>
                Delete{" "}
                {panel === "Delete deal"
                  ? record?.name
                  : `${selected.size} selected deals`}
                ? You can undo this action.
              </p>
              <div className="form-actions">
                <button className="button" onClick={() => setPanel("")}>
                  Cancel
                </button>
                <button
                  className="button danger"
                  onClick={() => {
                    setUndo(deals);
                    setDeals((ds) =>
                      ds.filter((d) =>
                        panel === "Delete deal"
                          ? d.id !== recordId
                          : !selected.has(d.id),
                      ),
                    );
                    setSelected(new Set());
                    if (panel === "Delete deal") closeRecord();
                    setPanel("");
                    notice("Deal deleted.");
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : panel === "Ask Xix" ? (
            <div className="modal-body">
              <p>Your pipeline at a glance</p>
              <div className="metrics">
                <div>
                  Open pipeline<strong>{money(total(deals))}</strong>
                </div>
                <div>
                  Weighted forecast
                  <strong>
                    {money(
                      deals.reduce(
                        (s, d) => s + (d.value * d.probability) / 100,
                        0,
                      ),
                    )}
                  </strong>
                </div>
              </div>
              <p>
                {deals.filter((d) => d.age >= 21).length} deals have been in
                their stage for 21 days or longer.
              </p>
              <p className="form-hint">
                This summary is calculated from your local data. No AI service
                is connected.
              </p>
              <button
                className="button primary"
                onClick={() => {
                  setFilters({ ...filters, sort: "value-desc" });
                  setPanel("");
                }}
              >
                Review highest-value deals
              </button>
            </div>
          ) : panel === "Plans" ? (
            <div className="modal-body">
              <Badge color="green">Open source</Badge>
              <h3>Yours to build on.</h3>
              <p>
                Xix is free. The trial label is part of the original design;
                this demo never expires and does not charge you.
              </p>
              <p>
                Use the components, customize the pipeline, and connect your own
                backend.
              </p>
              <a
                className="button primary"
                href="https://github.com/nazmijavier/xix-crm"
                target="_blank"
                rel="noreferrer"
              >
                View source on GitHub ↗
              </a>
            </div>
          ) : panel === "Workspace" || panel === "Workspace settings" ? (
            <form
              className="modal-body"
              onSubmit={(e) => {
                e.preventDefault();
                localStorage.setItem("xix.workspace", workspace);
                notice("Workspace preference saved.");
                setPanel("");
              }}
            >
              <label>
                Workspace name
                <input
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                  required
                  maxLength={60}
                />
              </label>
              <p className="form-hint">
                Demo data is stored only in this browser. Export a JSON backup
                before resetting.
              </p>
              <div className="form-actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => setPanel("Reset demo")}
                >
                  Reset demo data
                </button>
                <button className="button primary">Save</button>
              </div>
            </form>
          ) : panel === "Reset demo" ? (
            <div className="modal-body">
              <p>
                Restore the original 15 deals? This replaces changes in this
                browser. Export your records first if you need them.
              </p>
              <button
                className="button danger"
                onClick={() => {
                  setUndo(deals);
                  setDeals(structuredClone(seedDeals));
                  setFilters({ query: "", stage: "", owner: "", sort: "" });
                  setPanel("");
                  closeRecord();
                  notice("Demo data restored.");
                }}
              >
                Reset demo data
              </button>
            </div>
          ) : panel === "Invite teammates" || panel === "Share" ? (
            <div className="modal-body">
              <p>
                Share this public demo with your team. Changes remain in each
                person’s browser; there is no shared account or email service.
              </p>
              <input
                readOnly
                aria-label="Share link"
                value={location.href}
                onFocus={(e) => e.target.select()}
              />
              <button className="button primary" onClick={share}>
                Copy link
              </button>
            </div>
          ) : ["Home", "Reports", "Forecast"].includes(panel) ? (
            <div className="modal-body">
              <div className="metrics">
                <div>
                  Open pipeline<strong>{money(total(deals))}</strong>
                </div>
                <div>
                  Open deals<strong>{deals.length}</strong>
                </div>
                <div>
                  Weighted forecast
                  <strong>
                    {money(
                      deals.reduce(
                        (s, d) => s + (d.value * d.probability) / 100,
                        0,
                      ),
                    )}
                  </strong>
                </div>
              </div>
              {stages.map((s) => (
                <div className="report-row" key={s}>
                  <Badge stage={s}>{s}</Badge>
                  <span>{deals.filter((d) => d.stage === s).length} deals</span>
                  <strong>
                    {money(total(deals.filter((d) => d.stage === s)))}
                  </strong>
                </div>
              ))}
            </div>
          ) : ["People", "Companies", "Northwind Traders"].includes(panel) ? (
            <div className="modal-body directory">
              {deals
                .filter(
                  (d, i, all) =>
                    all.findIndex((a) =>
                      panel === "People"
                        ? a.owner === d.owner
                        : a.company === d.company,
                    ) === i,
                )
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setPanel("");
                      openRecord(d);
                    }}
                  >
                    {panel === "People" ? (
                      <Avatar name={d.owner} />
                    ) : (
                      <CompanyLogo company={d.company} />
                    )}
                    <span>
                      {panel === "People" ? d.owner : d.company}
                      <small>{d.name}</small>
                    </span>
                    <span>{shortMoney(d.value)} →</span>
                  </button>
                ))}
            </div>
          ) : panel === "Calendar" ? (
            <div className="modal-body directory">
              {[...deals]
                .sort((a, b) => a.closes.localeCompare(b.closes))
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setPanel("");
                      openRecord(d);
                    }}
                  >
                    <span>{closeDate(d.closes)}</span>
                    <span>{d.name}</span>
                    <Badge stage={d.stage}>{d.stage}</Badge>
                  </button>
                ))}
            </div>
          ) : panel === "Notes" ? (
            <div className="modal-body directory">
              {deals.flatMap((d) =>
                d.notes.map((n, i) => (
                  <button
                    key={d.id + i}
                    onClick={() => {
                      setPanel("");
                      openRecord(d);
                    }}
                  >
                    <span>
                      {n}
                      <small>
                        {d.company} · {d.owner}
                      </small>
                    </span>
                  </button>
                )),
              )}
            </div>
          ) : (
            <div className="modal-body">
              <p>
                {panel === "Email"
                  ? "No email account connected. Connect your own email provider when extending this starter."
                  : panel === "Sequences"
                    ? "Automate how new deals are assigned using the included workflow template."
                    : panel === "Tasks"
                      ? "Review these deals before the next customer call."
                      : panel === "Activities"
                        ? "Recent demo activity is available inside each deal record."
                        : "You’re all caught up. There are no new notifications."}
              </p>
              {panel === "Tasks" ? (
                deals
                  .filter((d) => d.age >= 21)
                  .map((d) => (
                    <button
                      className="menu-item"
                      key={d.id}
                      onClick={() => {
                        setPanel("");
                        openRecord(d);
                      }}
                    >
                      Follow up · {d.company}
                      <span>{d.age}d</span>
                    </button>
                  ))
              ) : (
                <button
                  className="button primary"
                  onClick={() => {
                    setPanel("");
                    navigate(panel === "Sequences" ? "workflow" : "list");
                  }}
                >
                  {panel === "Sequences" ? "Open workflow" : "Open Deals"}
                </button>
              )}
            </div>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          {undo && (
            <button
              onClick={() => {
                setDeals(undo);
                setUndo(null);
                setSelected(new Set());
                notice("Change undone.");
              }}
            >
              Undo
            </button>
          )}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon src={closeIcon} size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
