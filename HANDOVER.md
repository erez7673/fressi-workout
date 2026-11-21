# Handover: exercise how-to clips (3D mannequin videos)

Read this together with `CLAUDE.md` (the "Exercise animations" section holds the full rules). This file records where the work stands and every approved Higgsfield still, so a new chat can continue without redoing anything.

_Last updated 2026-11-20, after batch 7._

## Where things stand

- **Done and in the app:** 71 exercises have male + female clips (`VIDEOS` in `docs/js/anim.js`): leg press plus batches 1–7.
- **Git:** batches 1–6 are pushed (last commit `496d73a`). **Batch 7 is NOT committed yet.** Uncommitted:
  - `docs/js/anim.js`
  - `CLAUDE.md`
  - 40 files in `docs/media/anim/`
  - this file
  - `tools/clips/`
- **Credits:** 148.66 Higgsfield credits left. A batch of 10 costs about 50–65.
- **Workflow with the user:** generate 10 exercises per batch, then send a review video and wait. When the user answers "Yes, push and continue", commit and push, then start the next batch. Never push without that answer.

## Still to do (25 exercises, cardio excluded)

| Group | Exercise ids |
|---|---|
| Chest leftovers | `cable-fly-low`, `cable-fly-high`, `incline-db-fly` |
| Lunge leftover | `smith-split-squat` |
| Glutes | `hip-thrust`, `smith-hip-thrust`, `glute-bridge`, `abductor`, `adductor`, `cable-kickback` |
| Calves | `smith-calf`, `leg-press-calf`, `db-calf`, `calf-machine` |
| Core | `plank`, `side-plank`, `knee-raise`, `hanging-leg-raise`, `cable-crunch`, `woodchop`, `db-woodchop`, `pallof`, `dead-bug`, `ab-machine`, `rotary-torso` |

Suggested batch 8: the glutes, the calves, `smith-split-squat` and `incline-db-fly`.

Static holds (`plank`, `side-plank`) need only a gentle breathing or hold motion.

Optional later: the batch 2 bench clips (`bb-bench`, `smith-bench`, `smith-incline`, `db-bench`, `db-incline`, `db-fly`) still use the older, higher camera and the old single-still method. The user has not asked to redo them yet.

## User requirements (all permanent)

- **Look:** grey faceless mannequin on a dark `#1c1c1e` background, with the worked muscles in **orange**.
- **Clothing:** men wear dark grey sports shorts. Women are edited from the male still, never made from scratch: ponytail, grey sports top and grey shorts.
- **Two-handed moves:** both arms move together.
- **Bar direction:** a barbell or Smith bar always runs **across** the body.
  - Bench exercises use the head-end three-quarter view (about 30° up, swung about 35°).
  - Standing exercises are shown from the front or a three-quarter front view.
- **Legs must look natural:** never "4 legs" (knees or feet appearing beside the shoulders), and never stretched.
  - Check the mid-rep and bottom frames of every clip at full size.
- **No "long body" distortion.** This is why every clip uses the keyframe method below.
- **Review before spending more:** after every 10 exercises, show the user before generating more.
- **Off-limits material:**
  - Never use RepDB artwork.
  - Never publish `Example App/` or `Fressi Gym equipment/`.

## Method (from batch 6 on)

1. **Make two keyframe stills per exercise:** a top-of-rep still and a bottom-of-rep still, with the same camera, zoom and body size.
   - **Small pose change** (arms and bar only): make the bottom still by editing the top still.
   - **Big pose change** (hinges, lunges, step-ups): editing re-frames the scene. Instead, generate ONE `aspect_ratio: "21:9"` image with "two animation frames side by side, same locked-off camera, same zoom, same size", using the approved top still as reference.
     - Split it with `tools/clips/split.sh`.
     - Run `tools/clips/align.py find` to get the sideways shift that lines up the planted foot or the equipment.
     - Run `tools/clips/align.py make` to write two aligned 576×576 frames.
     - Upload both frames with `media_upload` and run `tools/clips/put.sh` (it strips CRLF from the URLs), then `media_confirm`.
     - `size` values like `1024x512` fail; use `aspect_ratio` instead.
