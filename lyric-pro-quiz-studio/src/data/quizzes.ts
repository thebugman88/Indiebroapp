import { Quiz, Question } from '../types';

const q = (id: string, questionText: string, correct: string, wrong: string[], explanation: string): Question => ({ id, questionText, options: [correct, ...wrong], correctIndex: 0, explanation });

const banks: Quiz[] = [
  { id:'rock-legends', title:'Rock Legends', subtitle:'Bands, albums & icons', description:'A quick tour through landmark rock artists, records, and instruments.', quizType:'rock_legends', genre:'rock', difficulty:'medium', iconName:'Guitar', totalQuestions:5, featured:true, questions:[
    q('rock-1','Who was Led Zeppelin’s guitarist?','Jimmy Page',['Eric Clapton','Pete Townshend','Mark Knopfler'],'Jimmy Page formed Led Zeppelin and shaped its guitar-driven sound.'),
    q('rock-2','Which band released the album Rumours?','Fleetwood Mac',['The Eagles','Heart','The Cars'],'Fleetwood Mac released Rumours in 1977.'),
    q('rock-3','Brian May is best known as the guitarist for which band?','Queen',['Rush','Journey','Kiss'],'Brian May’s layered guitar work is central to Queen’s sound.'),
    q('rock-4','The Beatles formed in which English city?','Liverpool',['Manchester','London','Birmingham'],'The Beatles formed in Liverpool around 1960.'),
    q('rock-5','Which genre is most closely associated with Nirvana?','Grunge',['Progressive rock','Ska','Glam rock'],'Nirvana helped bring Seattle grunge into the mainstream.'),
    q('rock-6','Angus Young is a founding member of which band?','AC/DC',['Aerosmith','Deep Purple','Van Halen'],'Angus Young co-founded AC/DC and is known for his school-uniform stage outfit.'),
  ]},
  { id:'genre-mix', title:'Genre Mix', subtitle:'Sounds from across the map', description:'Match musical styles with their roots, instruments, and defining traits.', quizType:'genre_mix', genre:'all', difficulty:'easy', iconName:'Disc', totalQuestions:5, featured:true, questions:[
    q('genre-1','Motown Records is most closely associated with which city?','Detroit',['Memphis','Nashville','Chicago'],'Motown was founded in Detroit and became known as Hitsville U.S.A.'),
    q('genre-2','Hip-hop culture emerged in which New York City borough?','The Bronx',['Queens','Brooklyn','Manhattan'],'Hip-hop developed in the Bronx during the 1970s.'),
    q('genre-3','Reggae originated in which country?','Jamaica',['Brazil','Nigeria','Cuba'],'Reggae developed in Jamaica from ska and rocksteady.'),
    q('genre-4','Which instrument is strongly associated with bluegrass?','Banjo',['Oboe','Tuba','Synthesizer'],'The five-string banjo is a signature bluegrass instrument.'),
    q('genre-5','Disco reached its commercial peak during which decade?','The 1970s',['The 1950s','The 1990s','The 2010s'],'Disco dominated clubs and pop charts in the late 1970s.'),
    q('genre-6','Which rhythmic feel is central to much traditional funk?','A strong syncopated groove',['A free-time pulse','A waltz-only meter','No bass line'],'Funk emphasizes interlocking, syncopated rhythm parts and a strong pocket.'),
  ]},
  { id:'studio-knowledge', title:'Studio Knowledge', subtitle:'Recording & production basics', description:'Cool down with practical questions about recording, mixing, and signal flow.', quizType:'studio_knowledge', genre:'all', difficulty:'medium', iconName:'Sliders', totalQuestions:5, featured:true, questions:[
    q('studio-1','What is a compressor mainly used to control?','Dynamic range',['Song tempo','Stereo file format','Musical key'],'A compressor reduces the difference between louder and quieter signal levels.'),
    q('studio-2','What does EQ primarily adjust?','Frequency balance',['Copyright ownership','Playback speed','File naming'],'Equalization boosts or cuts selected frequency ranges.'),
    q('studio-3','What effect creates the impression of an acoustic space?','Reverb',['Distortion','Pitch correction','Noise gate'],'Reverb simulates reflections that suggest a room or other space.'),
    q('studio-4','What does a pop filter reduce during vocal recording?','Plosive bursts',['Room reflections','Headphone bleed entirely','Tempo drift'],'A pop filter softens bursts of air from sounds such as P and B.'),
    q('studio-5','What does DAW stand for?','Digital Audio Workstation',['Dynamic Analog Waveform','Direct Audio Wiring','Distributed Artist Workspace'],'A DAW is software used to record, edit, arrange, and mix audio.'),
    q('studio-6','What is gain staging?','Managing levels through the signal chain',['Choosing an album cover','Writing chord changes','Registering a release'],'Good gain staging preserves headroom and helps control noise and distortion.'),
  ]},
  { id:'theory-basics', title:'Music Theory Basics', subtitle:'Notes, rhythm & harmony', description:'Friendly fundamentals for sharpening your musical vocabulary.', quizType:'music_theory', genre:'all', difficulty:'easy', iconName:'Music', totalQuestions:5, featured:true, questions:[
    q('theory-1','How many quarter-note beats are in a bar of 4/4 time?','Four',['Two','Three','Six'],'The top number shows four beats per measure; the quarter note receives one beat.'),
    q('theory-2','What is the relative minor of C major?','A minor',['D minor','E minor','G minor'],'C major and A minor share the same key signature.'),
    q('theory-3','How many semitones make an octave in twelve-tone equal temperament?','Twelve',['Seven','Eight','Sixteen'],'An octave is divided into twelve equal semitones in common Western tuning.'),
    q('theory-4','What does BPM measure?','Tempo',['Pitch','Loudness','Stereo width'],'Beats per minute describes musical speed.'),
    q('theory-5','What does crescendo instruct a performer to do?','Gradually get louder',['Gradually slow down','Play one octave lower','Stop abruptly'],'Crescendo indicates a gradual increase in volume.'),
    q('theory-6','What is the tonic of a key?','Its home note',['Its fastest note','Its quietest chord','Its highest frequency'],'The tonic is the tonal center that feels like home.'),
  ]},
  { id:'indie-business', title:'Indie Artist Business', subtitle:'Rights, releases & royalties', description:'General-information basics for navigating releases and music revenue.', quizType:'indie_business', genre:'all', difficulty:'medium', iconName:'Briefcase', totalQuestions:5, featured:true, questions:[
    q('biz-1','What does an ISRC identify?','A specific sound recording',['A songwriter account','A concert venue','A merchandise design'],'An ISRC uniquely identifies a particular recorded track or version.'),
    q('biz-2','What is a split sheet used to document?','Songwriting ownership percentages',['Tour mileage','Streaming passwords','Microphone settings'],'A split sheet records contributors and their agreed composition shares.'),
    q('biz-3','What does a music distributor generally deliver to DSPs?','Sound recordings and release metadata',['Venue contracts','PRO membership cards','Physical instruments'],'Digital distributors send releases and metadata to services such as streaming platforms.'),
    q('biz-4','In the United States, The MLC administers which digital royalty category?','Blanket mechanical royalties',['Ticket resale fees','Merchandise tax','Studio rental income'],'The MLC administers blanket mechanical licenses for eligible U.S. digital uses.'),
    q('biz-5','What does SoundExchange primarily collect for featured artists and sound-recording owners?','Certain non-interactive digital performance royalties',['Print music royalties','Live ticket revenue','Synchronization fees'],'SoundExchange collects statutory royalties from eligible non-interactive digital services.'),
    q('biz-6','The master recording and the underlying composition are what?','Separate rights',['Always the same right','Both owned by a venue','Not copyrightable'],'A recorded song commonly involves separate sound-recording and composition copyrights.'),
  ]},
];

export const FEATURED_QUIZZES: Quiz[] = [
  ...banks,
  { id:'rapid-random', title:'Rapid-Fire Random', subtitle:'Five from the full vault', description:'A fresh cross-category mix whenever you play.', quizType:'rapid_random', genre:'all', difficulty:'expert', iconName:'Zap', totalQuestions:5, featured:true, questions:banks.flatMap((quiz) => quiz.questions) },
];
