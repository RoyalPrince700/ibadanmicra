# Seven Hills

A browser driving game for Ibadan. Frontend only. Scores stay in this browser until a backend is added later.

## Run it

From this folder:

```
npm install
npm run dev
```

Open the local address Vite prints (set to port 5174). Phone and desktop both work.

## Controls

- The road has two lanes. The right lane is yours. The left lane carries oncoming traffic.
- Left arrow or A moves into the left lane to overtake. Right arrow or D takes you back. On a phone, use the Left and Right buttons or tap either side of the road.
- The Micra keeps rolling. Brake with down arrow, S, or Brake.
- Honk with Space, H, or Honk. A keke or okada ahead pulls onto the shoulder; a danfo or trailer hurries off.
- Enter or the button starts the shift.

## Traffic timeline

Traffic is scripted, not random. Each street in `src/game/districts.ts` has a `timeline` string, one letter per beat:

| Beat | Meaning |
| --- | --- |
| `O` | One vehicle coming at you in the left lane |
| `C` | Two oncoming, back to back |
| `S` | Slow vehicle in your lane: overtake left or brake |
| `Q` | Slow vehicle in your lane with an oncoming one beside it: wait, then pass |
| `P` | Danfo or keke stopped in your lane to load |
| `H` | Pothole in your lane |
| `L` | Pothole in the oncoming lane |
| `.` | Breather |

Busier streets play beats closer together. Each beat is timed so you meet it where it is written at cruising speed. Beats in your lane are held back around bus stops so a pickup is never blocked. The strip on the right of the screen shows everything coming in both lanes, with distances. A clean overtake pays ₦100.

Reach Bower’s Tower. Three hits end the shift. Fare is the score.

## Download the logo and flyer

Those boards live in the Flier Studio project on the desktop (`pa/graphics`).

Sign in, open **Templates**, choose **Seven Hills**. Four boards:

- Logo · Dark
- Logo · Light
- Launch poster (1080×1350)
- X post (1600×900)

Select a board and export PNG or JPG from the studio. The same mark is already copied into this game at `public/brand/`.

---

# Research

Ibadan is the Oyo State capital, in the hills of southwestern Nigeria. It grew from an early-19th-century war camp into one of West Africa’s largest cities by land area. People still call it the city of seven hills. Oral lists do not always agree on the seven names. The ones that matter on the road are Mapo, Oke-Are (Bower’s Tower), Mokola, Oke-Ado, Oke-Bola, and Oke-Ibadan at Eleyele.

From a hill the city reads as rust-coloured metal roofs. That is the picture drivers and visitors describe, and it is the picture this game uses. A short famous poem says something close to that. The game does not quote it.

## Why a Micra, not a danfo

The Lagos games on Twitter are about the yellow danfo: the park, the conductor, the rush. Ibadan has buses too. What people actually joke about, and what climbs these hills every day, is the Nissan Micra used as a taxi. It is cheap to fix, parts are everywhere around Gate and Iwo Road, and it will attempt a slope a bigger car hesitates on. Keke and okada weave around it. That is the local equivalent of the danfo fantasy: one small car, a city that is not flat, and a driver who knows the turn.

The old saying used in the game is **Ibadan lo mo, o mo layipo** — Ibadan knows the person who knows how to turn.

## The drive, as a real day

A driver coming in from Lagos meets the city in this order. The game follows that order and leaves other roads for later shifts.

1. **Toll Gate / Lagos–Ibadan Express.** The old expressway is still the front door. The road is wider here. Billboards, hawkers at slow points, then the city thickens.
2. **Iwo Road.** A real gateway park and a long commercial strip. Buses toward Ife, Iwo, and Osun. Keke come out of side streets without warning. This is the chaos stage.
3. **Bodija.** Residential streets plus one of the big food markets. Stalls lean toward the road. This is where a basin-on-the-head passenger belongs, and where amala, gbegiri, and ewedu are the local plate.
4. **Mokola Hill.** A true climb into a roundabout and a transport node. If you arrive with no speed, a small car rolls back. Premier Hotel sits on this side of town. The hill is the joke and the test.
5. **Dugbe.** The commercial heart: banks, hawkers, Dugbe market, and **Cocoa House** (Ile Koko). The tower is widely described as a 26-storey building finished in 1965, the first skyscraper in West Africa. You do not need to enter it. You need to see it and not hit a keke while looking.
6. **Beere and Mapo.** The old city. Streets get narrow. Roofs sit close to the road. **Mapo Hall** (Taffy Jones, late 1920s) stands on Mapo Hill above Oja-Oba. Cloth, the palace quarter, and the feeling that the road was not built for hurry.
7. **Oke Are, Bower’s Tower.** The tower was unveiled in December 1936 on the high hill at Oke-Are (some local signs and tourism notes say Oke-Aremo; both names are in circulation for this height). It was built in honour of Captain Robert Lister Bower. On a clear day the tower is how you see the rest of the drive at once: Cocoa House, the university side, Iwo Road, the brown roofs.

## Other places, saved for later routes

Not in this first shift, but they are real Ibadan and should come back as extra routes:

