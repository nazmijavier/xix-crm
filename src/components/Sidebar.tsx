import { Icon, asset } from "./UI";
const A = (name: string) => asset("639-102905", name);
const primary = [
  ["Home", "imgHome"],
  ["Tasks", "imgCheckSquare", "7"],
  ["Notes", "imgFileText"],
  ["Email", "imgMail", "12"],
  ["Reports", "imgBarChart2"],
  ["Workflows", "imgZap"],
];
const crm = [
  ["Deals", "imgFrame1", "48", "#606165"],
  ["People", "imgFrame2", "214", "#866de5"],
  ["Companies", "imgFrame3", "86", "#3a70db"],
  ["Activities", "imgFrame4", "", "#35c283"],
];
const shortcuts = [
  ["Northwind Traders", "imgFrame5", "", "#ff7a59"],
  ["Forecast", "imgMeyaOutlineBarChart", "", "#3a70db"],
  ["Calendar", "imgMeyaOutlineCalendar", "", "#35c283"],
  ["Sequences", "imgMeyaOutlineEmail", "", "#866de5"],
];
export default function Sidebar({
  collapsed,
  workflow,
  workspaceName,
  onNavigate,
  onSearch,
  onCollapse,
  onPanel,
}: {
  collapsed: boolean;
  workflow: boolean;
  workspaceName: string;
  onNavigate: (view: string) => void;
  onSearch: () => void;
  onCollapse: () => void;
  onPanel: (panel: string) => void;
}) {
  const nav = (items: string[][]) =>
    items.map(([label, icon, count, color]) => (
      <button
        key={label}
        aria-label={label}
        title={collapsed ? label : undefined}
        className={
          "nav-item " +
          ((workflow ? label === "Workflows" : label === "Deals")
            ? "selected"
            : "")
        }
        onClick={() =>
          label === "Deals" || (label === "Home" && workflow)
            ? onNavigate("list")
            : label === "Workflows"
              ? onNavigate("workflow")
              : onPanel(label)
        }
      >
        <span
          className={color ? "nav-color" : ""}
          style={{ background: color }}
        >
          <Icon src={A(icon)} size={color ? 10 : 14} />
        </span>
        {!collapsed && (
          <>
            <span>{label}</span>
            {count && <span className="count">{count}</span>}
          </>
        )}
      </button>
    ));
  return (
    <aside
      className={"sidebar " + (collapsed ? "collapsed" : "")}
      aria-label="Main navigation"
    >
      <div className="sidebar-top">
        <button
          className="workspace"
          onClick={() => onPanel("Workspace")}
          aria-label="Meya Studio workspace"
        >
          <img
            className="brand-mark"
            src={
              collapsed
                ? asset("639-75960", "imgFrame2147236489")
                : "/assets/meya-brand.jpg"
            }
            width="30"
            height="30"
            alt="Xix"
          />
          {!collapsed && (
            <>
              <span>
                <strong>{workspaceName}</strong>
                <small>Sales workspace</small>
              </span>
              <Icon src={A("imgFrame")} size={12} />
            </>
          )}
        </button>
        {!collapsed && (
          <div className="search-row">
            <button className="search-button" onClick={onSearch}>
              <Icon src={A("imgSearch")} />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            <button
              className="notification"
              onClick={() => onPanel("Notifications")}
              aria-label="Notifications"
            >
              <Icon src={A("imgBell")} />
            </button>
          </div>
        )}
        <nav>
          {nav(primary.slice(0, 1))}
          {collapsed && (
            <button
              className="nav-item"
              onClick={() => onPanel("Notifications")}
              title="Notifications"
            >
              <Icon src={A("imgBell")} />
            </button>
          )}
          {nav(primary.slice(1))}
        </nav>
        {!collapsed && (
          <>
            <div className="nav-section">
              <div className="nav-heading">
                CRM
                <button
                  onClick={() => onPanel("Add deal")}
                  aria-label="Add CRM record"
                >
                  <Icon src={A("imgPlus")} size={12} />
                </button>
              </div>
              <nav>{nav(crm)}</nav>
            </div>
            <div className="nav-section">
              <div className="nav-heading">Shortcuts</div>
              <nav>{nav(shortcuts)}</nav>
            </div>
          </>
        )}
      </div>
      <div className="sidebar-bottom">
        <button
          className="nav-item"
          onClick={() => onPanel("Invite teammates")}
          aria-label="Invite teammates"
          title={collapsed ? "Invite teammates" : undefined}
        >
          <Icon src={A("imgUserPlus")} />
          {!collapsed && <span>Invite teammates</span>}
        </button>
        <button
          className="nav-item"
          onClick={() => onPanel("Workspace settings")}
          aria-label="Workspace settings"
          title={collapsed ? "Workspace settings" : undefined}
        >
          <Icon src={A("imgMeyaOutlineSettings")} />
          {!collapsed && <span>Workspace settings</span>}
        </button>
        <div className="trial-row">
          {!collapsed && (
            <button className="trial" onClick={() => onPanel("Plans")}>
              <span className="count">12</span>
              <span>days left</span>
              <span className="upgrade">Upgrade to Pro</span>
            </button>
          )}
          <button
            className="collapse"
            onClick={onCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon src={A("imgFrame6")} />
          </button>
        </div>
      </div>
    </aside>
  );
}
