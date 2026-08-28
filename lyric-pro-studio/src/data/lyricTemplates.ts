import { LyricGenerateRequest, LyricGenerateResponse, LyricSet } from '../types';

export function generateAlgorithmicLyrics(req: LyricGenerateRequest): LyricGenerateResponse {
  const genre = (req.customGenre && req.customGenre.trim() ? req.customGenre.trim().slice(0, 10) : req.genre);
  const vibe = (req.customVibe && req.customVibe.trim() ? req.customVibe.trim().slice(0, 10) : req.vibe);
  const isExplicit = req.explicit;
  const mode = req.mode;
  const starter = req.starterType || 'verse';

  const randomSeedA = Math.floor(Math.random() * 100000);
  const randomSeedB = Math.floor(Math.random() * 100000) + 50000;

  const setA = buildSet(genre, vibe, isExplicit, mode, starter, 'Set A', 1, randomSeedA, req.userLyrics, req.userLyricsOption);
  const setB = buildSet(genre, vibe, isExplicit, mode, starter, 'Set B', 2, randomSeedB, req.userLyrics, req.userLyricsOption);

  return {
    setA,
    setB,
    isAiGenerated: false,
    timestamp: Date.now()
  };
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSet(
  genre: string, 
  vibe: string, 
  explicit: boolean, 
  mode: string, 
  starterType: string,
  setName: string,
  variationIndex: number,
  seed: number,
  userLyrics?: string,
  userLyricsOption?: string
): LyricSet {
  const ex = explicit;
  const wordCurse = ex ? getRandomItem(["damn ", "fuckin' ", "shit ", "motherfuckin' "]) : getRandomItem(["real ", "heavy ", "pure ", "golden "]);
  const wordShit = ex ? getRandomItem(["shit ", "bullshit ", "game "]) : getRandomItem(["game ", "chase ", "reign "]);
  const wordHell = ex ? getRandomItem(["hell ", "fire ", "pit "]) : getRandomItem(["sky ", "heights ", "peak "]);

  const titlesA = ["CROWN OF THORNS", "NEON METROPOLIS", "DIAMOND CADENCE", "APEX PREDATOR", "UNFILTERED FREQUENCY"];
  const titlesB = ["MIDNIGHT ECLIPSE", "VALHALLA VIBE", "PHANTOM FREQUENCY", "VELVET THUNDER", "INFINITE HORIZON"];

  const chosenTitle = getRandomItem(variationIndex === 1 ? titlesA : titlesB);

  if (mode === 'user_lyrics') {
    const userText = userLyrics && userLyrics.trim() ? userLyrics.trim() : "I'm stepping through the dark with a golden light / Counting every second till the studio takes flight";
    const option = userLyricsOption || 'finish_lyrics';

    if (option === 'finish_lyrics') {
      return {
        title: `${chosenTitle} (Finished Lyrics - ${setName})`,
        genre,
        vibe,
        structure: 'Custom Lyrics Completion',
        explicit,
        content: `--- ORIGINAL DRAFT LINES (${setName}) ---
${userText}

--- CONTINUED & FINISHED SONG SECTIONS ---
[VERSE 1 CONTINUATION]
Building off your foundation, stepping up the frequency
Every single syllable hitting with pure authenticity
We don't bow to pressure, we just double down the rhythm
Decoding every obstacle and breaking through the prism

[PRE-CHORUS]
Feel the sub-bass rising, atmosphere in motion
Pouring out our energy like waves across the ocean...

[CHORUS]
We take the crown, we shatter the floor!
Building on your vision and asking for more!
From your first draft line to the stadium sound!
Tonight we reign supreme and we conquer our ground!`
      };
    } else if (option === 'ideas_from_lyrics') {
      return {
        title: `${vibe} ${genre} Writing Extensions (${setName})`,
        genre,
        vibe,
        structure: 'Next-Line Ideas & Extensions',
        explicit,
        content: `--- 6 NEXT-LINE IDEAS BASED ON YOUR LYRICS (${setName}) ---

YOUR FOUNDATION:
"${userText}"

1. NEXT-LINE PUNCHLINE:
"Turned that initial spark into a multi-platinum flame, now the whole industry knows my name."

2. INTERNAL RHYME SCHEME EXTENSION:
"No hesitation in my steps, no hesitation in my mind—leaving every competitor far behind."

3. ATMOSPHERIC METAPHOR:
"Written in the stars above the neon city skyline, every single cadence aligning in divine time."

4. HIGH-ENERGY CHORUS HOOK IDEA:
"We don't chase the trend, we set the benchmark high—tracing gold metaphors across the midnight sky!"

5. DOUBLE-ENTENDRE BAR:
"They talked about the weight I carried on my chest, but never saw the pressure turned to diamonds in the press."

6. RHYTHMIC CADENCE SHIFT:
"Fast-forward to the payoff, turn the monitors loud—stepping on the stage in front of fifty thousand proud."`
      };
    } else {
      // enhance_pattern
      return {
        title: `${chosenTitle} (Elevated Pattern - ${setName})`,
        genre,
        vibe,
        structure: 'Multi-Syllabic Pattern Enhancement',
        explicit,
        content: `--- ORIGINAL INPUT LINES ---
${userText}

--- ELEVATED LYRICAL PATTERN & FLOW ENHANCEMENT (${setName}) ---
[REWORKED CADENCE & MULTI-SYLLABIC RHYME SCHEME]
(Optimized for dynamic breathing, rhythmic syncopation, and double-entendre impact)

${userText.split('\n').map((line, idx) => `[BAR ${idx + 1} ENHANCED]
Original: "${line}"
Elevated Flow: "${line} — Amplified with diamond cadence and heavy low-end rhythm"`).join('\n\n')}

[FULL ENHANCED PASSAGE - ELITE FLOW]
Pacing through the darkness with an undeniable frequency
Converting every whisper into multi-tiered authenticity
No static in the signal, every metaphor aligned in precision
Transforming raw draft lines into a golden studio vision!`
      };
    }
  }

  if (mode === 'ideas_6') {
    const ideasPool = [
      `1. "Chasing neon shadows in the studio, turned a low whisper into heavy gold."`,
      `2. "They built a ceiling overhead, so I bought the whole ${wordHell}and tore it down line by line."`,
      `3. "Cold blood, warm mic, pacing through the night with the cadence of a crowned monarch."`,
      `4. "My legacy ain't written in pencil—it's forged in diamond steel and amplified."`,
      `5. "Standing on the edge of the sub-bass stack, hearing fifty thousand voices scream my name."`,
      `6. "No blueprint needed when you build the whole foundation and control the frequency yourself."`,
      `7. "Flipping every set-back into a multi-platinum wave while the doubters spectate."`,
      `8. "Heavy is the head that wears the crown, but I rock it like a custom leather jacket."`,
      `9. "Stepped off the pavement into royalty, leaving tire marks across the chart tops."`,
      `10. "They talk about the ${wordShit}I built, but never saw the blood dripping on the studio floor."`
    ];

    // Pick 6 unique random ideas from pool
    const shuffled = [...ideasPool].sort(() => 0.5 - Math.random());
    const chosenIdeas = shuffled.slice(0, 6);

    return {
      title: `${vibe} ${genre} 6-Line Elite Pack (${setName})`,
      genre,
      vibe,
      structure: '6 Standalone Line Punchlines',
      explicit,
      content: `--- 6 ELITE STANDALONE LYRIC PUNCHLINES (${setName}) ---\n\n` + chosenIdeas.join('\n\n')
    };
  }

  if (mode === 'starter') {
    if (starterType === 'verse') {
      const verseLinesA = [
        `Static in the monitors, sub-bass humming low`,
        `Stepping to the dynamic mic, ready for the show`,
        `Every syllable a bulletproof cadence in the dark`,
        `Leaving every stadium in town with a permanent mark`,
        `We don't chase the algorithm, we dictate the wave`,
        `Digging up the rhythm that they buried in the grave`,
        `Pacing through the hallway with a platinum state of mind`,
        `Leaving every critic and competitor behind...`
      ];

      const verseLinesB = [
        `Tick-tock on the studio clock, temperature below freezing`,
        `Spitting ${wordCurse}bars for the soul, never for the pleasing`,
        `Eyes locked on the glowing waveform pulsing in the red`,
        `Fulfilling every prophecy that the ancient legends said`,
        `They tried to lock the golden gates, but I brought the key`,
        `Now everybody in the venue's screaming out for me`,
        `Heavyweight bars hitting like a wrecking ball in motion`,
        `Pouring out my spirit like a river to the ocean...`
      ];

      const chosenVerse = variationIndex === 1 ? verseLinesA : verseLinesB;

      return {
        title: `${vibe} ${genre} Master Verse Starter (${setName})`,
        genre,
        vibe,
        structure: 'Verse Starter (8-16 Bars)',
        explicit,
        content: `[VERSE STARTER - ${setName.toUpperCase()}]\n` + chosenVerse.join('\n')
      };
    } else {
      const chorusA = [
        `And we ride through the storm till the daylight breaks!`,
        `Feel the heavy bass shaking every single bone it takes!`,
        `We don't bow, we don't break, we just claim the throne!`,
        `Yeah, tonight we reign supreme and we conquer our own!`
      ];

      const chorusB = [
        `Turn the signal high, let the speakers explode!`,
        `We are driving real fast down this golden road!`,
        `No regrets, no delays, taking over the scene!`,
        `Living every single second like a king and queen!`
      ];

      const chosenChorus = variationIndex === 1 ? chorusA : chorusB;

      return {
        title: `${vibe} ${genre} Master Chorus Starter (${setName})`,
        genre,
        vibe,
        structure: 'Chorus Starter (4-8 Bars)',
        explicit,
        content: `[CHORUS STARTER - ${setName.toUpperCase()}]\n` + chosenChorus.join('\n')
      };
    }
  }

  // Full Song Builder
  const songText = 
`[TRACK TITLE: ${chosenTitle} (${setName})]
Genre: ${genre} | Vibe: ${vibe} | Mode: Full Song | Explicit: ${explicit ? 'EXPLICIT (RAW)' : 'CLEAN'}

[INTRO]
(Atmospheric pads swell / sub-bass low-pass filter opening)
Yeah... Lyric Pro Elite Engine engaged...
Indiebrotherhood signature rhythm...
Listen to the cadence...

[VERSE 1]
Woke up with a blueprint burning in my brain
Stepped out of the dark shadows, washing off the pain
They wanted ${ex ? 'unfiltered raw ' : 'pure flawless '}perfection, so I brought the fire
Laying down the heaviest cadence on the telephone wire
Every syllable strikes like a hammer hitting steel
Showing the whole world what it means when it's real
No auto-tune needed for the truths that I tell
Rising straight up out of that cold quiet ${ex ? 'hell' : 'cell'}

[PRE-CHORUS]
Feel the pressure building up, tension in the room
One single spark turns the silence into boom
Are you ready for the payoff? Here comes the roar...

[CHORUS]
We take the crown, we shatter the floor!
Giving 'em the raw energy, asking for more!
Built this empire line by line in the dark!
Every single track we drop leaves a permanent mark!
Yeah, we stand tall, we never fade away!
Living out the ${wordCurse}masterpiece we made today!

[VERSE 2]
Second chapter open, elevation on high
Tracing golden metaphors across the midnight sky
Doubtful critics watching from the lower row
While we sell out every single stadium show
Keep the tempo steady, let the kick drum knock
Turn the master volume dial till we shatter the lock

[CHORUS]
We take the crown, we shatter the floor!
Giving 'em the raw energy, asking for more!
Built this empire line by line in the dark!
Every single track we drop leaves a permanent mark!

[BRIDGE / BREAKDOWN]
(Drums drop out, ambient synth textures hold)
If you ever felt the weight holding back your dream...
Just turn the frequency up high and let the speakers scream...

[OUTRO]
Fade to black, echo out the final chord...
Lyric Pro Studio. Elite execution by indiebrotherhood.
(Silence)`;

  return {
    title: `${chosenTitle} (${setName})`,
    genre,
    vibe,
    structure: 'Full Song Structure',
    explicit,
    content: songText
  };
}
