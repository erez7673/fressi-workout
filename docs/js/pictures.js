// Equipment pictures from the gym80 product catalogue (https://gym80.de/en/product/) and the Matrix Fitness
// catalogue (https://world.matrixfitness.com/eng/strength/catalog and /eng/cardio/catalog): Matrix for the
// machines identified in the gym photos, and for gym80 machines whose only pictures are gold.
// Images are loaded from the makers' sites (not copied into this app) and cached by the service worker for offline use.

const U = 'https://gym80.de/wp-content/uploads/';
const P = (no, name, path) => ({ no, name, brand: 'gym80', url: U + path });
const M = (name, hash) => ({ no: '', name, brand: 'Matrix', url: `https://assets.jhtbrand.co/files/product/${hash}/` });

// gym80 product for each Gym Setup item.
export const EQUIP_PIC = {
  dumbbells: P('9494', 'RPU Dumbbell', '2025/07/9494_rpu_dumbbell_20kg_NC.webp'),
  barbell: P('2186', 'Olympic Barbell 220 cm', '2025/07/2186_premium_olympic_bar_220cm_NC.webp'),
  ezbar: P('2192', 'EZ Curl Bar 120 cm', '2025/07/2192_trining_curl_bar_120cm_9Kg_NC.webp'),
  kettlebells: P('9206', 'Kettlebell', '2025/07/9206_virgin_rubber_kettlebell_16kg_NC.webp'),
  'bench-flat': P('4005', 'Flat Bench', '2025/07/4005_basic_flat_bench_NC.webp'),
  'bench-adj': P('4103', 'Adjustable Bench', '2025/07/4103_basic_press_bench_adjustable_NC.webp'),
  rack: P('80A00005', 'Power Rack', '2026/03/gym80_80a00005_power_rack_NC_overview.webp'),
  preacher: P('4093', 'Seated Preacher Curl Bench', '2025/07/4093_basic_scott_curl_sitzend_NC.webp'),
  'calf-machine': P('4026', 'Seated Calf Raise', '2026/03/gym80_4026_pure_kraft_seated_calf_raise_NC_overview.webp'),
  'plate-chest-press': P('4326', 'Pure Kraft Chest Press Dual', '2025/07/4326_pure_kraf_brustmaschine_dual_NC.webp'),
  'plate-incline-press': P('4329N', 'Pure Kraft Incline Press Dual', '2025/07/4329n_pure_kraft_schraegbank_dual_NC.webp'),
  'plate-row': P('4322', 'Pure Kraft Seated Row Dual', '2026/03/gym80_4322_pure_kraft_seated_row_dual_NC_overview.webp'),
  'leg-press': P('4023', 'Pure Kraft 45° Leg Press', '2026/03/gym80_4023_pure_kraft_45_degrees_linear_leg_press_NC_overview.webp'),
  'hack-squat': P('4159N', 'Pure Kraft Hack Squat', '2026/03/gym80_4159n_pure_kraft_hack_squat_NC_overview.webp'),
  'hip-thrust-machine': P('4352', 'Pure Kraft Booty Booster', '2025/07/4352_pure_kraft_booty_booster_NC.webp'),
  'pullup-bar': P('4031', 'Knee Raise + Pull-Up Bar', '2025/07/4031_basic_beinhebegeraet_mit_klimmyugstange_NC.webp'),
  'captains-chair': P('4046', 'Knee Raise Station', '2026/03/gym80_4046_basic_abdominal_flexor_NC_overview.webp'),
  'back-extension': P('4119', '45° Back Extension', '2025/07/4119_basic_45-grad_rueckenstrecker_NC.webp'),
  trx: P('9253', 'Sling Trainer', '2025/07/9253_Slingtrainer_NC.webp'),
  none: P('9690', 'Exercise Mat', '2025/07/9690_matte_NC.webp'),

  // Matrix stand-ins for gym80 weight-stack and cable machines, which gym80 only pictures in gold.
  'cable-single': M('Adjustable Pulley', '17182a1a18eaaf9ad84baeeda5ba6cae1217a7d9'),
  'cable-crossover': M('Adjustable Cable Crossover', 'be1abc168ad264a97876671057b88fb0d588fcdd'),
  'lat-pulldown': M('Lat Pulldown', '72584368af40286ff583f9ea5471017314d2757a'),
  'cable-row': M('Low Row', '3df8ce979c81c3796dc940c7838a5be8fae95c84'),
  'chest-press-machine': M('Versa Converging Chest Press', '9c3d2c39f368bc9d009fc78b6834596cec5f5c45'),
  'pec-deck': M('Versa Pec Fly / Rear Delt', '7227904bc0af457a3a52e59f029fdd22415cfdc3'),
  'row-machine': M('Versa Diverging Seated Row', 'd5a89e258dd4eb72f2a9c71a14a20da698411572'),
  'leg-extension': M('Versa Leg Extension', 'a7d104d4af2333930e37cac45cf8a86815c36020'),
  'leg-curl': M('Versa Seated Leg Curl', '46baecb63609de53c3203c3c5dd15aa86979dda8'),
  'triceps-machine': M('Versa Triceps Press', '2ccecf93692f804441117c308535b535d3059eb0'),
  'ab-machine': M('Versa Abdominal', 'fa63a08094daa680026bd741a2f4958797da27f4'),

  // Matrix strength machines seen in the gym.
  'shoulder-press-machine': M('Versa Converging Shoulder Press', 'ebd16aba92ab340c8965158d5ea752deec16374a'),
  abductor: M('Versa Hip Abductor / Adductor', '91803f0677a006f01c2a6ca3f0f24feae60d5b89'),
  adductor: M('Versa Hip Abductor / Adductor', '91803f0677a006f01c2a6ca3f0f24feae60d5b89'),
  'rotary-torso': M('Ultra Rotary Torso', '7abba6f04271b11d85d6a12a0428cb05bf53bd80'),
  'dip-station': M('Aura Dip / Chin Assist', '0c2ef8e6ca07d0da8cee90ca3557e293c19996e3'),
  smith: M('Magnum Smith Machine', 'd541eb5a3aeb4364e60163091a65adc5ce0dcfd3'),

  // Matrix cardio seen in the gym.
  treadmill: M('Performance Treadmill', '94e0531169335e9cd5930e9cf3c57f1429735993'),
  elliptical: M('Performance Elliptical', 'e52f7b7452c071429be273eacc8467c39cd05957'),
  'stair-climber': M('Performance ClimbMill', '49d898933f41bfaf4ce8920093fe0d0021d018c8'),
  bike: M('Lifestyle Recumbent Cycle', 'ebd223675b23e1775acc93846a493e52b66a892c'),
  'bike-upright': M('Lifestyle Upright Cycle', 'c1d36a3478e85cd2289e5a16430b69a89da9b5d1'),
  rower: M('Rower', '57651c9b1b4a1637fd114f74275ef1aec33067a6'),
};

// Exercises where a different product shows the movement better than the first piece of equipment.
const EX_PIC = {
  'bb-bench': P('4097', 'Bench Press Bench', '2025/07/4097_basic_press_bench_NC.webp'),
  'reverse-pec-deck': EQUIP_PIC['pec-deck'],
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
