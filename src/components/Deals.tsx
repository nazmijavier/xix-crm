import { useState } from "react";
import type { Deal, Stage } from "../model";
import {
  stages,
  boardStages,
  stageColors,
  total,
  money,
  shortMoney,
  closeDate,
} from "../model";
import {
  Icon,
  asset,
  Badge,
  Avatar,
  CompanyLogo,
  Probability,
  Empty,
  StageIcon,
} from "./UI";
const B = (name: string) => asset("639-72230", name);
export function DealsList({
  deals,
  onOpen,
  onAdd,
  selected,
  onSelect,
  groupBy,
}: {
  deals: Deal[];
  onOpen: (d: Deal) => void;
  onAdd: () => void;
  selected: Set<string>;
  onSelect: (ids: string[]) => void;
  groupBy: string;
}) {
  const [folded, setFolded] = useState<string[]>([]);
  const groups =
    groupBy === "None"
      ? ["All deals"]
      : groupBy === "Owner"
        ? [...new Set(deals.map((d) => d.owner))]
        : [...stages];
  return (
    <div className="table-scroll">
      <div className="deals-table" role="table" aria-label="Deals pipeline">
        <div className="table-head table-grid" role="row">
          <input
            type="checkbox"
            aria-label="Select all visible deals"
            checked={!!deals.length && deals.every((d) => selected.has(d.id))}
            onChange={(e) =>
              onSelect(e.target.checked ? deals.map((d) => d.id) : [])
            }
          />
          {[
            "Deal",
            "Company",
            "Stage",
            "Industry",
            "Owner",
            "Probability",
            "Closes",
            "Age",
            "Value",
          ].map((t) => (
            <span role="columnheader" key={t}>
              {t}
            </span>
          ))}
        </div>
        {groups.map((group) => {
          const rows = deals.filter(
            (d) =>
              groupBy === "None" ||
              (groupBy === "Owner" ? d.owner === group : d.stage === group),
          );
          if (!rows.length) return null;
          return (
            <section key={group} role="rowgroup">
              <button
                className="group-heading"
                aria-expanded={!folded.includes(group)}
                onClick={() =>
                  setFolded(
                    folded.includes(group)
                      ? folded.filter((g) => g !== group)
                      : [...folded, group],
                  )
                }
              >
                <span
                  className={
                    "group-dot " + (stageColors[group as Stage] || "gray")
                  }
                >
                  {folded.includes(group) ? "›" : "•"}
                </span>
                <span>{group}</span>
                <span className="count">{rows.length}</span>
                <span className="group-total">{shortMoney(total(rows))}</span>
              </button>
              {!folded.includes(group) &&
                rows.map((d) => (
                  <div
                    className={
                      "table-row table-grid " +
                      (selected.has(d.id) ? "row-selected" : "")
                    }
                    key={d.id}
                    role="row"
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ${d.name}`}
                      checked={selected.has(d.id)}
                      onChange={(e) =>
                        onSelect(
                          e.target.checked
                            ? [...selected, d.id]
                            : [...selected].filter((id) => id !== d.id),
                        )
                      }
                    />
                    <div role="cell">
                      <button
                        className="record-pill"
                        title={d.name}
                        onClick={() => onOpen(d)}
                      >
                        {d.company === "OpenAI" ? (
                          <CompanyLogo company={d.company} />
                        ) : (
                          <span className="deal-glyph">
                            <Icon
                              src={asset("639-74191", "imgFrame1")}
                              size={10}
                            />
                          </span>
                        )}
                        <span>{d.name}</span>
                      </button>
                    </div>
                    <div role="cell">
                      <button className="record-pill" onClick={() => onOpen(d)}>
                        <CompanyLogo company={d.company} />
                        <span>{d.company}</span>
                      </button>
                    </div>
                    <div role="cell">
                      <Badge stage={d.stage}>{d.stage}</Badge>
                    </div>
                    <div role="cell">
                      <Badge color={d.color}>{d.industry}</Badge>
                    </div>
                    <div role="cell" className="owner">
                      <Avatar name={d.owner} />
                      <span>{d.owner}</span>
                    </div>
                    <div role="cell">
                      <Probability deal={d} />
                    </div>
                    <span role="cell">{closeDate(d.closes)}</span>
                    <span role="cell" className={d.age < 10 ? "age-new" : ""}>
                      {d.age}d
                    </span>
                    <span role="cell" className="value">
                      {shortMoney(d.value)}
                    </span>
                  </div>
                ))}
            </section>
          );
        })}
        {!deals.length && (
          <Empty
            title="No matching deals"
            detail="Try a different search or clear your filters."
          />
        )}
        <button className="table-add" onClick={onAdd}>
          + Add record
        </button>
      </div>
    </div>
  );
}
export function DealsBoard({
  deals,
  onOpen,
  onAdd,
  onMove,
}: {
  deals: Deal[];
  onOpen: (d: Deal) => void;
  onAdd: (stage: Stage) => void;
  onMove: (id: string, stage: Stage) => void;
}) {
  const [over, setOver] = useState("");
  const [dragging, setDragging] = useState("");
  return (
    <div className="board-scroll" aria-label="Deals board">
      <div className="board-track">
        {boardStages.map((stage) => {
          let rows = deals.filter((d) => d.stage === stage);
          if (stage === "Negotiation")
            rows = [...rows].sort((a, b) =>
              a.company === "Anthropic"
                ? -1
                : b.company === "Anthropic"
                  ? 1
                  : 0,
            );
          return (
            <section
              className={
                "board-column " + (over === stage ? "drop-target" : "")
              }
              key={stage}
              aria-label={stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOver(stage);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node))
                  setOver("");
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (deals.some((d) => d.id === id)) onMove(id, stage);
                setOver("");
                setDragging("");
              }}
            >
              <header className="column-heading">
                <div>
                  <Badge stage={stage}>
                    <StageIcon stage={stage} />
                    {stage === "Negotiation" ? "Nego" : stage}
                  </Badge>
                  <span className="count">{rows.length}</span>
                  <button
                    className="icon-button"
                    onClick={() => onAdd(stage)}
                    aria-label={`Add deal to ${stage}`}
                  >
                    <Icon src={B("imgMeyaOutlinePlus")} size={16} />
                  </button>
                </div>
                <p>{money(total(rows))}</p>
              </header>
              <div className="column-cards">
                {rows.map((d) => (
                  <button
                    key={d.id}
                    className={
                      "deal-card " + (dragging === d.id ? "dragging" : "")
                    }
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", d.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragging(d.id);
                    }}
                    onDragEnd={() => {
                      setDragging("");
                      setOver("");
                    }}
                    onClick={() => onOpen(d)}
                    aria-label={`Open ${d.name}. ${money(d.value)}. ${d.stage}.`}
                  >
                    <span className="card-row card-company">
                      <CompanyLogo company={d.company} />
                      {d.company}
                    </span>
                    <strong className="card-name">{d.name}</strong>
                    <span className="card-row card-value">
                      <b>{money(d.value)}</b>
                      <Icon src={B("imgMeyaOutlineClock2")} />
                      <span>{d.age}d in stage</span>
                    </span>
                    <span className="card-row">
                      <Avatar name={d.owner} full />
                      {d.owner.split(" ")[0]}
                    </span>
                    <span className="card-row card-badges">
                      <Badge color={d.color}>
                        {d.industry === "Artificial Intelligence"
                          ? "AI"
                          : d.industry}
                      </Badge>
                      <Probability deal={d} />
                    </span>
                    <span className="card-row card-dates">
                      <span>
                        <Icon src={B("imgMeyaOutlineCalendar")} size={12} />
                        {closeDate(d.closes)}
                      </span>
                      <span>
                        <Icon src={B("imgMeyaOutlineClock1")} size={14} />
                        {d.age}d
                      </span>
                    </span>
                  </button>
                ))}
                {!rows.length && (
                  <button className="empty-column" onClick={() => onAdd(stage)}>
                    + Add your first deal
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
