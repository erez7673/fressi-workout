# Fressi Workout App – Requirements Spec

Personal workout app for two users (a couple) training at **Fressi Jätkäsaari, Helsinki**.
Equipment brands in the gym: **Gym80** and **Matrix**.

## Platform
- **Installable web app (PWA)**: one codebase for Android and iPhone, installed with "Add to Home Screen".
- Hosted free on **GitHub Pages** (the user creates the repo and shares the username).
- Works offline at the gym; syncs when online.
- English UI, metric units (kg / cm).

## Users & data
- Separate profiles (one per person), each with its own plan and history.
- Sync through **Google Sheet + Google Apps Script** web app (backup + see each other's progress).
- Local storage on the phone is the working copy; the Sheet is the sync/backup.

### Profile stats
- Age, sex, height, weight
- Experience level (beginner / intermediate / advanced)
- Injuries / limitations → exclude or swap exercises (shoulder, knee, lower back, …)
- Body-focus preferences (e.g. glutes, arms, chest) + favourite / disliked exercises
- Goal: hypertrophy, fat loss / tone, strength, general fitness
- Training days per week: 2–5; session length: 30–75 min

## Plan generator
- Multi-week program (e.g. 12 weeks), like the example app's "The Machine Method".
- Split chosen by days/week: Full body (2–3), Upper/Lower (4), Upper A/B/C + Lower or PPL (5).
- Goal sets reps/sets/rest:
  - Strength: 4–6 reps, 4–5 sets, 2–3 min rest
  - Hypertrophy: 8–12 reps, 3–4 sets, 60–90 s rest
  - Fat loss: 12–15 reps, 3 sets, 45–60 s rest + cardio finisher
  - General: 8–12 reps, 3 sets, 60–90 s rest
- Uses only equipment enabled in **Gym Setup**.
- **Progressive overload**: suggests the next weight/reps from logged performance.
- Warm-up and cooldown blocks; optional cardio blocks (treadmill, elliptical, stair climber).

## Workout screen (modelled on example app)
- Week view with day cards (e.g. "Upper A – Chest, Triceps, Shoulders & Core") with completion ticks.
- Exercise list: picture, name, set chips ("12 × 15 kg"), "Rest: 90 s" between exercises, **Start** button.
- Active set view: big "8 × 5 kg", pause and complete buttons, set table (Set / Reps / Kg / Log) with editable values.
- **Timers**: set timer (work) and auto-start rest countdown after each logged set; sound/vibration at end; keeps time when screen locks.
- ⓘ info button → how-to instructions.

## Equipment & instructions (no AI for now)
- **Built-in exercise library** (~100+ exercises) with short step-by-step instructions, muscles, equipment type.
- **Gym Setup**: pre-loaded with equipment identified from the gym photos, toggle on/off:
  Smith machine, cable stations / crossover, power racks with barbells, adjustable benches,
  preacher curl bench (Gym80), dumbbell racks, plate trees / Olympic plates, plate-loaded
  machines (chest press, incline press, row, etc.), selectorized machines, treadmills, ellipticals,
  stair climber, TRX straps.
- **Add new equipment by photo**:
  1. Take photo (stored with the item).
  2. **Guided "What is this machine?" picker**: body position (seated / lying / standing) → what you
     hold or push (handles, bar, pad, cable) → movement direction → where you feel it.
  3. Optional: model name from the Gym80 / Matrix plate on the frame.
  4. App matches library exercises (1–3 suggestions) or generates a short generic how-to from a
     movement-type template (press, pull, row, fly, curl, extension, squat/leg press, hinge, raise…).
- Unknown machines can also be photographed and sent to Claude during development to be added to the library.
- **Hook for optional AI photo recognition later** (Claude API via Google Apps Script proxy).

## Extras
- Progress charts: per-exercise weight/rep trends, body-weight history.
- Plan overview: % complete, week X of 12, calories estimate, workout time.
- Settings: training days, warm-up duration, workout duration, recovery duration, gym setup.

## Out of scope (for now)
- Food / Mind tabs from the example app
- Push reminders (limited on iPhone PWAs)
- App-store distribution
