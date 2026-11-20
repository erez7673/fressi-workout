# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fressi Workout: a personal workout PWA for two users (a couple) at Fressi Jätkäsaari gym, Helsinki (gym80 and Matrix machines). Plain HTML/CSS/ES-module JavaScript with **no build step, no package manager and no tests**. `SPEC.md` holds the original requirements; `README.md` holds the user-facing setup guide (GitHub Pages, phone install, Google Sheets sync).

- App source: `docs/` (GitHub Pages serves `main` branch, `/docs` folder) → https://erez7673.github.io/fressi-workout/
- Sync backend: `apps-script/Code.gs` (Google Apps Script web app over a Google Sheet)
- `Example App/` and `Fressi Gym equipment/` are reference photos only; they are git-ignored and must never be published.

## Commands

Run locally (also defined as `fressi` in `.claude/launch.json`, so use `preview_start` with that name):

```powershell
python -m http.server 8765 --directory docs
```

The service worker registers only on https, so localhost always serves fresh files. If the browser still shows stale CSS/JS, re-fetch with `fetch(url, {cache: 'reload'})` and reload.

Deploy = commit and push to `main`; GitHub Pages is live about 30 s later. On phones, users get updates by closing and reopening the app (the service worker is network-first).

## Architecture

**Shell and routing (`app.js`).** A hash router (`ROUTES`) maps `#/plan`, `#/day/<week>/<day>`, `#/session`, `#/ex/<id>`, `#/gym`, etc. to view functions. Each view returns `{html, cls?, full?, after?}`; `render()` writes the html into `#view`. `rerender()` re-renders and keeps the scroll position. A 250 ms interval drives all timers by updating elements marked `data-t="elapsed|rest|work|restbar|cardio|live"` in place, without re-rendering.

**Events go through an action registry (`ui.js`).** Markup never contains inline handlers. Use `data-act="name"` for clicks, `data-change="name"` for change events and `data-input="name"` for input events, then `register({ name: (el, e) => … })` in the view module. Pass parameters as `data-*` attributes. Bottom sheets are opened with `sheet(html)` and closed with the `sheet-close` action.

**State (`store.js`).** There is a single `state` object, persisted to localStorage key `fressi.v1`. It holds `profiles` (each with `stats`, `plan`, `history`, `bodyweight`), `gym` (equipment toggles, photographed machines, custom exercises), `settings` and the live `session`. After changing anything:
- mutate the object;
- call `touchProfile(p)` or `touchGym()` to bump `updatedAt` and save;
- call `scheduleSync()`.

**Sync (`sync.js` ↔ `Code.gs`).** Records are keyed `gym` and `profile:<id>`. The newest `updatedAt` wins per record (pull, then push). Requests are `text/plain` POSTs, which avoids a CORS preflight. `settings` and `session` are never synced. Both phones run the same code, so any data migration must be deterministic.

**Data model of exercises (`exercises.js`, `equipment.js`).** An exercise's `eq` string expresses equipment requirements: `a+b` means both are needed, `x|y` means alternatives, and `none` means bodyweight. `isAvailable()` / `eqOn()` in `store.js` evaluate it against Gym Setup. Exercises also carry the following fields, which drive the planner and the "What is this machine?" picker (`identify.js`):
- `pat`: plan slot pattern;
- `m` / `s`: primary and secondary muscles;
- `avoid`: injuries;
- `load`: starting weight as a fraction of body weight;
- `unit`: `reps`, `sec` or `min`;
- `pos`, `grip`, `mot`: used only by the picker.

