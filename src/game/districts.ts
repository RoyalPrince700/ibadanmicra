export const BRAND = {
  rust: '#c4512c',
  rustDeep: '#8c3b22',
  gold: '#f5c400',
  cream: '#f4e6c8',
  green: '#1b4d3e',
  greenDeep: '#14352c',
  ink: '#1a120b',
} as const

export type SpriteKind =
  | 'palm'
  | 'umbrella'
  | 'roof'
  | 'tree'
  | 'passenger'
  | 'hawker'
  | 'stall'
  | 'kiosk'
  | 'drop'
  | 'cocoa'
  | 'mapo'
  | 'tower'
  | 'premier'
  | 'terminal'
  | 'sign'
  | 'bay'
  | 'gantry'
  | 'streetlight'
  | 'billboard'
  | 'pylon'
  | 'coin'
  | 'boost'

/** Things that share the lanes with you. They come from the traffic timeline, not the scenery. */
export type TrafficKind = 'keke' | 'okada' | 'danfo' | 'car' | 'truck' | 'pothole'

export interface Stretch {
  enter: number
  hold: number
  leave: number
  curve: number
  hill: number
}

export interface Rider {
  name: string
  line: string
}

export interface District {
  id: string
  name: string
  street: string
  address: string
  subtitle: string
  sign: string
  radio: string[]
  skyTop: string
  skyBottom: string
  grass: string
  grassAlt: string
  road: string
  roadAlt: string
  lane: string
  edge: string
  rumbleWidth: number
  shoulder: number
  haze: number
  roadside: 'palm' | 'umbrella' | 'roof' | 'tree'
  traffic: number
  trafficMix: 'keke' | 'danfo' | 'mixed'
  potholes: number
  hawkers: number
  kiosks: boolean
  billboards: string[]
  /** Median boards step aside and a train runs the walkway. */
  rail?: boolean
  /**
   * Traffic script, one beat per letter, read left to right and repeated to
   * fill the street. Busier streets play the beats closer together.
   *   O  one vehicle coming at you in the left lane
   *   C  two oncoming, back to back
   *   S  slow vehicle ahead in your lane: overtake on the left or brake
   *   Q  slow vehicle in your lane with an oncoming one beside it: wait, then pass
   *   P  bus or keke stopped in your lane to load
   *   H  pothole in your lane
   *   L  pothole in the oncoming lane
   *   .  breather
   */
  timeline: string
  passengers: Rider[]
  landmark?: 'cocoa' | 'mapo' | 'tower' | 'premier' | 'terminal'
  stretches: Stretch[]
}

/**
 * One Micra run, morning at Toll Gate through Oke Are, then the city again.
 * Order follows a cross-town drop a driver could actually run:
 * Toll Gate into Ring Road and Challenge, then Beere and Oje.
 * East through Iwo Road, Alakia, Akanran, and Lalupon. North by Bodija,
 * Ojoo, and Moniya. Back over Mokola into Jericho and Apete, Dugbe,
 * then Mapo and the last climb at Oke Are.
 * Every Ibadan local government is on the run.
 * The drive is a straight two-lane road. Hill is the climb
 * across the whole stretch (negative means downhill).
 */
