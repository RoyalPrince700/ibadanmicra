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
  | 'keke'
  | 'okada'
  | 'danfo'
  | 'passenger'
  | 'hawker'
  | 'pothole'
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
  lanes: 1 | 2
  rumbleWidth: number
  shoulder: number
  haze: number
  roadside: 'palm' | 'umbrella' | 'roof' | 'tree'
  traffic: number
  trafficMix: 'keke' | 'danfo' | 'mixed'
  potholes: number
  hawkers: number
  kiosks: boolean
  passengers: Rider[]
  landmark?: 'cocoa' | 'mapo' | 'tower' | 'premier' | 'terminal'
  stretches: Stretch[]
}

/**
 * One Micra shift, morning at Toll Gate to sunset on Oke Are.
 * Order follows a cross-town drop a driver could actually run:
 * expressway in, east to Iwo Road, north through Bodija to Ojoo,
 * then back through Mokola and Dugbe into the old city.
 * The drive is a straight dual carriageway. Hill is the climb
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
    ],
    skyTop: '#7eb6e8',
    skyBottom: '#f3d7a4',
    grass: '#8a9a4e',
    grassAlt: '#73843f',
    road: '#4e535b',
    roadAlt: '#454a52',
    lane: '#f5c400',
    edge: '#e2b43a',
    lanes: 2,
    rumbleWidth: 1.28,
    shoulder: 1.9,
    haze: 0.08,
    roadside: 'palm',
    traffic: 0.06,
    trafficMix: 'mixed',
    potholes: 0.015,
    hawkers: 0,
    kiosks: false,
    passengers: [{ name: 'Bola', line: 'I just land from Lagos.' }],
    stretches: [
      { enter: 20, hold: 80, leave: 16, curve: 0.6, hill: 420 },
      { enter: 14, hold: 40, leave: 14, curve: -0.8, hill: -120 },
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
    lanes: 2,
    rumbleWidth: 1.22,
    shoulder: 1.7,
    haze: 0.06,
    roadside: 'umbrella',
    traffic: 0.22,
    trafficMix: 'danfo',
    potholes: 0.03,
    hawkers: 0.35,
    kiosks: true,
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
    ],
    skyTop: '#6aa6d8',
    skyBottom: '#f0c48a',
    grass: '#b08648',
    grassAlt: '#96723c',
    road: '#5a534c',
    roadAlt: '#4e4842',
    lane: '#f5c400',
    edge: '#e2b43a',
    lanes: 2,
    rumbleWidth: 1.14,
    shoulder: 1.38,
    haze: 0.14,
    roadside: 'umbrella',
    traffic: 0.28,
    trafficMix: 'keke',
    potholes: 0.05,
    hawkers: 0.55,
    kiosks: true,
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
    lanes: 1,
    rumbleWidth: 1.06,
    shoulder: 1.26,
    haze: 0.06,
    roadside: 'umbrella',
    traffic: 0.15,
    trafficMix: 'keke',
    potholes: 0.045,
    hawkers: 0.6,
    kiosks: true,
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
    lanes: 2,
    rumbleWidth: 1.16,
    shoulder: 1.48,
    haze: 0.32,
    roadside: 'tree',
    traffic: 0.2,
    trafficMix: 'mixed',
    potholes: 0.03,
    hawkers: 0.3,
    kiosks: true,
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
    lanes: 1,
    rumbleWidth: 1.06,
    shoulder: 1.42,
    haze: 0.05,
    roadside: 'tree',
    traffic: 0.12,
    trafficMix: 'mixed',
    potholes: 0.03,
    hawkers: 0.1,
    kiosks: false,
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
    ],
    skyTop: '#4f86b4',
    skyBottom: '#efd0a4',
    grass: '#8d7048',
    grassAlt: '#77603c',
    road: '#4a4c52',
    roadAlt: '#3f4147',
    lane: '#efe3c4',
    edge: '#efe3c4',
    lanes: 1,
    rumbleWidth: 1.05,
    shoulder: 1.22,
    haze: 0.1,
    roadside: 'roof',
    traffic: 0.18,
    trafficMix: 'mixed',
    potholes: 0.04,
    hawkers: 0.45,
    kiosks: true,
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
    lanes: 1,
    rumbleWidth: 1.04,
    shoulder: 1.12,
    haze: 0.16,
    roadside: 'roof',
    traffic: 0.16,
    trafficMix: 'keke',
    potholes: 0.07,
    hawkers: 0.4,
    kiosks: true,
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
    lanes: 1,
    rumbleWidth: 1.06,
    shoulder: 1.58,
    haze: 0.12,
    roadside: 'palm',
    traffic: 0.05,
    trafficMix: 'keke',
    potholes: 0.02,
    hawkers: 0,
    kiosks: false,
    passengers: [{ name: 'Dele', line: 'I wan see the rust roofs from the top.' }],
    landmark: 'tower',
    stretches: [
      { enter: 12, hold: 24, leave: 10, curve: 0.9, hill: 900 },
      { enter: 12, hold: 36, leave: 16, curve: -0.35, hill: 2600 },
    ],
  },
]