2. **Make the female pair** by editing the whole male pair image in one go. If a leg comes out stretched, edit the two male stills one at a time instead.
3. **Check the pair:** `tools/clips/pairs.sh` makes a 50% overlay. Only the moving limbs may show double.
4. **Generate the video:** `seedance_2_0_mini`, 4 s, 480p, 1:1, `generate_audio: false`, `use_unlim: false`. Use `start_image` = top still and `end_image` = bottom still.
   - The prompt must include: "Locked-off static camera, no camera movement, no zoom. Even soft studio light … no spotlight", plus "glowing orange highlighted <muscles> … stay visible the whole time". Without that phrase the orange disappears.
5. **Make the loop:** run `tools/clips/bounce.sh half.mp4 loop.mp4 check.png`. It plays the half rep at 2x and then reversed, giving a 4.13 s loop. In `check.png`, the head, torso and equipment must line up.
6. **Leg check:** look at the mid-rep and last frames at full size.
7. **Encode:** `tools/clips/enc.sh loop.mp4 <id>-m|f` writes `docs/media/anim/<id>-m|f.mp4` and `.jpg`.
8. **Register:** add the ids to `VIDEOS` in `docs/js/anim.js`.
9. **Verify:** check playback in the app (`preview_start` name `fressi`, go to `#/ex/<id>`).
10. **Review video:** build an xstack grid of all 20 clips and send it to the user.

**Image model:** `gpt_image_2_6`, 1:1, `use_unlim: false`, 0.25 credits per image. Pass references as `medias: [{value: <job id>, role: "image_references"}]`.

**Style reference:** the leg press male still `cc1a619b-2084-4fce-9fb2-e76b95e13c28`.

Every ID below is a Higgsfield job ID or uploaded media ID. Each can be passed directly as a `medias` value.

## Approved stills, by exercise

### Leg press and batch 1 (single still, start = end)

| Exercise | Male | Female |
|---|---|---|
| leg-press | cc1a619b-2084-4fce-9fb2-e76b95e13c28 | 76b41f3f-bc58-4032-81cb-c40d7ecc8b6d |
| machine-chest-press | 159e09c2-8f5d-4640-b771-1ad88f7632fb | 26333113-af37-4e6b-bd53-992c0e6dfb22 |
| machine-shoulder-press | a47634e4-144e-4d61-9c41-7118e8c86603 | d5471aee-1789-4268-87ab-deda12e58250 |
| pec-deck | c8571158-4ee6-4053-b136-db20224e12ed | 81429951-9bd3-41b9-a7d3-1d4d2ed85075 |
| lat-pulldown | b5501f96-4cec-449d-92ed-04db69540d43 | f7cd6cdf-d25f-42c9-a351-88dd3cff6d0d |
| seated-cable-row | 5e156ce0-2fa3-4112-a52c-1307b40a2bef | 7768d3c3-3bd7-4873-9b98-0c9697139a25 |
| machine-row | b1ec1293-4783-4922-8c63-26ec0108f614 | 1526a273-4f29-4c50-884e-fce9787b9495 |
| leg-extension | e317ddca-9094-4688-99a5-611be4bb341f | 9faab354-2c94-40c1-a77a-b603db24662c |
| leg-curl | e1c1b8b7-edb1-4ce8-823e-130497bdcd82 | 37b0b308-92e8-4e13-8299-740b3dfba82a |
| hack-squat | 5c9ae4bb-acb1-4cbc-99b8-f96483e1d0f6 | 55f4019f-cc0e-4189-90d5-abe1a7cbbf26 |
| hip-thrust-machine | 17f72365-e3b4-49de-b05a-d2350d42939e | 95ab8ab1-caa6-4d09-ae3d-ee57a04aa9f7 |

### Batch 2: chest (single still)

