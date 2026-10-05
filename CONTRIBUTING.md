# Contributing

Fork the repository, install with `npm ci`, and run `npm run dev`.

Keep the four Figma-derived views visually consistent. Shared tokens and layout rules live in `src/styles.css`; business data rules live in `src/model.ts`. Avoid introducing a second visual system for new controls.

Before opening a pull request:

- Run `npm test` and `npm run build`.
- Check the relevant view at 1440 × 955 and 390 × 844.
- Include a screenshot for visible changes and explain any intended departure from the Figma source.
- Keep sample data fictional. Do not commit credentials, `.env` files, or browser storage.

Features that need a real service should be explicit about connection state and failure handling. Keep the starter usable without API keys.