**Planner (`planner.js`).**
- `generatePlan` builds a 12-week plan: a split chosen by days per week, `exPerDay(stats)` exercises (the profile's choice, 1–4, default `EX_PER_DAY`) × `SETS = 4` sets, plus warm-up, an optional cardio finisher and a cooldown.
- **Muscle areas per day.** `AREAS` (legs, glutes, back, chest, …) map to slot patterns. Profile → Edit profile stores the areas for each day in `p.stats.dayAreas`; `areasFor(p, dayIdx)` reads them, `setDayAreas` rebuilds one day, and `applyProfileAreas(p)` reconciles all days at startup and after a sync pull (seeded, so both phones get the same result). `sortDay` orders a day's exercises bigger muscles first (`AREA_ORDER`, compound before isolation); call it after any change to a day's exercise list. `itemArea` gives the area header shown in the day view, and `swapOptions` offers every suitable exercise of the same area.
- `restScale` shortens rests (minimum 45 s) so the longest day fits the session length.
- `prescribe` sets reps and rest by goal and phase: base, build (more reps), peak (heavier), and a deload in week 12.
- `suggest` does progressive overload from the last log. When an exercise has no log yet, it uses `p.startKg[exId]`, falling back to a body-weight estimate.
- `buildSession` turns a plan day into session items and applies the user's pre-session edits from `p.plan.edits["<week>-<day>-<exId>"]`.
- **Ready-made plans (`TEMPLATES`, `generateTemplatePlan`).** Fixed full-body beginner plans for women 50+ (6 exercises/day, 2–3 sets of 10–15 reps via `TPL_RX`). Stored as a normal plan with `plan.template`; `prescribe` switches to the template's sets/reps and `dayCap(p)` (not `exPerDay`) is the per-day exercise limit. Each slot lists preferred exercise ids and falls back to `candidates()` when equipment is off or an injury applies. Picked from the `tpl-open` sheet (My Plan → plan info, Profile).
- **Plan format is versioned (`PLAN_FMT`).** When the plan shape changes, bump `PLAN_FMT` and extend `upgradePlan`. `app.js` runs `upgradePlan` on every profile at startup and again after a sync pull. It must keep `id`, `createdAt` and finished weeks (`done`).

**Workout runtime (`workout.js`).** Holds the session state machine: set and rest timers stored as timestamps (so they survive a locked screen), beeps through Web Audio (no vibration, by design) and the screen wake lock.

**Views.**
- `views-plan.js`: plan, day preview with the set editor, session, summary.
- `views-gym.js`: exercise library, exercise page, Gym Setup, identify.
- `views-me.js`: onboarding, profile, progress (charts in `charts.js`).
- `views-timer.js`: the stand-alone Timer tab (`#/timer`): countdown and stopwatch kept in `state.timer` as timestamps (not synced). `timerTick()` runs from the app's 250 ms loop and updates `data-t="tsw|tcd"`.

**Exercise animations (`anim.js`).** Shown under "How to do it" on the exercise page; `hasAnim(id)` decides whether the page shows an animation (written steps then go into a collapsed "Written steps" box).
- **Video clips (preferred):** ids listed in `VIDEOS` play `docs/media/anim/<id>-m.mp4` or `<id>-f.mp4` (poster `<id>-m|f.jpg`), chosen by the profile's `stats.sex`. The clips are AI-generated (Higgsfield) from our own grey mannequin stills with the worked muscles in orange, on a #1c1c1e background: 4 s, silent, 1:1, encoded to 480×480 H.264 (`-crf 23 -movflags +faststart`, about 125 KB each). Never use RepDB artwork as a reference: its license forbids it.
  - Workflow per exercise: a male still (`gpt_image_2_6`, the Leg Press male still as style reference; the male wears dark grey sports shorts), a female still edited from the male still (ponytail, grey sports top and shorts; making her from scratch can trip Higgsfield's safety filter), then a `seedance_2_0_mini` video per still (4 s, 480p, 1:1, no audio, start and end image = the still, static camera). Two-handed machines: say both arms move together, or the model may move one arm only. A barbell or Smith bar always runs across the body (perpendicular to it): when the plates face the camera, a bench exercise is shown from behind the head end looking down the body to the feet (the user's choice), and a standing exercise is shown from the front; side views have the bar end-on. For the head-end bench view, put the camera high (about 45° down) and spell out the body order from bottom to top of the image (head, chest, hips, thighs, knees, feet at the far end): a low camera makes the legs appear next to the shoulders. When a new exercise shares a pose with an approved still (e.g. Smith bench vs barbell bench), edit the approved still and change only the equipment; generating from scratch can stretch the body. The video model sometimes adds a spotlight beam, so say "even soft studio light, no spotlight" in the prompt; ask for a "big, clearly visible range of motion" when a rep comes out too small; for one-arm cable moves use the person's own left/right and say which hand stays still. Check every clip's frames before using it.
- **Drawn SVG fallback:** `DEFS` holds side-view stick-figure animations (two-joint IK in `reach()`, loop timing in `phase()`); `startAnims` runs them after render.
- To add a clip: put both files in `docs/media/anim/` and add the exercise id to `VIDEOS`.

**Equipment pictures (`pictures.js`).**
- Pictures are **hotlinked, not stored in the repo**: gym80 from `gym80.de/wp-content/uploads/…webp` (`P()`), Matrix strength and cardio machines from `assets.jhtbrand.co/files/product/<hash>/` (`M(name, hash)`). Matrix pictures are used for machines confirmed in the gym, and also as black stand-ins for gym80 weight-stack and cable machines, because gym80 only pictures those in gold (the user doesn't want gold machines shown).
- `EQUIP_PIC` maps equipment id → picture. `EX_PIC` holds per-exercise overrides. `picFor(ex)` uses the first equipment token of `ex.eq`.
- `thumb()` in `ui.js` shows, in order of preference: the user's own machine photo, then the maker's picture, then a line icon (`onerror` removes a broken image).
- gym80 product data is available from the WP REST API at `/wp-json/wp/v2/fitness_equipment`, but it has no images; image URLs have to be taken from the product pages.

**Service worker (`sw.js`).**
- App files are network-first and fall back to cache `fressi-vN`; maker pictures are cache-first in `fressi-pics-v1`.
- **When adding a JS/CSS file, add it to `FILES`**, otherwise it won't work offline.
- Bump `CACHE` when the set of files changes.
- Anything under `/media/` bypasses the service worker: iPhone Safari loads video with range requests, which the cache can't answer. Clips and their posters are therefore not available offline (beyond the browser's own HTTP cache).

## Conventions

- **UI text:** English, metric units, plain wording aimed at non-technical users.
- **Theming:** light/dark is driven by CSS custom properties in `css/app.css`, switched by `data-theme` on `<html>` (auto follows the phone). Use existing tokens such as `--card`, `--ink`, `--ink3`, `--blue`, and don't invent new ones (e.g. there is no `--muted`).
- **Icons:** the UI uses line-icon SVGs from `icon` in `ui.js`, not emoji, for equipment and exercises.
- **Commits:** use a short imperative subject.