| Exercise | Male | Female |
|---|---|---|
| bb-bench | c00982b4-39b0-4fbf-a49b-5d0ffa448690 | 477a375f-c452-46d2-94a4-35990bcfcedd |
| smith-bench | 2e688d5f-ad30-4b10-ac79-48e0bf8b6bab | fd81e65c-95b5-46be-b6d9-2dc141ef341f |
| db-bench | 2a2e2c3b-c015-479e-a2f5-2f2ff696ee66 | 4ead0dbe-3d80-45b7-a776-838fe420a00d |
| db-incline | 592104e5-a831-4545-9852-1e10d84a0205 | eca2c5b5-f274-4920-9413-a84e4d12166e |
| smith-incline | 6eae8ea1-296a-41be-834a-ac024747ed28 | c3412006-ec40-4a75-a4dd-a14f8d22f898 |
| plate-chest-press | f7f35753-a22f-4d2f-980f-134cca132efd | c37e7b34-bd06-4320-b60e-a64ce466a364 |
| plate-incline-press | cc8637c3-bc11-40c4-9f42-1c64634e5503 | 9b3f642b-f73c-4824-9993-c48e45f37ede |
| pushup | 7d178ac7-262f-47c1-95f5-4b9d83b0cda6 | 48699919-dcd4-48a4-8132-b6f26cce2a2f |
| cable-fly | 4d64bfce-18ba-4e7a-9088-53a40e5b5c96 | ec93b7cb-6ba1-4b86-9b1d-34659a793feb |
| db-fly | 37a057cb-862d-4471-9d62-845f46ed4522 | 64ede3bf-4dc6-469f-bbee-3165e3993050 |

### Batch 3: shoulders and pulldowns (single still)

| Exercise | Male | Female |
|---|---|---|
| db-shoulder-press | de057056-764f-4dd8-8b61-725d6e28125c | cc925cd1-5933-470c-8a29-4477c5873775 |
| smith-ohp | bad68235-4f7c-4673-ade0-0f71e2070058 | 0a7939ba-fdf6-447d-aa22-168f3799f1d7 |
| bb-ohp | cc06fa5b-7ee6-428a-94f8-10006a2bf7eb | fc55ab9f-d0d7-49d4-955a-ba3b53f3246e |
| arnold-press | d8082e5d-aa2b-4bf5-8b54-865df9d5317b | 4d993cd1-7d0d-49e1-9d9f-ebf7da851302 |
| db-lateral | 9bd5b36b-5bbf-416c-aa90-4faca062695d | 2b3fa396-fc41-4d1e-bb3e-955d66c9bdfb |
| cable-lateral | 939dfa9a-555d-4f15-98f0-ff2e035bc37e | 2cea6113-6b83-45bb-8472-c95c3eb7d132 |
| face-pull | 6c0b2f72-f3e5-4247-87ce-d456085d8a11 | b20bcd5d-c38f-48f7-99ba-29ef7ccb1bfa |
| db-rear-fly | 689b350f-8687-4865-b839-85debb9a169b | cf5f333f-92b1-40a5-a8bd-99491fcdaf51 |
| close-pulldown | 765d6806-8038-4527-93ec-8ada01699fc0 | 94072adc-945e-4f3f-9ff6-12efb86639ae |
| assisted-chin | da025bcf-5627-4882-bb0c-0053027a2a04 | bbaccede-8358-4800-a7d6-55958999de99 |

### Batch 4: back and traps (single still)