- **University of Ibadan** and **Agbowo / Sango / UI Gate** — tree-lined, students crossing.
- **Agodi Gardens** — the green pause: lake, zoo, families. A calm bonus road in the rain.
- **Challenge and Ring Road**, **New Garage** — the other big junctions and parks.
- **Ojoo** — the road toward Oyo and Ilorin.
- **Oke-Ado, Oke-Bola, Molete, Orita-Aperin** — inner streets drivers use when the main road locks.
- **Eleyele** — Oke-Ibadan and the lake.
- **Aleshinloye, Oje, Gbagi** — markets with their own traffic personalities. Oje’s big day is Saturday.
- **Lekan Salami Stadium** at Adamasingba.
- **UCH** and the secretariat side near Agodi.

Rain in Ibadan is heavy and short. Low roads hold water. A later build can add a rain minute. This version stays dry so the hills read clearly.

## What is fun about driving here

Lagos driving-games sell density: many buses, one lane, no patience. Ibadan can sell **slope and memory**.

- You pick up speed on the express, then spend it on Mokola and Oke Are.
- A right turn at Beere is a decision, not decoration. Miss it and you are in the roofs.
- Markets are not a separate level. They are the roadside.
- The reward for finishing is a view, not a cutscene: the tower, then the roofs you just drove through.

---

# Game script

**Title:** Seven Hills
**Genre:** Arcade driving, one sitting, about three minutes.
**Player:** Kola. Micra driver. The car is yellow with a green stripe. Plate on the back reads IBD. He is not a hero. He is on a shift.
**Win:** Reach Bower’s Tower with at least one life left.
**Lose:** Three hits from keke or okada.
**Score:** Fare. Passengers pay ₦500. Each new district pays ₦200. The tower pays a ₦2,000 finish. Best fare is saved on this device only.

No conductor. In a Micra the driver is the hustle.

## Cast

- **Kola** — the player. Talks with the car, not with a speech box.
- **Iya Bose** — Bodija trader. Basin. She is going to her customer, not on a tour.
- **Tunde** — UI student, late for a tutorial. He will accept a drop that is merely close.
- **Alhaja Silifat** — cloth, heading toward Oja-Oba.
- **Sule** — not a character you meet. He is every keke that enters your lane. Honk and he shifts.

## Shift

### 0. Title

The road is already moving behind the card.

**Kola, on the card:** Drive from Toll Gate to Bower’s Tower. Dodge keke, pick passengers, and do not roll back on Mokola.

Button: **Start shift.**

### 1. Toll Gate

Wide road, mild bends, a few cars. The player learns steering before the city gets rude.

**Radio:** You don enter Ibadan. Rust roofs dey wait for the hills.

**Passenger, if you take them:** Welcome to Ibadan. Just carry me small.

### 2. Iwo Road

Curves tighten. Keke and okada spawn in the lanes. Umbrellas on the shoulder. Honk matters here.

**Radio:** Iwo Road. Keke fit enter from anywhere.

**Passenger:** Iwo Road park. I dey go Ife side.

### 3. Bodija

Market umbrellas, more passengers, a softer hill so the player arrives at Mokola with a choice: brake for a trader, or keep the speed.

**Radio:** Bodija market don lean into the road. Gently.

**Iya Bose:** Bodija market. My customer dey wait.

**Tunde:** I dey go UI, but this side go do. Late tutorial.

### 4. Mokola Hill

The road rises hard. Gas is already on. If a crash or a long brake ate your speed, the Micra rolls backward and the banner says so. Premier Hotel is the building on the right. The roundabout at the top is a sharp bend.

**Radio:** Mokola Hill. Carry speed now, or the Micra go roll back.

**Passenger:** Make you no stall for this hill o.

### 5. Dugbe

Down from the hill into the CBD. Cocoa House stands on the right. Traffic is thick again. Looking at the tower is how you hit a keke.

**Radio:** Dugbe. Ile Koko dey stand — Cocoa House.

**Passenger:** Cocoa House side. I go come down there.

### 6. Beere and Mapo

Narrow, rusty, sharp curves one after another. Roof clusters replace palms. Mapo Hall is the wide cream building with the pediment.

**Radio:** Beere narrow. Old Ibadan no build this road for hurry.

**Alhaja:** Oja-Oba. I get aso-oke to collect.

### 7. Oke Are

Traffic thins. One more climb. The tower is the landmark and the finish. The sky goes warm.

**Radio:** Last climb. Oke Are.

**If you arrive:** You don reach Oke Are. Fare includes the tower bonus.

**If you are hit out:** The Micra don tire. The hill is still there. Drive again.

## Tone

Warm, specific, proud of the city. Passengers talk like people in a hurry, not like tour guides. Do not mock the Micra, the markets, or the hills. The joke is the roll-back, and it is on the driver.

## Later, when you add the MERN backend

Keep this frontend. Add only:

- `POST /api/scores` with a name and a fare
- `GET /api/scores` for a short board
- MongoDB collection `scores`

No login required for that first board. Accounts, daily shifts, and the extra routes (Agodi, UI Gate, Challenge, Ojoo) can wait until people are actually finishing the tower.
