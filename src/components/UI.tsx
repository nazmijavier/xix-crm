import { useEffect, useRef, useId } from "react";
import type { ReactNode } from "react";
import assets from "../assets.json";
import { stageColors } from "../model";
import type { Deal, Stage } from "../model";
export const asset = (node: string, name: string) =>
  (assets as Record<string, Record<string, string>>)[node]?.[name];
export function Icon({ src, size = 14 }: { src: string; size?: number }) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable="false"
      className="icon"
    />
  );
}
export function Badge({
  children,
  color = "gray",
  stage,
}: {
  children: ReactNode;
  color?: string;
  stage?: Stage;
}) {
  return (
    <span
      className={
        "badge " + (stage ? "stage-badge " + stageColors[stage] : color)
      }
    >
      {stage && <StageIcon stage={stage} />}
      {children}
    </span>
  );
}
export function Avatar({
  name,
  full = false,
}: {
  name: string;
  full?: boolean;
}) {
  return (
    <span className="avatar" aria-hidden="true">
      {full
        ? name
            .split(/[ -]/)
            .slice(0, 2)
            .map((s) => s[0])
            .join("")
        : name[0]}
    </span>
  );
}
const logoMap: Record<string, [string, string, string?, number?]> = {
  Nestlé: ["639-74191", "imgRectangle"],
  Salesforce: ["639-74191", "imgRectangle1"],
  Adobe: ["639-74268", "imgRectangle"],
  Spotify: ["639-74268", "imgRectangle1"],
  NVIDIA: ["639-74268", "imgRectangle2"],
  Vercel: ["639-74268", "imgFrame2"],
  Figma: ["639-74268", "imgFrame3", "white", 11],
  Airbnb: ["639-74268", "imgFrame4", "#e0565b", 12],
  Intel: ["639-74489", "imgRectangle"],
  Meta: ["639-74489", "imgRectangle1"],
  LinkedIn: ["639-74489", "imgRectangle2"],
  OpenAI: ["639-72569", "imgCompanyLogoOpenAi"],
  Anthropic: ["639-72569", "imgFrame", "#d97757", 12],
  Google: ["639-74676", "imgGroup1", "white", 12],
  FedEx: ["639-72636", "imgCompanyLogoFedEx"],
};
export function CompanyLogo({
  company,
  size = 16,
}: {
  company: string;
  size?: number;
}) {
  const logo = logoMap[company];
  return (
    <span
      className="company-logo"
      style={{ width: size, height: size, background: logo?.[2] }}
    >
      {logo ? (
        <Icon
          src={asset(logo[0], logo[1])}
          size={((logo[3] || 16) * size) / 16}
        />
      ) : (
        company[0]
      )}
    </span>
  );
}
export function Probability({
  deal,
  large = false,
}: {
  deal: Deal;
  large?: boolean;
}) {
  return (
    <div
      className={"probability " + (large ? "large" : "")}
      aria-label={`${deal.probability}% probability`}
    >
      <div className="probability-track">
        <span style={{ width: deal.probability + "%" }} />
      </div>
      <span className="probability-label">{deal.probability}%</span>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    el.querySelector<HTMLInputElement>(
      "input:not([readonly]),textarea",
    )?.focus();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={"dialog " + (wide ? "wide" : "")}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby={titleId}
    >
      <div className="dialog-inner">
        <header>
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function Empty({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{detail}</p>
      {action}
    </div>
  );
}

export function StageIcon({ stage }: { stage: Stage }) {
  const icons: Partial<Record<Stage, string>> = {
    Negotiation: "/assets/stage-negotiation.svg",
    Qualified: "/assets/stage-qualified.svg",
    Closing: "/assets/stage-closing.svg",
    Proposal: "/assets/proposal-status.svg",
  };
  return icons[stage] ? (
    <Icon src={icons[stage]!} size={12} />
  ) : (
    <span className="stage-symbol discovery" />
  );
}