| Exercise | Male | Female |
|---|---|---|
| reverse-pec-deck | 899b9aea-7212-4d35-8231-2ed347075cea | a0f83752-2ebf-4c5a-9d1c-acee5bfdca03 |
| pullup | cba5baaa-6986-4aaa-be8a-ff72986304ab | 4778f2d0-4eeb-449e-b818-078c2a195fc4 |
| straight-arm-pulldown | 8f2d80f6-8026-4ae8-ba51-0e2a626a4dc7 | 4dabc2fb-23d1-474c-bad9-c99dd2c75f8c |
| crossover-row | 7d0968c6-0ef4-4be9-bd34-79d6f151dc19 | 6ffe3397-00f0-47b8-8d01-4f958d2e6e34 |
| plate-row | 02014824-e842-4619-9552-40af383f6ed1 | 5ed88202-efd1-40f6-8107-4c7cc4953032 |
| db-row | 735cd611-fa63-4940-83cd-0800ade3f3b8 | 9c252676-f44a-4665-91fd-b512bccee459 |
| incline-db-row | de69e55a-ee88-4b81-bd37-b4f8c45d1e46 | 7e8083fd-125b-4724-9a38-3133cad9185f |
| bb-row | 0b58ae5f-2668-4273-9c74-88f199972eed | 482ae6a9-decc-4bf9-b9a6-7be67a71fe21 |
| trx-row | 97ae1835-c2a2-4889-88f9-8a3a4f3d14a7 | cd161710-fba5-4a1c-ab88-8802f2486d0a |
| db-shrug | cff626c0-ea62-470b-bff9-2f5bb11ad4d0 | ed06ad2f-97d7-4a3b-af01-5762e5a69192 |

### Batch 5: shrugs, biceps, triceps (single still)

| Exercise | Male | Female |
|---|---|---|
| smith-shrug | 26af409d-273e-415f-8f06-1d7ee19230e0 | 565e4c47-0a5d-4694-aa88-f89cd887e23f |
| db-curl | d023d067-015a-4b9c-9836-93f5f7ba2ca4 | cee0036e-7d95-4ef2-95f9-1615701d994b |
| hammer-curl | 700cba28-e404-467b-a1b7-72c2693d218b | 2c147160-0440-47e3-ad9a-e8f2dc1b1f59 |
| ez-curl | 1e953dc3-af77-4e9c-bf26-b19aa4bb54e1 | 61bdfa9b-895b-4c9f-ab4a-d6dd402af7dc |
| preacher-curl | de643838-af68-4ea8-b1b0-48b120c9f499 | c2e39cdd-0efe-412e-b489-00a0663ed65f |
| cable-curl | 7c238013-1d80-4b59-9c4c-23d442144d84 | ca5d7e39-8f15-42a7-8d7e-74a25f4826ac |
| incline-db-curl | fbd0140f-b53b-45f9-a85f-87f3e23c9621 | f8d8fa71-0565-438a-8268-0d5511aca39f |
| rope-pushdown | eb528c0c-e3f3-4eef-8fab-f2ef0149a9c8 | 82254794-8016-4e65-86be-7ef5959f19f3 |
| bar-pushdown | b09a1c7d-cd51-437d-986d-bb490401104a | a1072ae6-5a80-4b72-a5ec-6d57e3f11726 |
| overhead-cable-ext | 667d1037-0e17-4942-81c6-aa4cc3605303 | 8a304a78-77a1-4039-bde7-53adec7281e2 |

### Batch 6: triceps and squats

Single still, except the two bench moves, which use top and bottom keyframes.

| Exercise | Male | Female |
|---|---|---|
| db-overhead-ext | d9244f6f-65ba-4792-9bb7-70368951531a | 80341c06-58ee-49f6-854f-bacf013b283e |
| skull-crusher (top → bottom) | 8e27617b-62cf-46b0-9164-8f76769552e0 → 7dd68d21-9062-46dd-93ea-ac6280b8504d | 47cbd686-b508-433b-8c4a-76415afa8186 → 5223226a-520c-4def-90a4-0c498cffbd8c |
| close-grip-smith (top → bottom) | c6ba2ecc-6b26-43fa-8c43-036345bbfe54 → e537cf2f-d7a9-4019-aee6-a88f670d366c | bc2e0de2-c038-42a1-b26d-e73660bb9e59 → 3e58e4e8-c9cf-460d-b867-b279ed56c819 |
| assisted-dip | 400a1a01-b386-4ce1-901e-955b84c5e825 | 90c93aad-a7e0-4446-946a-b8ba63e4ee67 |
| triceps-machine | 29db81f6-78ce-4ee0-b815-a3d0817ac0ab | 2e8f1463-4e2b-46a9-96a6-d2b3d67073ac |
| bench-dip | db7e37b7-cfa9-4cdc-a552-03a9500f1d8b | 5a9fca08-a593-4dc2-8449-251c0e2e804f |
| bb-squat | 49df4a88-bcfa-42d0-b329-272d693944f0 | 053d99ee-004a-4e17-8bc6-6fa933534eea |
| smith-squat | ed52e8c8-cf12-4dc8-a996-1588b8e6c414 | 47af14cb-b340-4803-b43f-d2ecf28e6296 |
| goblet-squat | a045ae96-8bca-4325-9cc5-3a3fed0f6ae9 | d69deffa-9b1a-43ed-a146-8aded95b9cc1 |
| sumo-squat | 7a770418-41b9-4bbf-abfe-ca172792b32c | 944095d7-3ebd-49e6-889a-18f2ccd11aa4 |

