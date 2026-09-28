<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project structure
- `src/routes/` files only define the URL, head() metadata and search validation; each page screen lives in `src/views/pages/<name>-page.tsx`. Why: user asked to separate views from routes.
- `src/store/` holds Redux Toolkit state (slices + helpers) for frontend-only data, persisted to localStorage. Why: user requested Redux for app state.
- MVC: `src/models/` pure types, mock data, calculations; `src/views/<domain>/` UI components; `src/controllers/` data hooks + server functions. Why: user requested top-level MVC folders.
- `src/context/` app-wide React contexts (auth); `src/layouts/` app shell + nav; `src/components/ui/` shadcn primitives; `src/utils/` pure helpers (`cn` in `@/utils/cn`); `src/services/` shared backend client re-exports; `src/assets/` media. Why: mirrors requested folder structure.
