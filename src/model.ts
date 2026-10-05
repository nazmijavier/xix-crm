export const stages = [
  "Discovery",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closing",
] as const;
export type Stage = (typeof stages)[number];
export type Deal = {
  id: string;
  name: string;
  company: string;
  owner: string;
  industry: string;
  color: string;
  stage: Stage;
  value: number;
  probability: number;
  closes: string;
  age: number;
  notes: string[];
};
export const boardStages: Stage[] = [
  "Discovery",
  "Negotiation",
  "Proposal",
  "Qualified",
  "Closing",
];
export const stageColors: Record<Stage, string> = {
  Discovery: "blue",
  Qualified: "green",
  Proposal: "purple",
  Negotiation: "teal",
  Closing: "pink",
};
const rows: [
  string,
  string,
  string,
  string,
  string,
  Stage,
  number,
  number,
  string,
  number,
][] = [
  [
    "Nestlé analytics rollout",
    "Nestlé",
    "Philipp Navratil",
    "Food & Beverage",
    "gray",
    "Discovery",
    267000,
    38,
    "2026-11-14",
    1,
  ],
  [
    "Salesforce CRM expansion",
    "Salesforce",
    "Marc Benioff",
    "Enterprise Software",
    "purple",
    "Discovery",
    284000,
    35,
    "2026-09-28",
    27,
  ],
  [
    "Adobe enterprise renewal",
    "Adobe",
    "Shantanu Narayen",
    "Creative Software",
    "blue",
    "Qualified",
    189000,
    44,
    "2026-11-09",
    9,
  ],
  [
    "Spotify campaign package",
    "Spotify",
    "Norström",
    "Audio Streaming",
    "orange",
    "Qualified",
    214000,
    40,
    "2026-11-04",
    28,
  ],
  [
    "NVIDIA DGX expansion",
    "NVIDIA",
    "Jensen Huang",
    "Semiconductors",
    "teal",
    "Qualified",
    156000,
    42,
    "2026-11-25",
    14,
  ],
  [
    "Vercel enterprise rollout",
    "Vercel",
    "Guillermo Rauch",
    "Cloud Platforms",
    "blue",
    "Qualified",
    325000,
    58,
    "2026-11-19",
    21,
  ],
  [
    "Figma enterprise renewal",
    "Figma",
    "Dylan Field",
    "Design Software",
    "orange",
    "Qualified",
    298000,
    47,
    "2026-12-02",
    24,
  ],
  [
    "Airbnb host expansion",
    "Airbnb",
    "Brian Chesky",
    "Travel Technology",
    "purple",
    "Qualified",
    241000,
    53,
    "2026-12-10",
    6,
  ],
  [
    "Intel cloud modernization",
    "Intel",
    "Lip-Bu Tan",
    "Semiconductors",
    "green",
    "Proposal",
    348000,
    52,
    "2026-10-30",
    15,
  ],
  [
    "Meta ads partnership",
    "Meta",
    "Mark Zuckerberg",
    "Social Media",
    "pink",
    "Proposal",
    310000,
    45,
    "2026-10-21",
    18,
  ],
  [
    "LinkedIn seats expansion",
    "LinkedIn",
    "Dan Shapero",
    "Professional Network",
    "yellow",
    "Proposal",
    126000,
    50,
    "2026-10-25",
    7,
  ],
  [
    "OpenAI API expansion",
    "OpenAI",
    "Sam Altman",
    "Artificial Intelligence",
    "gray",
    "Negotiation",
    196000,
    55,
    "2026-10-03",
    30,
  ],
  [
    "Anthropic team plan",
    "Anthropic",
    "Dario Amodei",
    "Artificial Intelligence",
    "gray",
    "Negotiation",
    232000,
    48,
    "2026-10-12",
    3,
  ],
  [
    "Google Workspace renewal",
    "Google",
    "Sundar Pichai",
    "Technology",
    "blue",
    "Closing",
    175000,
    62,
    "2026-10-16",
    26,
  ],
  [
    "FedEx logistics rollout",
    "FedEx",
    "Raj",
    "Logistics",
    "orange",
    "Closing",
    148000,
    60,
    "2026-10-07",
    11,
  ],
];
export const seedDeals: Deal[] = rows.map(
  ([
    name,
    company,
    owner,
    industry,
    color,
    stage,
    value,
    probability,
    closes,
    age,
  ]) => ({
    id: company
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""),
    name,
    company,
    owner,
    industry,
    color,
    stage,
    value,
    probability,
    closes,
    age,
    notes: ["Confirm budget before next call"],
  }),
);
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
export const shortMoney = (n: number) =>
  "$" +
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    n / 1000,
  ) +
  "K";