export const DISTRICTS: District[] = [
  {
    id: 'tollgate',
    name: 'Toll Gate',
    street: 'Lagos–Ibadan Expressway',
    address: 'Toll Gate, Ibadan',
    subtitle: 'Lagos don finish. Ibadan dey start.',
    sign: 'TOLL GATE',
    radio: [
      'Lagos–Ibadan Expressway. Toll Gate don open.',
      'New Garage dey near. You be drop, no be night bus.',
      'Rust roofs dey wait for the hills. Carry your speed.',
      'Lagos–Ibadan train dey take the middle. Boards don step aside.',
    ],
    skyTop: '#7eb6e8',
    skyBottom: '#f3d7a4',
    grass: '#8a9a4e',
    grassAlt: '#73843f',
    road: '#4e535b',
    roadAlt: '#454a52',
    lane: '#f5c400',
    edge: '#e2b43a',
    rumbleWidth: 1.28,
    shoulder: 1.9,
    haze: 0.08,
    roadside: 'palm',
    traffic: 0.06,
    trafficMix: 'mixed',
    potholes: 0.015,
    hawkers: 0,
    kiosks: false,
    billboards: ['WELCOME TO IBADAN', 'PACESETTER STATE', 'DRIVE SAFE, OYO'],
    rail: true,
    timeline: 'O . . S . . H . . O . S .',
    passengers: [{ name: 'Bola', line: 'I just land from Lagos.' }],
    stretches: [
      { enter: 20, hold: 80, leave: 16, curve: 0.6, hill: 420 },
      { enter: 14, hold: 40, leave: 14, curve: -0.8, hill: -120 },
    ],
  },
  {
    id: 'ringroad',
    name: 'Ring Road',
    street: 'Ring Road',
    address: 'Ibadan South-West',
    subtitle: 'Banks, glass, and a wide road.',
    sign: 'RING ROAD',
    radio: [
      'Ring Road. Headquarters of Ibadan South-West. The road wide.',
      'Offices and banks. No be Beere. Hold your lane and glide.',
      'If the Micra clean, this street go forgive you.',
    ],
    skyTop: '#7eb4dc',
    skyBottom: '#f7e2b4',
    grass: '#6e8a48',
    grassAlt: '#5d763c',
    road: '#3e444c',
    roadAlt: '#353b42',
    lane: '#f5c400',
    edge: '#e2b43a',
    rumbleWidth: 1.2,
    shoulder: 1.72,
    haze: 0.04,
    roadside: 'tree',
    traffic: 0.12,
    trafficMix: 'mixed',
    potholes: 0.012,
    hawkers: 0.05,
    kiosks: false,
    billboards: ['BANKS THIS WAY', 'SHOPPING COMPLEX', 'SOUTH-WEST HQ'],
    timeline: 'O . . S . . O . . . S .',
    passengers: [{ name: 'Tosin', line: 'Drop me for the bank. I get meeting.' }],
    stretches: [
      { enter: 16, hold: 64, leave: 14, curve: 0.4, hill: 80 },
      { enter: 14, hold: 48, leave: 14, curve: -0.5, hill: 40 },
    ],
  },
  {
    id: 'challenge',
    name: 'Challenge',
    street: 'Challenge Expressway',
    address: 'Oluyole, Ibadan 200114',
    subtitle: 'Danfo, terminal, and a wide road.',
    sign: 'CHALLENGE',
    radio: [
      'Challenge Expressway, Oluyole. The terminal dey your side.',
      'Iyalode statue once stand for this roundabout. Hold your lane.',
      'Danfo dey load. You dey do drop. No compete with bus.',
    ],
    skyTop: '#6eaee0',
    skyBottom: '#f6d7a8',
    grass: '#9a8a48',
    grassAlt: '#84763c',
    road: '#5a534c',
    roadAlt: '#4e4842',
    lane: '#f5c400',
    edge: '#e2b43a',
    rumbleWidth: 1.22,
    shoulder: 1.7,
    haze: 0.06,
    roadside: 'umbrella',
    traffic: 0.22,
    trafficMix: 'danfo',
    potholes: 0.03,
    hawkers: 0.35,
    kiosks: true,
    billboards: ['RING ROAD THIS WAY', 'AMALA 24/7', 'CHALLENGE PARK'],
    timeline: 'S . O . P . . C . S . Q . H . O .',
    passengers: [
      { name: 'Seyi', line: 'I dey come from Orita Challenge.' },
      { name: 'Iya Wura', line: 'My load never balance. Drive soft.' },
    ],
    landmark: 'terminal',
    stretches: [
      { enter: 16, hold: 56, leave: 14, curve: 1.5, hill: 180 },
      { enter: 14, hold: 48, leave: 14, curve: -1.2, hill: 40 },
    ],
  },
  {
    id: 'beere',
    name: 'Beere',
    street: 'Beere Road',
    address: 'Old Ibadan',
    subtitle: 'Compounds, rust, and a narrow road.',
    sign: 'BEERE',
    radio: [
      'Beere Road. Family compound dey lean on family compound.',
      'Olubadan palace no far. This road no build for hurry.',
      'Pothole go greet you. Take am small small.',
    ],
    skyTop: '#c46a3a',
    skyBottom: '#e8b07a',
    grass: '#a85a32',
    grassAlt: '#8c4c2a',
    road: '#5a463c',
    roadAlt: '#4a3c34',
    lane: '#efe3c4',
    edge: '#efe3c4',
    rumbleWidth: 1.04,
    shoulder: 1.08,
    haze: 0.18,
    roadside: 'roof',
    traffic: 0.2,
    trafficMix: 'keke',
    potholes: 0.08,
    hawkers: 0.9,
    kiosks: true,
    billboards: ['OLD COMPOUNDS', 'PALACE SIDE', 'SLOW DOWN'],
    timeline: 'S . H . Q . H . O . P . L .',
    passengers: [
      { name: 'Baba Wasiu', line: 'I dey go the compound. No rush Beere.' },
      { name: 'Morayo', line: 'The gutter close. Steer soft.' },
    ],
    stretches: [
      { enter: 12, hold: 40, leave: 10, curve: 2.2, hill: 480 },
      { enter: 10, hold: 36, leave: 12, curve: -1.8, hill: 220 },
    ],
  },
  {
    id: 'oje',
    name: 'Oje',
    street: 'Oje Road',
    address: 'Ibadan North-East',
    subtitle: 'Aso-oke, herbs, and the market.',
    sign: 'OJE',
    radio: [
      'Oje Market. Aso-oke and herbs dey line the gutter.',
      'People dey sell beside the road. No argue with a basin.',
      'Tuesday here na festival. Every other day still loud.',
    ],
    skyTop: '#d4884a',
    skyBottom: '#f0c48a',
    grass: '#b08648',
    grassAlt: '#96723c',
    road: '#5c5148',
    roadAlt: '#50463e',
    lane: '#efe3c4',
    edge: '#efe3c4',
    rumbleWidth: 1.05,
    shoulder: 1.14,
    haze: 0.16,
    roadside: 'umbrella',
    traffic: 0.26,
    trafficMix: 'keke',
    potholes: 0.06,
    hawkers: 1.4,
    kiosks: true,
    billboards: ['ASO-OKE', 'HERBS · BLACK SOAP', 'OJE MARKET'],
    timeline: 'S . P . H . Q . O . S . C . H',
    passengers: [
      { name: 'Iya Sade', line: 'My aso-oke dey the stall. Stop near the umbrella.' },
      { name: 'Kunle', line: 'Herbs for my mama. The crowd no dey finish.' },
    ],
    stretches: [
      { enter: 12, hold: 52, leave: 12, curve: 1.6, hill: 60 },
      { enter: 12, hold: 40, leave: 12, curve: -1.4, hill: 40 },
    ],
  },
  {
    id: 'iwo',
    name: 'Iwo Road',
    street: 'Iwo Road Interchange',
    address: 'Ibadan North-East',
    subtitle: 'Heartbeat of the city.',
    sign: 'IWO ROAD',
    radio: [
      'Iwo Road Interchange. Terminal 1 and 2, keke still own the junction.',
      'Ife, Osogbo, and the east. This na the gateway.',
      'If a keke enter from anywhere, honk. No dey argue.',
      'Train dey take the middle here. Let am pass.',
    ],
    skyTop: '#6aa6d8',
    skyBottom: '#f0c48a',
    grass: '#b08648',
    grassAlt: '#96723c',
    road: '#5a534c',
    roadAlt: '#4e4842',
    lane: '#f5c400',
    edge: '#e2b43a',
    rumbleWidth: 1.14,
    shoulder: 1.38,
    haze: 0.14,
    roadside: 'umbrella',
    traffic: 0.28,
    trafficMix: 'keke',
    potholes: 0.05,
    hawkers: 0.55,
    kiosks: true,
    billboards: ['IFE · OSOGBO · ILESA', 'SPARE PARTS GATE', 'IWO ROAD PARK'],
    rail: true,
    timeline: 'S . O . Q . H . S . C . P . O . L .',
    passengers: [
      { name: 'Kunle', line: 'Keke don tire me for this park.' },
      { name: 'Mama Sade', line: 'I miss the Osogbo bus.' },
    ],
    landmark: 'terminal',
    stretches: [
      { enter: 14, hold: 48, leave: 12, curve: 2.4, hill: 200 },
      { enter: 12, hold: 44, leave: 12, curve: -2.6, hill: 80 },
      { enter: 12, hold: 28, leave: 12, curve: 1.3, hill: 0 },
    ],
  },
  {
    id: 'alakia',
    name: 'Alakia',
    street: 'Ibadan–Ife Expressway',
    address: 'Egbeda',
    subtitle: 'Trailers, warehouses, no patience.',
    sign: 'ALAKIA',
    radio: [
      'Alakia, Egbeda. Trailer park dey own this expressway.',
      'Warehouse and diesel. No race a trailer.',
      'The east road rough where the trucks sleep.',
    ],
    skyTop: '#8aa4b8',
    skyBottom: '#e7d2a8',
    grass: '#8a8450',
    grassAlt: '#746e44',
    road: '#4a4e54',
    roadAlt: '#3f4348',
    lane: '#f5c400',
    edge: '#e2b43a',
    rumbleWidth: 1.18,
    shoulder: 1.55,
    haze: 0.2,
    roadside: 'palm',
    traffic: 0.18,
    trafficMix: 'danfo',
    potholes: 0.045,
    hawkers: 0.2,
    kiosks: false,
    billboards: ['TRAILER PARK', 'WAREHOUSE', 'EGBEDA'],
    timeline: 'O . S . . C . H . O . S .',
    passengers: [{ name: 'Sikiru', line: 'I dey load for the park. Watch the trailer.' }],
    stretches: [
      { enter: 16, hold: 58, leave: 14, curve: 0.7, hill: 40 },
      { enter: 14, hold: 46, leave: 14, curve: -0.9, hill: -80 },
    ],
  },
  {
    id: 'akanran',
    name: 'Akanran',
    street: 'Akanran Road',
    address: 'Ona Ara',
    subtitle: 'Fringe market. The road remembers rain.',
    sign: 'AKANRAN',
    radio: [
      'Akanran, Ona Ara. Market town where Ibadan thin out.',
      'Sellers go stand in the red dust beside the lane.',
      'After rain this road go turn story.',
    ],
    skyTop: '#c47a48',
    skyBottom: '#efd0a0',
    grass: '#a86a3c',
    grassAlt: '#8c5832',
    road: '#6a5648',
    roadAlt: '#5c4c40',
    lane: '#efe3c4',
    edge: '#efe3c4',
    rumbleWidth: 1.08,
    shoulder: 1.2,
    haze: 0.22,
    roadside: 'umbrella',
    traffic: 0.16,
    trafficMix: 'keke',
    potholes: 0.075,
    hawkers: 1.05,
    kiosks: true,
    billboards: ['ONA ARA', 'MARKET DAY', 'ROUGH ROAD'],
    timeline: 'H . S . Q . H . O . P . L',
    passengers: [
      { name: 'Iya Ronke', line: 'Market don start. My tray dey the shoulder.' },
      { name: 'Dele', line: 'This road no like speed. I tell you.' },
    ],
    stretches: [
      { enter: 12, hold: 44, leave: 12, curve: 1.4, hill: 180 },
      { enter: 12, hold: 36, leave: 12, curve: -1.1, hill: -40 },
    ],
  },
  {
    id: 'lalupon',
    name: 'Lalupon',
    street: 'Ibadan–Iwo Road',
    address: 'Lagelu',
    subtitle: 'Farms, quiet, and a long sky.',
    sign: 'LALUPON',
    radio: [
      'Lalupon, Lagelu. The noise of Iwo Road don finish.',
      'Farm and compound. You fit hear your own Micra.',
      'Iyana Offa dey this side. Drive like person wey sabi.',
    ],
    skyTop: '#9ec0d8',
    skyBottom: '#f3e0b0',
    grass: '#7d9448',
    grassAlt: '#6a8040',
    road: '#5a6058',
    roadAlt: '#4e544c',
    lane: '#f5c400',
    edge: '#e2b43a',
    rumbleWidth: 1.12,
    shoulder: 1.5,
    haze: 0.1,
    roadside: 'tree',
    traffic: 0.08,
    trafficMix: 'mixed',
    potholes: 0.03,
    hawkers: 0.15,
    kiosks: false,
    billboards: ['LAGELU', 'FARM PRODUCE', 'IYANA OFFA'],
    timeline: 'O . . S . . . H . . O',
    passengers: [{ name: 'Bisi', line: 'I dey go farm. The road quiet, thank God.' }],
    stretches: [
      { enter: 14, hold: 50, leave: 14, curve: 0.8, hill: 120 },
      { enter: 12, hold: 40, leave: 14, curve: -0.6, hill: -30 },
    ],
  },
  {
    id: 'bodija',
    name: 'Bodija',
    street: 'Bodija Market',
    address: 'Bodija, Ibadan North',
    subtitle: 'Pepper, yam, basin.',
    sign: 'BODIJA',
    radio: [
      'Bodija Market. If the basin no fit boot, the fare still stand.',
      'Yam and pepper. Steer gentle, the load dey live.',
      'Hawkers go lean into the lane. Honk, then pass.',
    ],
    skyTop: '#89b7d4',
    skyBottom: '#f6e2b8',
    grass: '#6e8a45',
    grassAlt: '#5d763a',
    road: '#55564f',
    roadAlt: '#494a44',
    lane: '#efe3c4',
    edge: '#efe3c4',
    rumbleWidth: 1.06,
    shoulder: 1.26,
    haze: 0.06,
    roadside: 'umbrella',
    traffic: 0.15,
    trafficMix: 'keke',
    potholes: 0.045,
    hawkers: 1.15,
    kiosks: true,
    billboards: ['FRESH PEPPER', 'YAM · GARRI · BEANS', 'BODIJA MARKET'],
    timeline: 'S . . H . O . S . L . Q . H . O',
    passengers: [
      { name: 'Iya Bose', line: 'My customer dey wait with the pepper.' },
      { name: 'Kemi', line: 'Market don close. I wan reach house.' },
    ],
    stretches: [
      { enter: 14, hold: 44, leave: 12, curve: 1.15, hill: 520 },
      { enter: 12, hold: 30, leave: 12, curve: -1.35, hill: -180 },
    ],
  },
  {
    id: 'ojoo',
    name: 'Ojoo',
    street: 'Oyo Road',
    address: 'Ojoo Bus Terminal, Ibadan North',
    subtitle: 'Some people still write Ojo.',
    sign: 'OJOO',
    radio: [
      'Oyo Road, Ojoo. Bus dey go the north. You dey do short drop.',
      'UI dey behind you. Some conductor go still shout Ojo.',
      'Harmattan dust dey sit on the junction. Eyes open.',
    ],
    skyTop: '#c9d5df',
    skyBottom: '#ead7b4',
    grass: '#8d8456',
    grassAlt: '#7a7348',
    road: '#6a645c',
    roadAlt: '#5c574f',
    lane: '#f5c400',
    edge: '#e2b43a',
    rumbleWidth: 1.16,
    shoulder: 1.48,
    haze: 0.32,
    roadside: 'tree',
    traffic: 0.2,
    trafficMix: 'mixed',
    potholes: 0.03,
    hawkers: 0.3,
    kiosks: true,
    billboards: ['OYO · ILORIN', 'UI GATE THIS WAY', 'OJOO TERMINAL'],
    timeline: 'O . S . C . Q . H . P . O . S . L',
    passengers: [
      { name: 'Tunde', line: 'People go still spell this place Ojo.' },
      { name: 'Rasheed', line: 'I miss the Ilorin bus. Carry me back.' },
    ],
    landmark: 'terminal',
    stretches: [
      { enter: 14, hold: 50, leave: 12, curve: 2.1, hill: 160 },
      { enter: 12, hold: 40, leave: 14, curve: -1.7, hill: -60 },
    ],
  },
  {
    id: 'moniya',
    name: 'Moniya',
    street: 'Oyo Road',
    address: 'Akinyele',
    subtitle: 'Northern gate. Gari, cattle, and trailers.',
    sign: 'MONIYA',
    radio: [
      'Moniya. Akinyele headquarters. Oyo Road dey face the north.',
      'Farmers market and cattle. People dey sell gari beside the road.',
      'Trailer from Oyo. Give them room.',
    ],
    skyTop: '#c9c2a4',
    skyBottom: '#ead7b0',
    grass: '#9a8a48',
    grassAlt: '#84763c',
    road: '#6a6458',
    roadAlt: '#5c574c',
    lane: '#f5c400',
    edge: '#e2b43a',
    rumbleWidth: 1.14,
    shoulder: 1.42,
    haze: 0.26,
    roadside: 'umbrella',
    traffic: 0.2,
    trafficMix: 'danfo',
    potholes: 0.05,
    hawkers: 1.15,
    kiosks: true,
    billboards: ['AKINYELE HQ', 'GARI · CATTLE', 'OYO ROAD'],
    timeline: 'O . S . C . H . Q . P . O .',
    passengers: [
      { name: 'Aduke', line: 'My gari dey the shoulder. No pass am fast.' },
      { name: 'Musa', line: 'I miss the Oyo trailer. Carry me small.' },
    ],
    stretches: [
      { enter: 14, hold: 56, leave: 14, curve: 1.1, hill: 80 },
      { enter: 12, hold: 44, leave: 14, curve: -0.8, hill: 20 },
    ],
  },
  {
    id: 'mokola',
    name: 'Mokola',
    street: 'Mokola Hill',
    address: 'Premier Hotel, Ibadan 200285',
    subtitle: 'Do not roll back.',
    sign: 'MOKOLA',
    radio: [
      'Mokola Hill. Carry speed now or the Micra go roll back.',
      'Premier still dey sit on this hill. The grade no quiet.',
      'Eyes on the climb. The hotel fit wait.',
    ],
    skyTop: '#5d8eb8',
    skyBottom: '#e7c49a',
    grass: '#7d8470',
    grassAlt: '#6a7160',
    road: '#5c5854',
    roadAlt: '#504c48',
    lane: '#efe3c4',
    edge: '#efe3c4',
    rumbleWidth: 1.06,
    shoulder: 1.42,
    haze: 0.05,
    roadside: 'tree',
    traffic: 0.12,
    trafficMix: 'mixed',
    potholes: 0.03,
    hawkers: 0.1,
    kiosks: false,
    billboards: ['STEEP HILL AHEAD', 'LOW GEAR NOW', 'PREMIER HOTEL'],
    timeline: 'O . . S . . H . . O . . S .',
    passengers: [
      { name: 'Oga Segun', line: 'Make you no stall for this hill.' },
      { name: 'Bisi', line: 'I know this climb. Keep the speed.' },
    ],
    landmark: 'premier',
    stretches: [
      { enter: 12, hold: 22, leave: 8, curve: 0.55, hill: 220 },
      { enter: 10, hold: 30, leave: 12, curve: -1.15, hill: 3400 },
      { enter: 8, hold: 16, leave: 12, curve: 1.7, hill: -520 },
    ],
  },
  {
    id: 'jericho',
    name: 'Jericho',
    street: 'Jericho Road',
    address: 'Ibadan North-West',
    subtitle: 'GRA. Quiet offices and old trees.',
    sign: 'JERICHO',
    radio: [
      'Jericho GRA. Government and trees. Horn small.',
      'Onireke no far. This side dey breathe.',
      'If you rush here, the street go look at you.',
    ],
    skyTop: '#6ea8c8',
    skyBottom: '#f4e6c0',
    grass: '#5e8448',
    grassAlt: '#4e703c',
    road: '#3a4148',
    roadAlt: '#32383e',
    lane: '#f5c400',
    edge: '#e2b43a',
    rumbleWidth: 1.16,
    shoulder: 1.68,
    haze: 0.05,
    roadside: 'tree',
    traffic: 0.08,
    trafficMix: 'mixed',
    potholes: 0.01,
    hawkers: 0,
    kiosks: false,
    billboards: ['JERICHO GRA', 'QUIET ROAD', 'ONIREKE'],
    timeline: 'O . . . S . . . O . .',
    passengers: [{ name: 'Mrs Adeyemi', line: 'The office dey close. Drive like a person.' }],
    stretches: [
      { enter: 14, hold: 48, leave: 14, curve: 0.45, hill: 60 },
      { enter: 12, hold: 36, leave: 14, curve: -0.35, hill: -20 },
    ],
  },
  {
    id: 'apete',
    name: 'Apete',
    street: 'Apete Road',
    address: 'Ido',
    subtitle: 'Estate gate one side, village the other.',
    sign: 'APETE',
    radio: [
      'Apete, Ido. New estate dey meet old village.',
      'The road change mind. Smooth, then sudden rough.',
      'Okada go flash you. Eyes open.',
    ],
    skyTop: '#89b4c8',
    skyBottom: '#f2d7a8',
    grass: '#7a8a46',
    grassAlt: '#68783c',
    road: '#55584e',
    roadAlt: '#494c44',
    lane: '#efe3c4',
    edge: '#e2b43a',
    rumbleWidth: 1.1,
    shoulder: 1.34,
    haze: 0.08,
    roadside: 'tree',
    traffic: 0.16,
    trafficMix: 'mixed',
    potholes: 0.04,
    hawkers: 0.4,
    kiosks: true,
    billboards: ['ESTATE GATE', 'IDO', 'FILLING STATION'],
    timeline: 'O . S . H . O . . S . Q .',
    passengers: [
      { name: 'Femi', line: 'Estate gate. After the rough patch.' },
      { name: 'Iya Bimpe', line: 'Village side. I get load for the kiosk.' },
    ],
    stretches: [
      { enter: 14, hold: 42, leave: 12, curve: 1.2, hill: 140 },
      { enter: 12, hold: 36, leave: 12, curve: -1.4, hill: -60 },
    ],
  },
  {
    id: 'cocoa',
    name: 'Cocoa House',
    street: 'Oba Adebimpe Road',
    address: 'Dugbe, Ibadan 200284',
    subtitle: 'Ile Koko. Dugbe.',
    sign: 'COCOA HSE',
    radio: [
      'Oba Adebimpe Road. Cocoa House, first skyscraper for tropical Africa.',
      'Dugbe no send horn. Dugbe send steering.',
      'Ile Koko dey stand. Your own work na the fare.',
      'Dugbe line dey run the middle. Ibadan written on the body.',
    ],
    skyTop: '#4f86b4',
    skyBottom: '#efd0a4',
    grass: '#8d7048',
    grassAlt: '#77603c',
    road: '#4a4c52',
    roadAlt: '#3f4147',
    lane: '#efe3c4',
    edge: '#efe3c4',
    rumbleWidth: 1.05,
    shoulder: 1.22,
    haze: 0.1,
    roadside: 'roof',
    traffic: 0.18,
    trafficMix: 'mixed',
    potholes: 0.04,
    hawkers: 0.45,
    kiosks: true,
    billboards: ['ILE KOKO 1965', 'DUGBE MARKET', 'BANK ROAD'],
    rail: true,
    timeline: 'S . O . Q . C . H . S . P . O . L',
    passengers: [
      { name: 'Alhaja', line: 'I get cloth for the Dugbe shop.' },
      { name: 'Wale', line: 'Drop me where Ile Koko dey watch the road.' },
    ],
    landmark: 'cocoa',
    stretches: [
      { enter: 14, hold: 50, leave: 12, curve: 1.55, hill: -140 },
      { enter: 12, hold: 36, leave: 12, curve: -1.9, hill: 280 },
    ],
  },
  {
    id: 'mapo',
    name: 'Mapo',
    street: 'Ogunmola Street',
    address: 'Mapo Hill, Beere',
    subtitle: 'The old city on the hill.',
    sign: 'MAPO',
    radio: [
      'Ogunmola Street dey climb Mapo. The hall face Mapo Road since 1929.',
      'Beere narrow. Olubadan palace dey a short walk. Drive with sense.',
      'Old Ibadan no build this road for hurry.',
    ],
    skyTop: '#c46a3a',
    skyBottom: '#f0b56a',
    grass: '#a85a32',
    grassAlt: '#8f4c2a',
    road: '#5a463c',
    roadAlt: '#4e3d34',
    lane: '#efe3c4',
    edge: '#efe3c4',
    rumbleWidth: 1.04,
    shoulder: 1.12,
    haze: 0.16,
    roadside: 'roof',
    traffic: 0.16,
    trafficMix: 'keke',
    potholes: 0.07,
    hawkers: 0.85,
    kiosks: true,
    billboards: ['OJA-OBA', 'ASO-OKE HERE', 'MAPO HALL'],
    timeline: 'S . H . O . Q . L . S . C . H . O',
    passengers: [
      { name: 'Baba Ayo', line: 'Oja-Oba. I get aso-oke to collect.' },
      { name: 'Folake', line: 'This street no wide. Small small.' },
    ],
    landmark: 'mapo',
    stretches: [
      { enter: 12, hold: 28, leave: 10, curve: 2.7, hill: 1500 },
      { enter: 10, hold: 28, leave: 10, curve: -2.8, hill: 1300 },
      { enter: 10, hold: 18, leave: 12, curve: 1.8, hill: 360 },
    ],
  },
  {
    id: 'okeare',
    name: 'Oke Are',
    street: 'Oke Are Road',
    address: "Bower's Tower, Ibadan 200285",
    subtitle: 'Highest of the seven hills.',
    sign: 'OKE ARE',
    radio: [
      "Oke Are Road. Bower's Tower. If you see am, you don drive Ibadan.",
      'From up here the roofs are rust. That one na the city.',
      'Last climb. No roll back now.',
    ],
    skyTop: '#f08a3c',
    skyBottom: '#f6d7a0',
    grass: '#6f8f4e',
    grassAlt: '#5e7a42',
    road: '#5a5148',
    roadAlt: '#4e463e',
    lane: '#efe3c4',
    edge: '#efe3c4',
    rumbleWidth: 1.06,
    shoulder: 1.58,
    haze: 0.12,
    roadside: 'palm',
    traffic: 0.05,
    trafficMix: 'keke',
    potholes: 0.02,
    hawkers: 0,
    kiosks: false,
    billboards: ["BOWER'S TOWER", 'LAST CLIMB', 'CITY OF SEVEN HILLS'],
    timeline: 'O . . . S . . . H . . . O',
    passengers: [{ name: 'Dele', line: 'I wan see the rust roofs from the top.' }],
    landmark: 'tower',
    stretches: [
      { enter: 12, hold: 24, leave: 10, curve: 0.9, hill: 900 },
      { enter: 12, hold: 36, leave: 16, curve: -0.35, hill: 2600 },
    ],
  },
]