### Batch 7: hinges and lunges (keyframes, top → bottom)

The "pair" columns are the original 21:9 side-by-side images. The keyframes were cut from them, aligned and uploaded.

| Exercise | Male top → bottom | Male pair | Female top → bottom | Female pair |
|---|---|---|---|---|
| rdl | ed829451-ba31-48d3-a87f-382885655839 → 03db6bb9-c5c7-4dee-b792-f141ee8f771c | d18dd729-38f9-4002-8a83-34165f9efee4 | 2425ec43-ebfb-49fc-8a4e-5d9ea08f9f0a → 683be95c-8cb2-4d61-b951-e9811e1773b0 | a188e112-3ab8-4432-b830-90dd7d793512 |
| db-rdl | 48eb97ff-bcf5-4cf5-a21b-8b734e7e4cf7 → 0cf9b18a-0bd2-483d-b869-af3bb1a6e072 | 220f45c0-6e6e-4b1e-9119-4eab2f7dac3d | f7a20f6f-b87f-4785-8567-05d27454107a → db6c97be-9c03-428d-975f-c68c0f80bf74 | cc5e7d9d-e9de-47a3-ab3c-8dfdab9d797b |
| smith-rdl | 7f717109-8607-4546-9e0f-9e3baa0983fc → bd853cf8-3d76-4e0f-8959-2aad92cd38e0 | e581dffe-1fab-4954-b092-7f65bfd60af4 | b3351ecf-4ed7-4f74-b78e-2410bbf0febe → 24f88fe1-2fe6-4256-837c-f6eed1e50b57 | f2cdcd31-2f8e-48f7-bd51-9f99938916c5 |
| deadlift | e071dcae-9a07-42fe-8b29-cef10bc550b1 → a06b78ae-ceee-4ce2-94e6-60c12cff9951 | f8f010b1-49b4-4de1-95a4-0ce9c1447116 | ac9ceca9-36cb-42e1-ab90-f1456a22ff31 → 6cd528d1-5fb1-4a9a-9285-668fa28fa70f | bf4ce11d-9ab5-49a2-97d3-1d93ebdefb7e |
| back-ext (redone face-down 2026-11-21) | 1f200a6b-0cdd-41d7-be85-f55eaa7e6c84 → e251ef6e-e1e9-458a-804d-cd998ae7fedb | 2a55f896-edb1-411d-9d81-9b5491bee574 | 2e30670f-509e-4b70-a2f0-eb2bdb510adc → b9cdb080-f405-4311-a283-0a27ce2dfc61 | dd278106-4efc-40f2-b452-9755f17a2c9f |
| cable-pull-through | 56326795-c271-4182-a05a-003fb5cbf4d9 → a8234607-57e9-4433-a851-cd574d38e81f | n/a (edited stills) | 139e9d9a-0143-4a47-a4fc-b41fade45137 → 7c2f4f2c-1a58-49f9-811a-f4ad3a25bf30 | d06b5f62-d2d5-4914-8711-f2a3f6b8ec78 |
| db-lunge | fbc556d5-1772-4a21-afdd-0293bbadb35b → 488cb303-9ec8-4d4c-b07a-2acd5b8e6689 | a1ae53cc-727d-48c5-9bbb-7bbffa9a1216 | 753e7ce2-7c3f-448d-823c-b86e1277a6c0 → 73a14c63-6664-4b16-8b31-e1e0fea59566 | bd6fdec9-0da1-41a4-823f-fc6cb32d9d00 |
| reverse-lunge | 71bf518f-ed0b-4580-8a3d-ed03988e9ef3 → 4e3c7af7-454b-4a33-bc12-ed1627965d18 | c1f4208b-c9b5-49d5-92d4-bb55d8a73971 | f1d14a06-5007-40db-89d7-6cfe1562987e → 1ec438e9-eb76-477c-beda-536ebc8a1be2 | 8df2f84c-df37-49f9-8901-5c06e92c4333 |
| split-squat | 15fb5b86-2e69-400d-a701-b8fabeb605fc → 35e4fbcb-9218-4b57-b39b-fd2519fa7c85 | n/a (edited stills) | e9654029-b949-4244-9c46-6354d1c2c1e6 → aa2c3dca-72f7-42f5-af09-fe3f73fab821 | n/a (edited one by one) |
| stepup | 7cafd201-1c2d-4bb9-b8e7-67b6ddb6aac2 → 1af5f7fb-8b85-4b89-8f22-5fc4a9798978 | 94bc6d46-fc2c-4a6d-ae9a-dcab4a0240e9 | 87d197db-423d-4108-9d68-477b251b2cb9 → ebc85190-6d34-4510-ab33-e10781df5f6b | 4cf5b8df-033d-4a1e-bb99-84b1e9019686 |