export const closeDate = (s: string) =>
  new Date(s + "T12:00:00")
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    .replace("Sept", "Sep");
export const total = (deals: Deal[]) =>
  deals.reduce((sum, d) => sum + d.value, 0);
export type Filters = {
  query: string;
  stage: string;
  owner: string;
  sort: string;
};
export function filterDeals(deals: Deal[], f: Filters): Deal[] {
  const q = f.query.trim().toLocaleLowerCase();
  const result = deals.filter(
    (d) =>
      (!q ||
        [d.name, d.company, d.owner, d.industry].some((v) =>
          v.toLocaleLowerCase().includes(q),
        )) &&
      (!f.stage || d.stage === f.stage) &&
      (!f.owner || d.owner === f.owner),
  );
  if (f.sort === "value-desc") result.sort((a, b) => b.value - a.value);
  if (f.sort === "close-asc")
    result.sort((a, b) => a.closes.localeCompare(b.closes));
  if (f.sort === "name-asc")
    result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
export function moveDeal(deals: Deal[], id: string, stage: Stage): Deal[] {
  return deals.map((d) =>
    d.id === id && d.stage !== stage ? { ...d, stage, age: 0 } : d,
  );
}
export function validDeal(x: unknown): x is Deal {
  if (!x || typeof x !== "object") return false;
  const d = x as Deal;
  return (
    ["id", "name", "company", "owner", "industry", "color", "closes"].every(
      (k) => typeof d[k as keyof Deal] === "string",
    ) &&
    !!d.id &&
    !!d.name.trim() &&
    !!d.company.trim() &&
    stages.includes(d.stage) &&
    Number.isFinite(d.value) &&
    d.value >= 0 &&
    Number.isFinite(d.probability) &&
    d.probability >= 0 &&
    d.probability <= 100 &&
    Number.isInteger(d.age) &&
    d.age >= 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(d.closes) &&
    !Number.isNaN(Date.parse(d.closes)) &&
    Array.isArray(d.notes) &&
    d.notes.every((n) => typeof n === "string")
  );
}
export function parseImport(text: string): Deal[] {
  const result: unknown = JSON.parse(text);
  if (
    !Array.isArray(result) ||
    result.length > 2000 ||
    !result.every(validDeal) ||
    new Set(result.map((d) => d.id)).size !== result.length
  )
    throw new Error(
      "Use a Xix JSON export with valid, unique deal records (up to 2,000).",
    );
  return result;
}
export function loadDeals(): Deal[] {
  try {
    const s = localStorage.getItem("xix.deals.v1");
    return s ? parseImport(s) : structuredClone(seedDeals);
  } catch {
    return structuredClone(seedDeals);
  }
}
export function csvExport(deals: Deal[]): string {
  const cell = (v: unknown) =>
    '"' +
    String(v)
      .replace(/^[=+@\-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return [
    [
      "Deal",
      "Company",
      "Stage",
      "Owner",
      "Industry",
      "Value",
      "Probability",
      "Closes",
      "Age",
    ],
    ...deals.map((d) => [
      d.name,
      d.company,
      d.stage,
      d.owner,
      d.industry,
      d.value,
      d.probability,
      d.closes,
      d.age,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
