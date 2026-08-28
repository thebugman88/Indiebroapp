import { Quiz } from '../types';

export const FEATURED_QUIZZES: Quiz[] = [
  {
    id: 'finish-hiphop-anthem-1',
    title: 'Finish The Lyric: Hip-Hop Anthems',
    subtitle: 'Rap & Hip-Hop Essentials',
    description: 'Test your bar-for-bar memory on iconic rap verses from Kendrick, Drake, Tupac, Kanye, and Travis Scott.',
    quizType: 'finish_the_song',
    genre: 'hip_hop',
    difficulty: 'medium',
    iconName: 'Mic',
    totalQuestions: 6,
    featured: true,
    playsCount: 24890,
    questions: [
      {
        id: 'hh-1',
        questionText: '"I was runnin\' through the 6 with my woes, _____"',
        songContext: 'Song: Know Yourself by Drake',
        options: [
          'You know how that should go',
          'Countin\' money in the dark alone',
          'Ridin\' in a drop-top Lambo',
          'Lookin\' at the city from the throne'
        ],
        correctIndex: 0,
        explanation: 'Drake famously drops "You know how that should go" on this 2015 mixtape anthem from If You\'re Reading This It\'s Too Late.'
      },
      {
        id: 'hh-2',
        questionText: '"Be humble, sit down! Be humble, _____"',
        songContext: 'Song: HUMBLE. by Kendrick Lamar',
        options: [
          'Bitch, sit down!',
          'Sit down!',
          'Stand up!',
          'Listen now!'
        ],
        correctIndex: 0,
        explanation: 'Kendrick Lamar\'s Grammy-winning single HUMBLE. peaked at #1 on the Billboard Hot 100 in 2017.'
      },
      {
        id: 'hh-3',
        questionText: '"Sun is down, freezin\' cold, That\'s how we know _____"',
        songContext: 'Song: SICKO MODE by Travis Scott ft. Drake',
        options: [
          'winter\'s here',
          'the night is young',
          'winter\'s set in',
          'summer\'s gone'
        ],
        correctIndex: 2,
        explanation: 'SICKO MODE by Travis Scott featuring Drake became a diamond-certified rap anthem.'
      },
      {
        id: 'hh-4',
        questionText: '"Supermarket flowers, mama\'s smile... Wait, "Poppa was a rolling stone, wherever he laid his hat was _____"',
        songContext: 'Song: Papa Was a Rollin\' Stone / Rap sample classic',
        options: [
          'his home',
          'his throne',
          'alone',
          'his zone'
        ],
        correctIndex: 0,
        explanation: 'Classic Motown line sampled across dozens of iconic hip-hop records.'
      },
      {
        id: 'hh-5',
        questionText: '"I got 99 problems, but _____"',
        songContext: 'Song: 99 Problems by Jay-Z',
        options: [
          'a bitch ain\'t one',
          'the money ain\'t one',
          'the law ain\'t one',
          'my status ain\'t one'
        ],
        correctIndex: 0,
        explanation: 'Produced by Rick Rubin, Jay-Z\'s 2004 track remains one of rap\'s most recognizable hooks.'
      },
      {
        id: 'hh-6',
        questionText: '"His palms are sweaty, knees weak, arms are heavy, _____"',
        songContext: 'Song: Lose Yourself by Eminem',
        options: [
          'There\'s vomit on his sweater already, mom\'s spaghetti',
          'He\'s nervous, but on the surface he looks calm and ready',
          'To drop bombs, but he keeps on forgettin\'',
          'The clock\'s run out, time\'s up, over, blaow!'
        ],
        correctIndex: 0,
        explanation: 'Lose Yourself won the Academy Award for Best Original Song in 2003.'
      }
    ]
  },
  {
    id: 'whats-the-artist-pop-royalty',
    title: 'What\'s The Artist? Pop Royalty',
    subtitle: 'Global Pop Icons',
    description: 'Read the famous lyrics and match them to the legendary pop artist who recorded the hit.',
    quizType: 'whats_the_artist',
    genre: 'pop',
    difficulty: 'easy',
    iconName: 'Music2',
    totalQuestions: 6,
    featured: true,
    playsCount: 31200,
    questions: [
      {
        id: 'pop-1',
        questionText: '"Cause baby, now we\'ve got bad blood, You know it used to be mad love..."',
        songContext: 'Hit Single: Bad Blood',
        options: ['Taylor Swift', 'Katy Perry', 'Ariana Grande', 'Dua Lipa'],
        correctIndex: 0,
        explanation: 'Bad Blood was a massive #1 hit for Taylor Swift from her blockbuster album 1889 / 1989.'
      },
      {
        id: 'pop-2',
        questionText: '"I\'m blinded by the lights, No, I can\'t sleep until I feel your touch..."',
        songContext: 'Hit Single: Blinding Lights',
        options: ['The Weeknd', 'Bruno Mars', 'Post Malone', 'Justin Bieber'],
        correctIndex: 0,
        explanation: 'Blinding Lights by The Weeknd holds the record for the biggest Billboard Hot 100 song of all time.'
      },
      {
        id: 'pop-3',
        questionText: '"Don\'t start now, Don\'t show up, Don\'t come out, Don\'t start carin\' about me now..."',
        songContext: 'Hit Single: Don\'t Start Now',
        options: ['Dua Lipa', 'Billie Eilish', 'Olivia Rodrigo', 'Camila Cabello'],
        correctIndex: 0,
        explanation: 'Dua Lipa launched her Future Nostalgia era with this disco-pop anthem.'
      },
      {
        id: 'pop-4',
        questionText: '"I\'m the bad guy, duh..."',
        songContext: 'Hit Single: bad guy',
        options: ['Billie Eilish', 'Lorde', 'Halsey', 'SZA'],
        correctIndex: 0,
        explanation: 'Billie Eilish swept the big four Grammy Awards in 2020 off the strength of bad guy.'
      },
      {
        id: 'pop-5',
        questionText: '"24-karat magic in the air, Head to toe soul protector..."',
        songContext: 'Hit Single: 24K Magic',
        options: ['Bruno Mars', 'Usher', 'Pharrell Williams', 'Justin Timberlake'],
        correctIndex: 0,
        explanation: 'Bruno Mars won Album of the Year at the Grammys for 24K Magic.'
      },
      {
        id: 'pop-6',
        questionText: '"I got a feeling that tonight\'s gonna be a good night..."',
        songContext: 'Hit Single: I Gotta Feeling',
        options: ['Black Eyed Peas', 'Maroon 5', 'Coldplay', 'OneRepublic'],
        correctIndex: 0,
        explanation: 'Produced by David Guetta, Black Eyed Peas dominated the summer of 2009 with this anthem.'
      }
    ]
  },
  {
    id: 'finish-rock-classics',
    title: 'Finish The Song: Classic Rock Legends',
    subtitle: 'Guitars, Hooks & Anthems',
    description: 'Complete lyrics from Queen, Nirvana, Foo Fighters, Red Hot Chili Peppers, and AC/DC.',
    quizType: 'finish_the_song',
    genre: 'rock',
    difficulty: 'expert',
    iconName: 'Flame',
    totalQuestions: 5,
    featured: true,
    playsCount: 18450,
    questions: [
      {
        id: 'rock-1',
        questionText: '"Is this the real life? Is this just fantasy? Caught in a landslide, ____"',
        songContext: 'Song: Bohemian Rhapsody by Queen',
        options: [
          'No escape from reality',
          'Open your eyes to see',
          'Nothing really matters to me',
          'Mama, just killed a man'
        ],
        correctIndex: 0,
        explanation: 'Freddie Mercury wrote Queen\'s legendary masterpiece Bohemian Rhapsody released in 1975.'
      },
      {
        id: 'rock-2',
        questionText: '"With the lights out, it\'s less dangerous, Here we are now, ____"',
        songContext: 'Song: Smells Like Teen Spirit by Nirvana',
        options: [
          'entertain us',
          'in the shadows',
          'sing along',
          'feel the rhythm'
        ],
        correctIndex: 0,
        explanation: 'Kurt Cobain and Nirvana ignited the grunge movement with this 1991 anthem.'
      },
      {
        id: 'rock-3',
        questionText: '"Sweet child o\' mine, Sweet love of mine, ____"',
        songContext: 'Song: Sweet Child O\' Mine by Guns N\' Roses',
        options: [
          'Where do we go now?',
          'She\'s got eyes of the bluest skies',
          'Her hair reminds me of a warm safe place',
          'Take me down to the Paradise City'
        ],
        correctIndex: 0,
        explanation: 'Axl Rose\'s vocal gymnastics at the climax of Guns N\' Roses\' iconic #1 rock single.'
      },
      {
        id: 'rock-4',
        questionText: '"Just a small town girl, livin\' in a lonely world, She took the midnight train ____"',
        songContext: 'Song: Don\'t Stop Believin\' by Journey',
        options: [
          'goin\' anywhere',
          'to the city lights',
          'headin\' back home',
          'down to South Detroit'
        ],
        correctIndex: 0,
        explanation: 'Journey\'s 1981 smash is one of the most downloaded classic rock tracks in history.'
      },
      {
        id: 'rock-5',
        questionText: '"It\'s a long way to the top if you wanna ____"',
        songContext: 'Song: It\'s a Long Way to the Top by AC/DC',
        options: [
          'rock \'n\' roll',
          'play guitar',
          'get famous',
          'be a star'
        ],
        correctIndex: 0,
        explanation: 'AC/DC featured bagpipes in this hard rock classic from 1975.'
      }
    ]
  },
  {
    id: 'whats-the-artist-rnb-soul',
    title: 'What\'s The Artist? Smooth R&B & Soul',
    subtitle: 'Vibes, Vocals & Soul',
    description: 'Match lush lyrics from SZA, Frank Ocean, Alicia Keys, Usher, and Chris Brown to the right icon.',
    quizType: 'whats_the_artist',
    genre: 'rnb',
    difficulty: 'medium',
    iconName: 'Disc',
    totalQuestions: 5,
    playsCount: 14200,
    questions: [
      {
        id: 'rnb-1',
        questionText: '"I might kill my ex, not the best idea, His new girlfriend\'s next, how\'d I get here?"',
        songContext: 'Hit Song: Kill Bill',
        options: ['SZA', 'Jhené Aiko', 'Summer Walker', 'H.E.R.'],
        correctIndex: 0,
        explanation: 'SZA topped charts worldwide with her smash hit Kill Bill from the SOS album.'
      },
      {
        id: 'rnb-2',
        questionText: '"A tornado flew around my room before you came, Excuse the mess it made..."',
        songContext: 'Hit Song: Thinkin Bout You',
        options: ['Frank Ocean', 'Daniel Caesar', 'Giveon', 'Brent Faiyaz'],
        correctIndex: 0,
        explanation: 'Frank Ocean\'s Channel Orange lead single became an instant classic in 2012.'
      },
      {
        id: 'rnb-3',
        questionText: '"Peace sign in the air, yeah! These are my confessions..."',
        songContext: 'Hit Song: Confessions Part II',
        options: ['Usher', 'Ne-Yo', 'Mario', 'Trey Songz'],
        correctIndex: 0,
        explanation: 'Usher\'s 2004 Confessions album sold over 15 million copies globally.'
      },
      {
        id: 'rnb-4',
        questionText: '"Some people want it all, But I don\'t want nothing at all, If it ain\'t you baby..."',
        songContext: 'Hit Song: If I Ain\'t Got You',
        options: ['Alicia Keys', 'Beyoncé', 'Mary J. Blige', 'Erykah Badu'],
        correctIndex: 0,
        explanation: 'Alicia Keys won a Grammy for this timeless R&B piano ballad.'
      },
      {
        id: 'rnb-5',
        questionText: '"Under the influence, your body is a wonderland..." Wait, "You got me workin\' overtime, 24/7 on my mind..."',
        songContext: 'Hit Song: Under The Influence',
        options: ['Chris Brown', 'Tory Lanez', 'Ty Dolla $ign', 'Jeremih'],
        correctIndex: 0,
        explanation: 'Chris Brown\'s Under The Influence saw a massive global resurgence in 2022.'
      }
    ]
  },
  {
    id: 'finish-nostalgia-90s-2000s',
    title: 'Finish The Song: 90s & 2000s Nostalgia',
    subtitle: 'Throwback Throwdowns',
    description: 'Take a trip down memory lane with Britney, Outkast, TLC, Backstreet Boys, and Destiny\'s Child.',
    quizType: 'finish_the_song',
    genre: 'nostalgia',
    difficulty: 'easy',
    iconName: 'Radio',
    totalQuestions: 5,
    playsCount: 22100,
    questions: [
      {
        id: 'nos-1',
        questionText: '"Hit me baby one more time... Oh baby, baby, how was I supposed to know _____"',
        songContext: 'Song: ...Baby One More Time by Britney Spears',
        options: [
          'That something wasn\'t right here',
          'That you would leave me lone',
          'That love was gonna hurt',
          'That I was in the wrong'
        ],
        correctIndex: 0,
        explanation: 'Britney Spears revolutionized pop music in 1998 with Max Martin\'s iconic composition.'
      },
      {
        id: 'nos-2',
        questionText: '"Yeah, I\'m sorry Ms. Jackson, Ooh! I am for real, Never meant to make your daughter cry, ____"',
        songContext: 'Song: Ms. Jackson by Outkast',
        options: [
          'I apologize a trillion times',
          'I apologize a million times',
          'I know I let you down inside',
          'I promise I will make it right'
        ],
        correctIndex: 0,
        explanation: 'Outkast won Grammy Awards for Ms. Jackson from their Stankonia masterpiece album.'
      },
      {
        id: 'nos-3',
        questionText: '"Don\'t go chasing waterfalls, Please stick to the _____"',
        songContext: 'Song: Waterfalls by TLC',
        options: [
          'rivers and the lakes that you\'re used to',
          'paths and the streets that you know best',
          'ocean and the waves that keep rollin\'',
          'sunlight and the dreams in your heart'
        ],
        correctIndex: 0,
        explanation: 'TLC\'s Waterfalls spent 7 weeks at #1 on the Billboard Hot 100 in 1995.'
      },
      {
        id: 'nos-4',
        questionText: '"Tell me why! Ain\'t nothin\' but a heartache, Tell me why! _____"',
        songContext: 'Song: I Want It That Way by Backstreet Boys',
        options: [
          'Ain\'t nothin\' but a mistake',
          'I never wanna hear you say',
          'Which one of us is to blame',
          'My heart is breaks in two'
        ],
        correctIndex: 0,
        explanation: 'Backstreet Boys scored one of the biggest boy band hits in music history in 1999.'
      },
      {
        id: 'nos-5',
        questionText: '"Say my name, say my name! If nobody is around you, say _____"',
        songContext: 'Song: Say My Name by Destiny\'s Child',
        options: [
          'baby I love you',
          'you\'re actin\' kinda shady',
          'what\'s on your mind',
          'where you wanna go'
        ],
        correctIndex: 0,
        explanation: 'Beyoncé and Destiny\'s Child dominated radio with this R&B chart-topper in 2000.'
      }
    ]
  },
  {
    id: 'whats-the-artist-edm-bangers',
    title: 'What\'s The Artist? EDM & Festival Bangers',
    subtitle: 'Electronic Music Legends',
    description: 'Identify the electronic producers behind Daft Punk, Avicii, Calvin Harris, Skrillex, and Marshmello hits.',
    quizType: 'whats_the_artist',
    genre: 'edm',
    difficulty: 'medium',
    iconName: 'Zap',
    totalQuestions: 5,
    playsCount: 11900,
    questions: [
      {
        id: 'edm-1',
        questionText: '"Work it harder, make it better, do it faster, makes us stronger..."',
        songContext: 'Track: Harder, Better, Faster, Stronger',
        options: ['Daft Punk', 'Justice', 'Deadmau5', 'The Chemical Brothers'],
        correctIndex: 0,
        explanation: 'Daft Punk\'s 2001 electronic track was later sampled by Kanye West on Stronger.'
      },
      {
        id: 'edm-2',
        questionText: '"So wake me up when it\'s all over, When I\'m wiser and I\'m older..."',
        songContext: 'Track: Wake Me Up',
        options: ['Avicii', 'Kygo', 'Swedish House Mafia', 'Martin Garrix'],
        correctIndex: 0,
        explanation: 'Avicii blended EDM and country acoustics to create a record-breaking global hit in 2013.'
      },
      {
        id: 'edm-3',
        questionText: '"We found love in a hopeless place..."',
        songContext: 'Track: We Found Love (feat. Rihanna)',
        options: ['Calvin Harris', 'David Guetta', 'Zedd', 'Tiësto'],
        correctIndex: 0,
        explanation: 'Scottish producer Calvin Harris teamed up with Rihanna for 10 weeks at #1.'
      },
      {
        id: 'edm-4',
        questionText: '"Bangarang! Feels like I\'m on fire..."',
        songContext: 'Track: Bangarang',
        options: ['Skrillex', 'Diplo', 'Bassnectar', 'Knife Party'],
        correctIndex: 0,
        explanation: 'Skrillex defined the dubstep sound of the early 2010s with Bangarang.'
      },
      {
        id: 'edm-5',
        questionText: '"I\'m so alone, Nothing feels like home, I\'m so alone..."',
        songContext: 'Track: Alone',
        options: ['Marshmello', 'Alan Walker', 'Chainsmokers', 'DJ Snake'],
        correctIndex: 0,
        explanation: 'Marshmello achieved multi-platinum success with his signature helmet and uplifting synth hooks.'
      }
    ]
  },
  {
    id: 'finish-country-staples',
    title: 'Finish The Song: Country & Folk Hits',
    subtitle: 'Acoustics & Country Stories',
    description: 'Test your country music knowledge on Zach Bryan, Chris Stapleton, Luke Combs, and Morgan Wallen.',
    quizType: 'finish_the_song',
    genre: 'country',
    difficulty: 'medium',
    iconName: 'Guitar',
    totalQuestions: 5,
    playsCount: 9800,
    questions: [
      {
        id: 'c-1',
        questionText: '"You\'re as smooth as Tennessee whiskey, You\'re as sweet as _____"',
        songContext: 'Song: Tennessee Whiskey by Chris Stapleton',
        options: [
          'strawberry wine',
          'sweet summer tea',
          'honey on ice',
          'golden sunshine'
        ],
        correctIndex: 0,
        explanation: 'Chris Stapleton\'s soulful rendition of Tennessee Whiskey became an instant classic.'
      },
      {
        id: 'c-2',
        questionText: '"Something in the orange tells me we\'re not done, _____"',
        songContext: 'Song: Something in the Orange by Zach Bryan',
        options: [
          'To you I\'m just a man, to me you\'re all I am',
          'And I miss you like hell',
          'When the sun goes down tonight',
          'I\'m just a foolish boy'
        ],
        correctIndex: 0,
        explanation: 'Zach Bryan\'s breakthrough hit spent over 65 weeks on the Billboard Hot 100.'
      },
      {
        id: 'c-3',
        questionText: '"Country roads, take me home, to the place _____"',
        songContext: 'Song: Take Me Home, Country Roads by John Denver',
        options: [
          'I belong, West Virginia',
          'where I grew, mountain mama',
          'of my youth, river waters',
          'I call home, country roads'
        ],
        correctIndex: 0,
        explanation: 'John Denver\'s 1971 classic is officially an official state song of West Virginia.'
      },
      {
        id: 'c-4',
        questionText: '"Fast car... You got a fast car, Is it fast enough so we can _____"',
        songContext: 'Song: Fast Car by Luke Combs (orig. Tracy Chapman)',
        options: [
          'fly away? We gotta make a decision',
          'drive away? Tonight we ride',
          'get out of here? We have no time',
          'start again? From the ground up'
        ],
        correctIndex: 0,
        explanation: 'Luke Combs\' 2023 cover of Tracy Chapman\'s Fast Car won Song of the Year at the CMA Awards.'
      },
      {
        id: 'c-5',
        questionText: '"Jolene, Jolene, Jolene, Jolene! I\'m begging of you please ____"',
        songContext: 'Song: Jolene by Dolly Parton',
        options: [
          'don\'t take my man',
          'don\'t break his heart',
          'don\'t walk away',
          'hear my prayer'
        ],
        correctIndex: 0,
        explanation: 'Dolly Parton released Jolene in 1973, and it remains one of country music\'s most covered songs.'
      }
    ]
  },
  {
    id: 'audio-real-chart-hits-1',
    title: 'Real Song Audio Challenge: Top Chart Hits',
    subtitle: '100% Real Audio Song Clips',
    description: 'Listen to actual 30-second master audio clips of chart-topping songs! Guess the song title before the timer runs out.',
    quizType: 'audio_snip',
    genre: 'pop',
    difficulty: 'medium',
    iconName: 'Radio',
    totalQuestions: 5,
    featured: true,
    playsCount: 52400,
    questions: [
      {
        id: 'real-aud-1',
        questionText: '🎧 Listen to this 30-second audio clip! Which chart-topping song is playing?',
        songContext: 'Artist: The Weeknd | Album: After Hours',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/bf/7a/e9/bf7ae988-c4ef-c882-7201-9276d1e442d7/mzaf_11303868218155981775.plus.aac.p.m4a',
        options: [
          'Blinding Lights (The Weeknd)',
          'Starboy (The Weeknd)',
          'Save Your Tears (The Weeknd)',
          'Can\'t Feel My Face (The Weeknd)'
        ],
        correctIndex: 0,
        explanation: 'Blinding Lights by The Weeknd was released in 2019 and became the longest-charting song in Billboard Hot 100 history.'
      },
      {
        id: 'real-aud-2',
        questionText: '🎧 Listen to this iconic funk/pop 30-second audio clip! Name the hit song:',
        songContext: 'Artist: Mark Ronson ft. Bruno Mars',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/ef/a0/62/efa06282-53a5-1178-59aa-fbefb2169b1a/mzaf_16155983804825595964.plus.aac.p.m4a',
        options: [
          'Uptown Funk',
          '24K Magic',
          'Treasure',
          'Locked Out of Heaven'
        ],
        correctIndex: 0,
        explanation: 'Uptown Funk spent 14 consecutive weeks at number one on the Billboard Hot 100 in 2015 and won Record of the Year.'
      },
      {
        id: 'real-aud-3',
        questionText: '🎧 Listen to this upbeat disco-pop audio clip! Which song is this?',
        songContext: 'Artist: Dua Lipa | Album: Future Nostalgia',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/92/79/1b/92791bfd-c403-10e0-3e28-564531be3099/mzaf_17208942368096238690.plus.aac.p.m4a',
        options: [
          'Levitating',
          'Don\'t Start Now',
          'Physical',
          'Break My Heart'
        ],
        correctIndex: 0,
        explanation: 'Levitating by Dua Lipa was the #1 song of the year on the 2021 Billboard Year-End Hot 100.'
      },
      {
        id: 'real-aud-4',
        questionText: '🎧 Listen to this bassline audio clip! Which global hit song is playing?',
        songContext: 'Artist: Billie Eilish | Album: When We All Fall Asleep, Where Do We Go?',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/31/3f/8a/313f8a02-e25f-21bc-bcbe-bf0d0dcfcd1d/mzaf_14490130635183351911.plus.aac.p.m4a',
        options: [
          'Bad Guy',
          'Ocean Eyes',
          'Everything I Wanted',
          'Therefore I Am'
        ],
        correctIndex: 0,
        explanation: 'Bad Guy by Billie Eilish won Record of the Year and Song of the Year at the 62nd Annual Grammy Awards.'
      },
      {
        id: 'real-aud-5',
        questionText: '🎧 Listen to this folk-pop anthem audio clip! Identify the track:',
        songContext: 'Artist: OneRepublic | Album: Native',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/6e/0f/52/6e0f5263-d0ea-e054-d3d6-44439009ddb9/mzaf_10528227653603417742.plus.aac.p.m4a',
        options: [
          'Counting Stars',
          'Apologize',
          'Good Life',
          'Secrets'
        ],
        correctIndex: 0,
        explanation: 'Counting Stars by OneRepublic reached #1 in over 20 countries and has over 4 billion YouTube views.'
      }
    ]
  },
  {
    id: 'audio-snip-classics-1',
    title: 'Audio Clip Challenge: Name That Melody',
    subtitle: 'Listen to Real Audio Snippets',
    description: 'Press play to hear the actual audio clip! Identify the famous song, instrument, or track snippet before the timer runs out.',
    quizType: 'audio_snip',
    genre: 'all',
    difficulty: 'medium',
    iconName: 'Volume2',
    totalQuestions: 5,
    featured: true,
    playsCount: 31200,
    questions: [
      {
        id: 'aud-1',
        questionText: '🎧 Listen to this classical piano audio clip. What legendary masterpiece is playing?',
        songContext: 'Song: Classical Piano Masterpiece',
        audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Ludwig_van_Beethoven_-_Moonlight_Sonata_1st_movement.ogg',
        options: [
          'Moonlight Sonata (Beethoven)',
          'Für Elise (Beethoven)',
          'Clair de Lune (Debussy)',
          'Nocturne Op. 9 No. 2 (Chopin)'
        ],
        correctIndex: 0,
        explanation: 'Beethoven composed Piano Sonata No. 14 in C-sharp minor "Moonlight Sonata" in 1801.'
      },
      {
        id: 'aud-2',
        questionText: '🎧 Listen to this orchestra audio clip. What iconic piece is playing?',
        songContext: 'Song: Orchestral Masterpiece',
        audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Mozart_-_Eine_kleine_Nachtmusik_-_1._Allegro.ogg',
        options: [
          'Eine kleine Nachtmusik (Mozart)',
          'The Four Seasons (Vivaldi)',
          'Symphony No. 5 (Beethoven)',
          'Ride of the Valkyries (Wagner)'
        ],
        correctIndex: 0,
        explanation: 'Mozart wrote "Eine kleine Nachtmusik" (A Little Night Music) in 1787.'
      },
      {
        id: 'aud-3',
        questionText: '🎧 Listen to this acoustic jazz audio snippet. Which rhythm style is highlighted?',
        songContext: 'Song: Classic Acoustic Jazz Grooves',
        audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Scott_Joplin_-_Maple_Leaf_Rag_%28piano_roll%29.ogg',
        options: [
          'Ragtime Piano (Scott Joplin)',
          'Bossa Nova Guitar',
          'Delta Blues Harmonica',
          'BeBop Saxophone'
        ],
        correctIndex: 0,
        explanation: 'Scott Joplin composed Maple Leaf Rag in 1899, establishing ragtime as a distinctly American genre.'
      },
      {
        id: 'aud-4',
        questionText: '🎧 Listen to this violin orchestra passage. Name the famous composition:',
        songContext: 'Song: Violin Concerto Classic',
        audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Vivaldi_Spring_mvt_1_Allegro_-_John_Harrison_violin.ogg',
        options: [
          'Spring from The Four Seasons (Vivaldi)',
          'Canon in D (Pachelbel)',
          'Air on the G String (Bach)',
          'Flight of the Bumblebee (Rimsky-Korsakov)'
        ],
        correctIndex: 0,
        explanation: 'Antonio Vivaldi composed The Four Seasons in 1723. "Spring" is one of the most recognized baroque violin concertos.'
      },
      {
        id: 'aud-5',
        questionText: '🎧 Listen to this acoustic guitar fingerpicking loop. What genre does it represent?',
        songContext: 'Song: Acoustic Folk Prelude',
        audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Folk_guitar_rhythm.ogg',
        options: [
          'Acoustic Folk / Country Picking',
          'Heavy Metal Distorted Riff',
          'Synthesizer Synthwave',
          'Reggae Dub Bassline'
        ],
        correctIndex: 0,
        explanation: 'Fingerstyle acoustic guitar picking forms the heartbeat of folk, bluegrass, and acoustic country music.'
      }
    ]
  }
];