Batch 7 alignment shifts (`dx` for `align.py make`, male / female):

| Exercise | Male dx | Female dx | Anchor |
|---|---|---|---|
| rdl | -34 | -32 | feet |
| db-rdl | -56 | -50 | feet |
| smith-rdl | -2 | -2 | machine |
| deadlift | -24 (dy 4) | -22 (dy 4) | feet |
| db-lunge | -205 | -205 | back foot |
| reverse-lunge | +110 | +110 | front foot |
| stepup | -84 | -84 | bench |
| back-ext | -12 | -12 | bench (`box:0.15,0.95,0.6,0.97`) |

The first back-ext clips were wrong: the body lay face-up, like a backbend. A back extension is face-down: the hips rest on the pad, the chest faces the floor and you see the back of the head. The male video came out reversed (bottom → top), so it was flipped with `-vf reverse` before `bounce.sh`; check each video's direction.

**Good references for new exercises:**
- **Standing with dumbbells, three-quarter view:** db-rdl male top `6e6a66c8-97bb-41b3-ae30-9e76e06b5fc9`, db-lunge male top `f0dea8c5-cf15-4552-b90d-6b37d3cefc0f`.
- **Standing barbell:** `1329aae5-b9e3-4de7-89a5-886d52763b79`.
- **Smith machine, three-quarter view:** `b780de92-6791-4cf2-9cdb-0829f9d42ddd`.
- **Flat bench and body proportions for bench work:** `c00982b4-39b0-4fbf-a49b-5d0ffa448690`.
- **Cable tower, side view:** `56326795-c271-4182-a05a-003fb5cbf4d9`.
- **Leg press:** `cc1a619b-2084-4fce-9fb2-e76b95e13c28` (useful for leg-press-calf).

## Files

- `tools/clips/`: helper scripts.
  - `stills.sh` plus `sheet.py`: contact sheet of stills.
  - `grab.sh`: frame strips from videos.
  - `split.sh`, `align.py`, `pairs.sh`: keyframe pairs.
  - `put.sh`: uploads.
  - `bounce.sh`: loop plus overlay check.
  - `enc.sh`: encode into `docs/media/anim`.
  - `b*ids.txt`: raw job logs per batch, including rejected tries. Use the tables above for the approved ones.
- Work in the session scratchpad, not the repo; `enc.sh` writes its temp files to `tools/clips/enc/`.
- Gotchas:
  - On Windows, ffprobe and Python output has CRLF line endings, so pipe it through `tr -d '\r'`.
  - The project path has spaces, so quote it.
