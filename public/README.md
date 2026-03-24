# The Public Folder: Experiment Configs, Stimuli and Resources

Files that are in the `public` folder are exposed on the study website. For technical reasons, all static files (including reVISit configurations) have to be in the public folder.

If you want to create a new experiment, you should create a new subfolder in this `public` folder that contains your reVISit config.

Example projects that explain basic reVISit functionality are:

 * [image-demo](image-demo) is the most basic study example that uses images for study stimuli.
 * [html-input](html-demo) demonstrates how to use a HTML/JS stimulus.
 * Check out the [deployed study page] for a full list and descriptions of the projects.

Folders that don't contain an experiment are:

* `assets` which contains logos, etc.
* [configs](configs) which contains a reference of the reVISit config

---

## Vignette Randomization (ai-attribution study)

### Overview

Each participant in the ai-attribution study sees **5 out of 54 vignettes**. The assignment is **balanced** — the system always picks the 5 least-shown vignettes so that all 54 get roughly equal exposure over time.

### How it works

1. **Participant ID**: When a participant starts the study, a stable ID is created for them:
   - If they provided an email earlier in the survey, that email is used.
   - Otherwise, a random anonymous ID (e.g. `anon-k7x2m9p1`) is generated and stored in the browser's **`sessionStorage`**. This means the same browser tab/session always gets the same ID — navigating between pages within the study does **not** re-randomize.
   - Opening a **new tab** or **new browser session** creates a new participant with a fresh ID (and therefore a potentially different set of vignettes).

2. **Balanced assignment**: The system maintains a count of how many times each vignette (1–54) has been assigned. When a new participant arrives:
   - It checks if this participant already has an assignment (idempotent — same participant always gets the same 5).
   - If not, it picks the 5 vignettes with the **lowest counts**, using random tie-breaking when multiple vignettes share the same count.
   - The counts are updated and the assignment is saved.

3. **Storage backends** (controlled by `VITE_VIGNETTE_MODE` in `.env`):
   - **`local`** (default): Counts and assignments are stored in the browser's `localStorage` under the key `vignette_assignment`. Good for development and testing.
   - **`supabase`**: Counts and assignments are stored in the Supabase database (the `revisit` table). Use this for production deployments where multiple participants across different browsers need to share the same global counts.

### Debug dashboard

A standalone debug page is available at:

```
http://localhost:8080/vignette-debug.html
```

> **Note:** You must open this from the same origin as your dev server (e.g. `http://localhost:8080/`) so it can access the same `localStorage`. Opening the HTML file directly via `file://` will not show the study's data.

The debug page shows:
- **Summary** — number of participants, total assignments, min/max vignette counts, and the imbalance (max − min).
- **Counts grid** — all 54 vignettes with their assignment count. Green = lowest count, red = highest count.
- **Participant table** — each participant ID and their 5 assigned vignettes.
- **Simulate 20 Participants** — button to generate 20 fake participants to verify that balancing works correctly.
- **Clear All Data** — resets all counts, assignments, and the session participant ID.

### Attention check randomization

Each vignette's question page (s1-2 matrix) includes an attention check row that asks the participant to select a specific number. The expected number varies across the 5 vignettes to prevent participants from mindlessly repeating the same answer:

| Vignette | Attention check text | Expected answer |
|----------|---------------------|-----------------|
| 1 | "Select option **seven**..." | 7 |
| 2 | "Select option **five**..." | 5 |
| 3 | "Select option **one**..." | 1 |
| 4 | "Select option **six**..." | 6 |
| 5 | "Select option **four**..." | 4 |

The row order within the matrix is also randomized per vignette (`questionOrder: "random"` on the base component), so the attention check appears at a different position each time.

### Key files

| File | Purpose |
|------|---------|
| `src/public/ai-attribution/assets/vignetteAssignment.ts` | Core assignment logic (picking, counting, local/supabase backends) |
| `src/public/ai-attribution/assets/VignetteIntroWithAssignment.tsx` | Intro page that triggers assignment and displays assigned vignette IDs |
| `src/public/ai-attribution/assets/VignetteScenario.tsx` | Renders a single vignette scenario (iframe) based on the slot index |
| `vignette-debug.html` | Standalone debug dashboard for inspecting counts and assignments |
| `.env` → `VITE_VIGNETTE_MODE` | Switch between `local` and `supabase` backends |