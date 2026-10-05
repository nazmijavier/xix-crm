import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Deal, Stage } from "../model";
import { stages, closeDate, money } from "../model";
import { Icon, asset, Badge, Avatar, CompanyLogo, Probability } from "./UI";
const P = (name: string) => asset("639-102276", name);
export default function RecordPeek({
  deal,
  index,
  count,
  onClose,
  onStep,
  onEdit,
  onUpdate,
  onDelete,
  onExpand,
}: {
  deal: Deal;
  index: number;
  count: number;
  onClose: () => void;
  onStep: (n: number) => void;
  onEdit: () => void;
  onUpdate: (d: Deal) => void;
  onDelete: () => void;
  onExpand: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [expanded, setExpanded] = useState("");
  useEffect(() => {
    ref.current!.showModal();
    const el = ref.current!;
    return () => el.close();
  }, []);
  const property = (label: string, icon: string, value: ReactNode) => (
    <div className="property" key={label}>
      <span>
        <Icon src={P(icon)} size={16} />
        {label}
      </span>
      <div>{value}</div>
    </div>
  );
  return (
    <dialog
      className="peek"
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="record-title"
    >
      <div className="peek-inner">
        <header className="peek-header">
          <button
            className="icon-button"
            aria-label="Next deal"
            disabled={index === count - 1}
            onClick={() => onStep(1)}
          >
            <Icon src={P("imgIconVector")} />
          </button>
          <button
            className="icon-button"
            aria-label="Previous deal"
            disabled={!index}
            onClick={() => onStep(-1)}
          >
            <Icon src={P("imgIconVector1")} />
          </button>
          <span>
            {index + 1} of {count}
          </span>
          <div className="spacer" />
          <button className="button outline" onClick={onEdit}>
            Edit
          </button>
          <button className="button" onClick={onExpand}>
            Open
          </button>
          <button
            className="icon-button close-peek"
            aria-label="Close record"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="peek-scroll">
          <div className="record-identity">
            {deal.company === "OpenAI" ? (
              <span className="peek-company-logo">
                <img src={P("imgSpan")} width="48" height="48" alt="" />
              </span>
            ) : (
              <CompanyLogo company={deal.company} size={36} />
            )}
            <div>
              <h2 id="record-title">{deal.company}</h2>
              <p>account@email.com</p>
            </div>
          </div>
          <div className="properties">
            {property(
              "Owner",
              "imgGroup",
              <span className="owner">
                <Avatar name={deal.owner} />
                {deal.owner}
              </span>,
            )}
            {property("Deals", "imgFrame", deal.name)}
            {property(
              "Industry",
              "imgFrame1",
              <Badge color="gray">
                {deal.industry === "Artificial Intelligence"
                  ? "AI"
                  : deal.industry}
              </Badge>,
            )}
            {property(
              "Stage",
              "imgFrame2",
              <select
                className={"stage-select " + deal.stage.toLowerCase()}
                aria-label="Deal stage"
                value={deal.stage}
                onChange={(e) =>
                  onUpdate({ ...deal, stage: e.target.value as Stage, age: 0 })
                }
              >
                {stages.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>,
            )}
            {property(
              "Probability",
              "imgFrame3",
              <Probability deal={deal} large />,
            )}
            {property(
              "Closes",
              "imgGroup1",
              closeDate(deal.closes) + " " + deal.closes.slice(0, 4),
            )}
            {property(
              "Age",
              "imgFrame4",
              deal.age + " " + (deal.age === 1 ? "day" : "days"),
            )}
            {property(
              "Next step",
              "imgFrame5",
              closeDate(deal.closes) + " " + deal.closes.slice(0, 4),
            )}
            {property("Value", "imgFrame6", money(deal.value))}
            {property(
              "Last edited by",
              "imgFrame7",
              <span className="owner">
                <Avatar name="Mia Delgado" />
                Mia Delgado
              </span>,
            )}
          </div>
          <section className="record-section">
            <header>
              <span>
                <Icon src={P("imgFrame8")} />
                Meetings
              </span>
              <button
                onClick={() =>
                  setExpanded(expanded === "meetings" ? "" : "meetings")
                }
              >
                {expanded === "meetings" ? "Show less" : "See all"}
              </button>
            </header>
            <div className="meeting">
              Meya Studio with {deal.owner}
              <span>Yesterday</span>
            </div>
            <div className="meeting">
              Meya Studio Team<span>5 Oct, 2026</span>
            </div>
            {expanded === "meetings" && (
              <div className="meeting">
                Contract review<span>{closeDate(deal.closes)}</span>
              </div>
            )}
          </section>
          <section className="record-section">
            <header>
              <span>
                <span className="progress-ring" />
                Progress
              </span>
              <button
                onClick={() =>
                  setExpanded(expanded === "progress" ? "" : "progress")
                }
              >
                View progress
              </button>
            </header>
            <div className="activity-item">
              <div>
                Revised pricing sent<small>Meya</small>
              </div>
              <span>Today</span>
            </div>
            <div className="activity-item">
              <div>
                Proposal approved<small>Alex</small>
              </div>
              <span>Yesterday</span>
            </div>
            {expanded === "progress" && (
              <div className="progress-history">
                Discovery → Qualified → Proposal → {deal.stage}
              </div>
            )}
          </section>
          <section className="record-section">
            <header>
              <span>
                <Icon src={P("imgFrame10")} />
                Notes
              </span>
              <button onClick={() => setAddingNote(!addingNote)}>
                {addingNote ? "Cancel" : "View notes"}
              </button>
            </header>
            {deal.notes.map((n, i) => (
              <div className="activity-item" key={i}>
                <div>
                  {n}
                  <small>Meya</small>
                </div>
                <span>{i ? "Today" : "1 Oct, 2026 4:00 AM"}</span>
              </div>
            ))}
            {addingNote && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (note.trim()) {
                    onUpdate({ ...deal, notes: [...deal.notes, note.trim()] });
                    setNote("");
                  }
                }}
              >
                <label className="sr-only" htmlFor="new-note">
                  New note
                </label>
                <textarea
                  id="new-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write a note…"
                  autoFocus
                  required
                  maxLength={2000}
                />
                <button className="button primary" disabled={!note.trim()}>
                  Add note
                </button>
              </form>
            )}
          </section>
          <section className="record-section">
            <header>
              <span>
                <Icon src={P("imgFrame11")} />
                Activity
              </span>
              <button
                onClick={() =>
                  setExpanded(expanded === "activity" ? "" : "activity")
                }
              >
                View activity
              </button>
            </header>
            <div className="activity-item">
              <div>
                Meya updated the proposal<small>Meya</small>
              </div>
              <span>2 Oct, 2026 5:12 AM</span>
            </div>
            {expanded === "activity" && (
              <div className="activity-item">
                <div>
                  Alex added a pricing note<small>Alex</small>
                </div>
                <span>Yesterday</span>
              </div>
            )}
          </section>
          <footer className="record-footer">
            <button className="danger-text" onClick={onDelete}>
              Delete deal
            </button>
          </footer>
        </div>
      </div>
    </dialog>
  );
}
