# Seven Hills — sounds to download

The Micra already makes three sounds in code: a square-wave honk, a sawtooth boost hum, and a sine coin chime. Replace those with the files below. Everything else is new.

Put files in `public/sounds/`. Short effects as `.ogg` (or `.mp3` if that is all the site gives you). Loops must be seamless. Keep effects under about one second so they do not talk over the radio line.

Download only tracks you have a licence for. Good places: [Freesound](https://freesound.org) (filter CC0), [Pixabay](https://pixabay.com/music/) and [Pixabay sound effects](https://pixabay.com/sound-effects/), [Kenney](https://kenney.nl/assets?q=audio) (CC0 game packs), and the YouTube Audio Library. Search terms are written so you can paste them.

Tone of the whole set: a small yellow taxi on a warm morning, not a racing game. The joke is the roll-back on the hill. Do not use sirens, gunshots, or sports-car revs.

---

## Background soundtrack

One instrumental, looping, about two to three minutes. The road does not end, so the track has to join back to its start with no click and no big drop.

**File:** `music-shift.ogg`

**What to look for**

- Highlife or soft afrobeat, guitar-led, no vocals.
- About 96–108 BPM. Fast enough to drive, slow enough to hear the radio.
- Bass, clean electric guitar, light shekere or talking drum, a soft horn once in a while.
- Morning, proud, a bit dusty. Think taxi radio between Toll Gate and Oke Are, not a club and not a trailer score.

**Search**

- `highlife instrumental loop no vocals`
- `afrobeat guitar loop calm royalty free`
- `west african highlife background`

**How it plays**

- Title card: same track, quieter, while the road scrolls behind the card.
- Start shift: fade up over about one second.
- Pause: fade to silence. Resume fades it back.
- Win (`You don reach Oke Are`): let it finish the phrase, then a short warm sting.
- Three hits (`The Micra don tire`): duck it and play the stall sting instead.

**Also download, only if the main loop feels too busy on the title card**

| File | Search | Use |
| --- | --- | --- |
| `music-title.ogg` | `soft highlife ambient loop` | Title only. Crossfade into `music-shift` on Start shift. |

Skip lyrics. The footer already shows radio lines, and passengers talk in toasts.

---

## Engine and road

These stay on while the shift runs. Pitch and volume follow speed. The Micra is a small four-cylinder, a bit rattly, not a V8.

| File | Length | Search | When |
| --- | --- | --- | --- |
| `engine-idle.ogg` | loop, 2–4 s | `small car idle loop interior` | Speed near zero, including the title scroll at a low level |
| `engine-drive.ogg` | loop, 2–4 s | `small car driving interior loop` | Cruising. Crossfade from idle as speed rises. Pitch up slightly with km/h |
| `engine-boost.ogg` | loop, 2 s | `small car acceleration interior loop` | Replaces the sawtooth hum while Boost is on. Louder and a little higher. Stops dead when the bar hits empty |
| `road-rumble.ogg` | loop, 3 s | `asphalt road rumble interior loop` | Under the engine, very quiet. A bit louder on rough stretches |
| `wind.ogg` | loop, 4 s | `car window wind loop light` | Only while boosting, quiet |

On Mokola and Oke Are, keep `engine-drive` and lower its pitch when the grade is steep, so the climb sounds like work. When `speed < 0` (rolling back), drop to `engine-idle` and play the stall effect below.

---

## Effects you need

### Hands on the car

| File | Search | When |
| --- | --- | --- |
| `honk.ogg` | `compact car horn double beep` | Space, H, or Honk. Two short peeps, about 0.4 s total. This is the “Peep peep!” toast. Replaces the square-wave horn |
| `lane.ogg` | `car lane change whoosh short` | Left or right, one lane. Very short, quiet |
| `brake.ogg` | `car brake light interior` | Down, S, or Brake, only if speed is already up. Do not retrigger every frame |
| `boost-start.ogg` | `car turbo whoosh short` | The moment Boost arms |
| `boost-empty.ogg` | `engine sputter short` | “Boost don finish” and “Boost empty” |
| `stall.ogg` | `car engine struggle stall` | Once when the banner `Rolling back on …` appears. Do not loop it |

### Traffic answering the horn

Honk already moves a keke or okada onto the shoulder, and a danfo or trailer hurries off. Play one reply, not all of them.

| File | Search | When |
| --- | --- | --- |
| `keke-yield.ogg` | `auto rickshaw engine pass` | A keke gives way |
| `okada-yield.ogg` | `motorcycle pass by short` | An okada gives way |
| `danfo-hurry.ogg` | `old bus engine rev short` | Danfo or trailer hurries off |
| `horn-miss.ogg` | `car horn distant short` | Honk when nothing moves. Quieter than `honk.ogg` |

### Hits

Three hits end the shift. These must read instantly.

| File | Search | When |
| --- | --- | --- |
| `hit-rear.ogg` | `car bumper bump metal` | “You jam the … from behind.” |
| `hit-headon.ogg` | `car crash impact short` | “Head-on with a …” Louder than the rear hit. One life |
| `pothole.ogg` | `car suspension thud pothole` | “Pothole. Ibadan road greet you.” No life lost, just a speed drop |
| `life-lost.ogg` | `dull glass crack short` | Any hit that costs a life, layered under the impact. Skip on the pothole |

Do not add a long crash cinematic. The car blinks and keeps going unless lives hit zero.

### Money and passengers

Fare is the score. Coins pay ₦80 and fill boost. A clean overtake pays ₦100. A pickup pays ₦200 plus the drop fare later. A new district pays ₦250. The tower finish adds ₦3,000.

| File | Search | When |
| --- | --- | --- |
| `coin.ogg` | `coin pickup bright short` | Drive through a gold coin. Replaces the sine chime. Keep it under 0.15 s so a row of coins does not smear |
| `overtake.ogg` | `cash register ding soft` | “Clean overtake. +₦100” |
| `door-open.ogg` | `car door open close small` | Passenger walks in from the yellow wait lane |
| `pickup.ogg` | `soft ui confirm` | After the door, when the toast says they enter |
| `boot-full.ogg` | `error blip soft` | “Boot don full. Owa first.” Four seats max |
| `owa.ogg` | `car door close` plus a soft coin | O or the Owa button, when someone actually drops |
| `owa-empty.ogg` | `ui deny soft` | “Nobody for inside…” |
| `district.ogg` | `radio station jingle one note` | Entering the next street (Toll Gate, Ring Road, Challenge, Beere, Oje, Iwo Road, Alakia, Akanran, Lalupon, Bodija, Ojoo, Moniya, Mokola, Jericho, Apete, Cocoa House, Mapo, Oke Are, then the lap back). Also the “Lap N” toast |
| `drop-ready.ogg` | `notification chime soft` | “Wan drop. Shout owa.” |

### Shift cards

| File | Search | When |
| --- | --- | --- |
| `ui-click.ogg` | `ui click soft` | Start shift, Resume, Drive again, Pause |
| `pause.ogg` | `tape stop short` | Pause opens |
| `win.ogg` | `warm brass sting short` | “You don reach Oke Are.” About 2 s, no choir |
| `over.ogg` | `engine die out` | “The Micra don tire.” About 1.5 s |

---

## Optional street beds

One quiet loop at a time, under the music, ducked when a toast or a hit plays. Skip these until the list above is in.

| File | Streets | Search |
| --- | --- | --- |
| `bed-express.ogg` | Toll Gate, Alakia | `highway distant trucks loop` |
| `bed-park.ogg` | Challenge, Iwo Road, Ojoo, Moniya | `bus park idle voices distant loop` |
| `bed-market.ogg` | Oje, Bodija, Mapo | `outdoor market crowd loop no music` |
| `bed-oldcity.ogg` | Beere, Akanran, Lalupon | `narrow street distant voices loop` |
| `bed-hill.ogg` | Mokola, Oke Are | `wind over hill light loop` |
| `bed-office.ogg` | Ring Road, Jericho, Cocoa House, Apete | `city traffic distant loop` |

Hawkers and keke already appear as traffic. Do not add a separate hawker shout unless it is one short call, played rarely, or it will fight the radio text.

---

## Download first

If you only grab a handful before wiring them in:

1. `music-shift.ogg` — the highlife loop
2. `engine-drive.ogg` and `engine-boost.ogg`
3. `honk.ogg`
4. `coin.ogg`
5. `hit-rear.ogg` and `hit-headon.ogg`
6. `pothole.ogg`
7. `door-open.ogg` and `owa.ogg`
8. `win.ogg` and `over.ogg`
9. `district.ogg`
10. `stall.ogg`

---

## Mix

- Music sits under everything. Impacts and the horn cut through.
- Only one voice line of effects at a time for money: coin, overtake, pickup, owa. If two fire together, play the louder event.
- Engine loops crossfade. Never start a second copy of the same loop.
- Phone speakers are small. Avoid sub-bass and long reverb. The Micra should sound close, inside the cabin.
