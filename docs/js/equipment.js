// Gym Setup for Fressi Jätkäsaari.
// seen: spotted in the gym photos. Others are typical for this gym type – confirm at the gym.
// on: enabled by default for plan building.

export const EQUIP_CATS = [
  'Free weights', 'Benches & racks', 'Cable machines', 'Selectorized machines (Matrix)',
  'Plate-loaded machines (Gym80)', 'Bodyweight stations', 'Cardio',
];

const Q = (id, name, cat, seen, on = seen) => ({ id, name, cat, seen, on });

export const EQUIPMENT = [
  Q('dumbbells', 'Dumbbells (rack)', 'Free weights', true),
  Q('barbell', 'Olympic barbell + plates', 'Free weights', true),
  Q('ezbar', 'EZ bar / fixed barbells', 'Free weights', true),
  Q('kettlebells', 'Kettlebells', 'Free weights', false, false),

  Q('bench-flat', 'Flat bench', 'Benches & racks', true),
  Q('bench-adj', 'Adjustable bench', 'Benches & racks', true),
  Q('rack', 'Power rack / squat rack', 'Benches & racks', true),
  Q('smith', 'Smith machine (Matrix)', 'Benches & racks', true),
  Q('preacher', 'Preacher curl bench (Gym80)', 'Benches & racks', true),

  Q('cable-single', 'Cable column (adjustable pulley)', 'Cable machines', true),
  Q('cable-crossover', 'Cable crossover / dual pulley', 'Cable machines', true),
  Q('lat-pulldown', 'Lat pulldown', 'Cable machines', false, true),
  Q('cable-row', 'Seated cable row (low pulley)', 'Cable machines', false, true),

  Q('chest-press-machine', 'Chest press machine', 'Selectorized machines (Matrix)', true),
  Q('shoulder-press-machine', 'Shoulder press machine', 'Selectorized machines (Matrix)', true),
  Q('pec-deck', 'Pec deck / rear delt fly', 'Selectorized machines (Matrix)', false, true),
  Q('row-machine', 'Seated row machine (chest supported)', 'Selectorized machines (Matrix)', false, true),
  Q('leg-extension', 'Leg extension', 'Selectorized machines (Matrix)', true),
  Q('leg-curl', 'Leg curl (seated or lying)', 'Selectorized machines (Matrix)', false, true),
  Q('abductor', 'Hip abduction (outer thigh)', 'Selectorized machines (Matrix)', true),
  Q('adductor', 'Hip adduction (inner thigh)', 'Selectorized machines (Matrix)', true),
  Q('triceps-machine', 'Triceps extension machine', 'Selectorized machines (Matrix)', false, false),
  Q('rotary-torso', 'Rotary torso (seated twist)', 'Selectorized machines (Matrix)', true),
  Q('ab-machine', 'Ab crunch machine', 'Selectorized machines (Matrix)', false, false),
  Q('calf-machine', 'Seated calf raise', 'Selectorized machines (Matrix)', false, false),

  Q('plate-chest-press', 'Plate-loaded chest press', 'Plate-loaded machines (Gym80)', true),
  Q('plate-incline-press', 'Plate-loaded incline press', 'Plate-loaded machines (Gym80)', true),
  Q('plate-row', 'Plate-loaded row', 'Plate-loaded machines (Gym80)', false, true),
  Q('leg-press', 'Leg press', 'Plate-loaded machines (Gym80)', false, true),
  Q('hack-squat', 'Hack squat', 'Plate-loaded machines (Gym80)', false, false),
  Q('hip-thrust-machine', 'Hip thrust machine', 'Plate-loaded machines (Gym80)', false, false),

  Q('pullup-bar', 'Pull-up bar', 'Bodyweight stations', true),
  Q('dip-station', 'Assisted chin / dip machine (Matrix)', 'Bodyweight stations', true),
  Q('captains-chair', 'Knee-raise station (captain\'s chair)', 'Bodyweight stations', false, true),
  Q('back-extension', '45° back extension bench', 'Bodyweight stations', false, true),
  Q('trx', 'TRX suspension straps', 'Bodyweight stations', true),

  Q('treadmill', 'Treadmills', 'Cardio', true),
  Q('elliptical', 'Elliptical cross-trainers', 'Cardio', true),
  Q('stair-climber', 'Stair climber', 'Cardio', true),
  Q('bike', 'Exercise bike (recumbent)', 'Cardio', true),
  Q('bike-upright', 'Exercise bike (upright)', 'Cardio', true),
  Q('rower', 'Rowing machine', 'Cardio', true),
];
