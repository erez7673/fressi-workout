// Equipment pictures from the gym80 product catalogue (https://gym80.de/en/product/).
// Images are loaded from gym80.de (not copied into this app) and cached by the service worker for offline use.
// Matrix makes the cardio machines, so those have no gym80 picture and show a plain icon instead.

const U = 'https://gym80.de/wp-content/uploads/';
const P = (no, name, path) => ({ no, name, url: U + path });

// gym80 product for each Gym Setup item.
export const EQUIP_PIC = {
  dumbbells: P('9494', 'RPU Dumbbell', '2025/07/9494_rpu_dumbbell_20kg_NC.webp'),
  barbell: P('2186', 'Olympic Barbell 220 cm', '2025/07/2186_premium_olympic_bar_220cm_NC.webp'),
  ezbar: P('2192', 'EZ Curl Bar 120 cm', '2025/07/2192_trining_curl_bar_120cm_9Kg_NC.webp'),
  kettlebells: P('9206', 'Kettlebell', '2025/07/9206_virgin_rubber_kettlebell_16kg_NC.webp'),
  'bench-flat': P('4005', 'Flat Bench', '2025/07/4005_basic_flat_bench_NC.webp'),
  'bench-adj': P('4103', 'Adjustable Bench', '2025/07/4103_basic_press_bench_adjustable_NC.webp'),
  rack: P('80A00005', 'Power Rack', '2026/03/gym80_80a00005_power_rack_NC_overview.webp'),
  smith: P('5201', 'Multi-Power (Smith) Station', '2026/03/gym80_5201_multi_power_station_NC_overview.webp'),
  preacher: P('4093', 'Seated Preacher Curl Bench', '2025/07/4093_basic_scott_curl_sitzend_NC.webp'),
  'cable-single': P('4134', 'Universal Cable Pulley', '2025/07/4134_universal_seilzug_NC.webp'),
  'cable-crossover': P('4004', 'Cable Crossover', '2025/07/4004_kabelzug_crossover_NC.webp'),
  'lat-pulldown': P('4116', 'Lat Pulldown Station', '2025/07/4116_rueckenzugstation_NC.webp'),
  'cable-row': P('4016', 'Seated Cable Row Station', '2025/07/4016_ruderstation_NC.webp'),
  'chest-press-machine': P('3016', 'Chest Press', '2025/07/3016_brustpresse_NC.webp'),
  'shoulder-press-machine': P('3032', 'Shoulder Press', '2025/07/3032_schulterpresse_NC.webp'),
  'pec-deck': P('3022', 'Butterfly (Pec Deck)', '2025/07/3022_butterfly_NC.webp'),
  'row-machine': P('3040', 'Rowing Machine', '2025/07/3040_rudermaschine_NC.webp'),
  'leg-extension': P('3001', 'Leg Extension', '2026/03/3001_beinbeuger_NC-1.webp'),
  'leg-curl': P('3003', 'Seated Leg Curl', '2026/03/3003_beinbeuger_sitzend_NC.webp'),
  abductor: P('3028', 'Abductor Machine', '2025/07/3028_abduktionsmaschine_NC.webp'),
  adductor: P('3029', 'Adductor Machine', '2025/07/3029_addunktionsmaschine_NC.webp'),
  'triceps-machine': P('3011', 'Triceps Machine', '2025/07/3011_trizepsmaschine_NC.webp'),
  'ab-machine': P('3037', 'Abdominal Machine', '2026/03/gym80_3037_abdominal_machine_NC_overview.webp'),
  'calf-machine': P('4026', 'Seated Calf Raise', '2026/03/gym80_4026_pure_kraft_seated_calf_raise_NC_overview.webp'),
  'plate-chest-press': P('4326', 'Pure Kraft Chest Press Dual', '2025/07/4326_pure_kraf_brustmaschine_dual_NC.webp'),
  'plate-incline-press': P('4329N', 'Pure Kraft Incline Press Dual', '2025/07/4329n_pure_kraft_schraegbank_dual_NC.webp'),
  'plate-row': P('4322', 'Pure Kraft Seated Row Dual', '2026/03/gym80_4322_pure_kraft_seated_row_dual_NC_overview.webp'),
  'leg-press': P('4023', 'Pure Kraft 45° Leg Press', '2026/03/gym80_4023_pure_kraft_45_degrees_linear_leg_press_NC_overview.webp'),
  'hack-squat': P('4159N', 'Pure Kraft Hack Squat', '2026/03/gym80_4159n_pure_kraft_hack_squat_NC_overview.webp'),
  'hip-thrust-machine': P('4352', 'Pure Kraft Booty Booster', '2025/07/4352_pure_kraft_booty_booster_NC.webp'),
  'pullup-bar': P('4031', 'Knee Raise + Pull-Up Bar', '2025/07/4031_basic_beinhebegeraet_mit_klimmyugstange_NC.webp'),
  'dip-station': P('3017', 'Assisted Chin / Dip Machine', '2026/03/gym80_3017_kneeling-chinning-dipping_machine_NC_overview.webp'),
  'captains-chair': P('4046', 'Knee Raise Station', '2026/03/gym80_4046_basic_abdominal_flexor_NC_overview.webp'),
  'back-extension': P('4119', '45° Back Extension', '2025/07/4119_basic_45-grad_rueckenstrecker_NC.webp'),
  trx: P('9253', 'Sling Trainer', '2025/07/9253_Slingtrainer_NC.webp'),
  none: P('9690', 'Exercise Mat', '2025/07/9690_matte_NC.webp'),
};

// Exercises where a different product shows the movement better than the first piece of equipment.
const EX_PIC = {
  'bb-bench': P('4097', 'Bench Press Bench', '2025/07/4097_basic_press_bench_NC.webp'),
  'reverse-pec-deck': P('3025', 'Butterfly Reverse', '2025/07/3025_butterfly_reverse_NC.webp'),
  'preacher-curl': EQUIP_PIC.preacher,
  'bench-dip': EQUIP_PIC['bench-flat'],
  'stepup': EQUIP_PIC['bench-flat'],
  'back-ext': EQUIP_PIC['back-extension'],
  'knee-raise': EQUIP_PIC['captains-chair'],
};

// Picture for an exercise: its override, else the first piece of equipment it uses.
export function picFor(ex) {
  if (!ex) return null;
  if (EX_PIC[ex.id]) return EX_PIC[ex.id];
  const first = String(ex.eq || 'none').split('|')[0].split('+')[0];
  return EQUIP_PIC[first] || null;
}
