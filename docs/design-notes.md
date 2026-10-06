# Design and interaction notes

## Source frames

The Develop section (`650:39011`) contains four app frames, each 1440 × 955. The white 1600 × 1200 presentation margins are not part of the app.

| View           | Figma node   | Route                  |
| -------------- | ------------ | ---------------------- |
| Deals table    | `639:74111`  | `/deals`               |
| Sales pipeline | `639:72171`  | `/deals/board`         |
| Record peek    | `639:101583` | `/deals?record=openai` |
| Workflow       | `639:75959`  | `/workflows`           |

The main surface starts at x=240, y=4 and measures 1196 × 947 on desktop. Workflow uses the same 240 px expanded sidebar as Deals; manual collapse is preserved across navigation. Typography is Inter; the screen uses the original 12 px labels, 14 px card titles, 20 px Deals title, and source badge palettes.

Board columns are 266.4 px wide with 8 px gaps, 24 px corner radii, and 12 px internal padding. Cards have 12 px radii and 184 px height. Discovery and Closing use the source's 12 px card gap; the other columns use 8 px. The list has a 48 px header, 40 px toolbar, 34 px column heading, 30 px group headings, and 44 px rows.

Original SVG/PNG assets are local. Workflow cards start at the Figma coordinates; SVG Bézier connectors attach to the current card edges as cards move. The logo's original video paint cannot be exported through the Figma API; the expanded sidebar uses the matching Meya brand poster, while the compact sidebar uses the exact Xix SVG export.

Figma's GLASS effect has no equivalent native CSS implementation. The web version approximates it using the original translucent fill, backdrop blur, and a restrained inset edge highlight. Refraction and font rasterization can differ between Figma and browsers; absolute pixel equality is not claimed.

## Fidelity decisions and fixes

| Before / source issue                                  | Implemented                                          | Why                                           |
| ------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------- |
| OpenAI has conflicting values/stages in table and peek | Both views read the same deal                        | Editing must not show contradictory records   |
| Progress bar fills disagree with percentage labels     | Width follows the percentage                         | The visual now communicates the actual value  |
| Footer suggests 40 records although fixture has 15     | Actual visible range/count                           | Avoids fake pagination                        |
| Glass borders added 2 px to card/node height           | Inset edge highlight within source dimensions        | Preserves the 184/96 px sizes                 |
| Compact sidebar loses visible labels                   | Explicit accessible names                            | Controls remain identifiable on small screens |
| Brand marks relied on expiring remote asset URLs       | Original assets served locally                       | Shared demo remains reproducible              |
| Dense tables risk page overflow on mobile              | Internal horizontal scrolling and compact navigation | Keeps the app viewport usable                 |

The two requested skills, **better-ui** and **emil-design-eng**, informed radius, alignment, hit-area, focus, reduced-motion, and interaction decisions. The Figma composition remains the visual authority.

## Interaction map

- List / Board changes the route and preserves filters.
- A record pill or board card opens the record peek. Close/Escape returns to the underlying view.
- Edit opens a validated form; saving updates the list, board, totals, and peek together.
- Open presents a larger record view. Previous/next move through available records and stop at the ends.
- Stage select and desktop drag/drop move a deal and reset its stage age. Changes persist locally.
- Add in a column preselects that column's stage. The global Add defaults to Discovery.
- Search matches deal, company, industry, or owner. Owner/stage filters combine; sort applies within groups.
- Selection supports bulk move/delete. Delete requires confirmation. A recent mutation can be undone from the notification.
- JSON import validates records and merges by unique ID. CSV export escapes fields and guards formula prefixes.
- Workflow nodes can be selected, renamed, and dragged freely at any zoom. Arrow keys move a focused card by 10 px (Shift: 1 px). Positions persist in this browser; connectors, selection tools, and minimap follow the cards. Background drag pans; fit-to-screen includes the current card positions. The minimap shows the real viewport, follows pan/zoom and card movement, supports dragging the viewport, and centers the canvas when clicking outside it. Focused minimap arrow keys pan; Enter fits the graph. Canvas zoom uses 40–180% bounds and keeps the viewport center fixed with −/+; clicking the percentage resets to 100%. Ctrl/⌘ + wheel or trackpad pinch zooms around the pointer, while regular wheel/trackpad scrolling pans the canvas. Sidebar and controls remain their original size. Run simulates the sample $267k deal locally. Publish toggles a local demo state.
- Share copies a URL, not local data. Unavailable sidebar pages, notifications, invitations, and the Pro entry are disabled. The compact sidebar includes a working Deals entry for returning from Workflows. AI controls explain their demo boundaries.

## Verification

- TypeScript and Vite production build pass.
- Four unit tests pass: immutable stage moves/value preservation; combined filters/sorting; JSON validation/roundtrip; CSV escaping/formula handling.
- Browser checks: original-size list/board/peek/workflow, 390 × 844 board, create/edit, stage and value synchronization, persistence after reload, combined filters, reset and undo, workflow node renaming, zoom, and local simulation. Cloudflare deep-link reload and asset loading were checked on the deployed site.
- Source screenshots were comparison references only; no full-screen screenshot is used as application UI.
- Not verified: physical iOS/Android devices, all browser engines, a full screen-reader audit, full WCAG contrast compliance, or the browser Animations panel at 10% speed. High-frequency controls are intentionally immediate.

The source's small targets and subdued workflow helper text need a separate accessibility pass if strict WCAG AA certification is a release requirement. That pass may require visible changes to the supplied design.

## Updated stage icons

The latest table reference (`639:73154`) supplies the status icons used in group headings and stage badges. The 12 px negotiation, qualified, and closing SVGs are local assets; Discovery retains the source dashed-circle construction and Proposal reuses its original export. The deal briefcase uses the supplied 10 px export in its 16 px purple tile. Counts and stage assignments continue to follow saved deal data. Unavailable sidebar entries use aria-disabled and have no activation handler. They keep their original appearance and show no modal, toast, or unavailable tooltip when clicked or activated with the keyboard.

## Updated outer corners

The latest POST 1–4 source uses 0 px outer app corners. The October 6 follow-up overrides the original square main surfaces with 16 px rounded corners on List, Kanban, and Workflow; the record-peek background (`639:101585`) and drawer (`639:102276`) retain 16 px. The sidebar uses 12 px, pipeline columns 24 px, deal cards 12 px, and workflow nodes 14 px. The standalone dashboard `658:39011` still has an 18 px outer frame; it is a separate, unavailable screen and does not override the POST app frames.

The October 6 icon update normalizes outline SVG strokes to 1.1 px while preserving Figma paths, colors, root dimensions, and solid brand/company artwork.

The later October 6 annotation sets the main surface left corners to 0 px; right corners and the record drawer stay 16 px. Forecast, Calendar, and Sequences now use the filled Figma exports from sidebar 639:101584. Export/Import uses the Meya upload glyph instead of the filter shown in the source. Sidebar outline strokes are 1.1 px with non-scaling stroke; the Email glyph retains its natural aspect ratio inside a 14 px slot.
