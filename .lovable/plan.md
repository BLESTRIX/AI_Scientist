# The AI Scientist — Experiment Plan Generator

A premium, dark-mode research tool where users enter a hypothesis and receive a fully rendered, operationally realistic experiment plan. This first build is a polished frontend wired to a mock JSON contract so the UI can be tested end-to-end before any AI backend is connected.

---

## Visual & Interaction Direction

- **Theme**: Strict dark mode. Deep slate-950 background with layered ambient aurora — soft, blurred radial gradients in deep purple, teal, and neon blue tucked behind content corners.
- **Surfaces**: Glassmorphism on every card, table, and container — semi-transparent slate, backdrop blur, hairline white borders.
- **Accent**: A single neon accent (glowing teal/purple) reserved for the primary CTA, novelty highlights, and active states.
- **Typography**: Clean sans (Inter) with generous spacing for readability over glass.
- **Motion**: Subtle fade/slide on state transitions; soft pulse on loading text; gentle glow on the primary button.

---

## App Structure

Single-page experience with three sequential states swapped in place:

```text
┌─────────────────────────────────────────────────┐
│  Top Navbar:  [Logo] ............ [Filters ▾]  │  ← notifications drop from here
├─────────────────────────────────────────────────┤
│                                                 │
│             [ Input → Loading → Dashboard ]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

No bottom nav. No bottom filters. All toasts/alerts originate from the top navbar region.

---

## Views

### 1. Top Navbar (persistent)
- Left: "The AI Scientist" wordmark with a small glowing icon (Lucide `FlaskConical` or `Atom`).
- Right: **Filters/Settings dropdown** (Lucide `SlidersHorizontal`) with options like Domain, Budget Cap, Timeline Limit, Risk Tolerance.
- Toast notifications anchored top-center, sliding down from beneath the navbar.

### 2. Input View (landing)
- Vertically centered hero.
- Short tagline: "From hypothesis to bench-ready protocol."
- Large multi-line textarea — placeholder: *"e.g., Does intermittent fasting alter gut microbiome diversity in mice?"*
- Primary CTA: **"Generate Experiment Plan"** with neon glow.
- Subtle helper row: example prompts as clickable chips.

### 3. Loading View
- Replaces input in place.
- Animated orb/pulse with two-phase cycling text:
  1. "Scanning Literature for Novelty…"
  2. "Generating Operational Protocol…"
- Phases auto-advance on a timer for the mock; toast confirmation when complete.

### 4. Dashboard View (results)

Four sections rendered from the mock JSON:

**A. Literature Novelty Badge (top, full width)**
- Prominent glass card with status pill (e.g., "Similar work exists" in amber, or "Novel direction" in teal).
- Short summary sentence.
- 2 citation links rendered as chips with `ExternalLink` icons — title, authors, year.

**B. Protocol Steps (main column, ~2/3 width on desktop)**
- Vertical numbered stepper (6 steps from mock).
- Each step: title, description, duration estimate.
- **Every step has a small `Edit2` icon button** on the right — opens an inline edit affordance (textarea + Save/Cancel) to support the future feedback loop.
- Edited steps get a subtle "modified" marker.

**C. Materials & Budget (side column, ~1/3 width; collapses to tab on mobile)**
- Glass data table: Reagent · Catalog # · Supplier · Price.
- `Copy` icon next to each catalog number → copies to clipboard, fires top-navbar toast.
- 5 rows from mock.
- **Total Estimated Cost** highlighted in a footer row with neon accent.

**D. Timeline (bottom, full width)**
- Horizontal phased bar — segments for Prep (Weeks 1-2), Execution (Weeks 3-8), Analysis (Weeks 9-10), Writeup (Weeks 11-12).
- Each segment labeled, color-graded, hoverable for detail.

Below the dashboard: a "New Hypothesis" button to reset back to Input view.

---

## Mock Data Contract

A single `mockExperimentPlan.ts` file exporting an object shaped to mirror the future API:

```text
{
  novelty: { status, summary, citations: [{title, authors, year, url} x2] },
  protocol: [{ id, title, description, duration } x6],
  materials: [{ reagent, catalogNumber, supplier, price } x5],
  totalCost: number,
  timeline: [{ phase, weeks, description } x4]
}
```

The UI renders this object exactly so swapping in a real API later is a one-line change.

---

## Technical Notes

- **Stack**: React + Vite + TypeScript, Tailwind, shadcn/ui, Lucide React (all already in the project).
- **State**: Local `useState` for the three-phase view machine (`'input' | 'loading' | 'results'`); no router changes needed — all on `/`.
- **Design tokens**: Extend `index.css` with new HSL variables for the dark base, glass surfaces, aurora gradient stops, and neon accent. All colors via tokens — no hardcoded hex in components.
- **Aurora**: Implemented as fixed-position blurred radial gradient divs behind a `relative` content wrapper.
- **Glass utility**: A reusable `.glass` class (or Tailwind compositional pattern) for consistent surfaces.
- **Toasts**: Sonner, repositioned to top-center to read as "dropping from the navbar."
- **Files added**:
  - `src/data/mockExperimentPlan.ts`
  - `src/components/layout/TopNav.tsx`
  - `src/components/layout/AuroraBackground.tsx`
  - `src/components/scientist/HypothesisInput.tsx`
  - `src/components/scientist/LoadingState.tsx`
  - `src/components/scientist/NoveltyCard.tsx`
  - `src/components/scientist/ProtocolStepper.tsx`
  - `src/components/scientist/MaterialsTable.tsx`
  - `src/components/scientist/TimelineBar.tsx`
  - `src/pages/Index.tsx` (rewritten as the orchestrator)
- App forced to dark mode by adding `dark` class to `<html>` in `index.html`.

---

## Out of Scope (this build)

- Real AI/LLM backend, literature search, or persistence.
- Auth, user accounts, saving plans.
- Export to PDF/CSV.
- Mobile-first redesign beyond responsive collapsing of the side column.

These can be added in follow-up iterations once the UI is approved.