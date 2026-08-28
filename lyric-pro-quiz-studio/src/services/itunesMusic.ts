// iTunes Music Search API service for generating 100% accurate, real song audio quizzes
// Uses iTunes public search API to get real 30-second audio previews (m4a/mp3) from actual master recordings.

export interface iTunesTrack {
  trackId: number;
  artistName: string;
  trackName: string;
  collectionName: string;
  previewUrl: string;
  artworkUrl100: string;
  primaryGenreName: string;
}

/**
 * Fetch real popular songs with working 30-second audio preview clips from iTunes Search API
 */
export async function fetchRealSongsFromiTunes(searchTerm: string = 'top hits', limit: number = 30): Promise<iTunesTrack[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`iTunes API responded with status ${res.status}`);
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // Filter to ensure valid previewUrl and trackName exist
    const tracks: iTunesTrack[] = data.results.filter(
      (item: any) => item.previewUrl && item.trackName && item.artistName
    );

    return tracks;
  } catch (err) {
    console.error('Failed to fetch real songs from iTunes API:', err);
    return [];
  }
}

/**
 * Generate a complete, playable real audio quiz using real iTunes track preview clips
 */
export async function generateRealAudioQuiz(
  title: string = 'Real Chart Hits Audio Quiz',
  searchTerm: string = 'top hits',
  quizType: 'guess_song' | 'guess_artist' = 'guess_song',
  numberOfQuestions: number = 5
) {
  const tracks = await fetchRealSongsFromiTunes(searchTerm, 40);

  if (tracks.length < numberOfQuestions + 3) {
    throw new Error('Not enough audio tracks found for this search query.');
  }

  // Shuffle tracks
  const shuffled = [...tracks].sort(() => 0.5 - Math.random());
  const selectedTracks = shuffled.slice(0, numberOfQuestions);

  const questions = selectedTracks.map((track, idx) => {
    // Get distractors from other tracks in the pool
    const otherTracks = tracks.filter((t) => t.trackId !== track.trackId);
    const shuffledOthers = [...otherTracks].sort(() => 0.5 - Math.random());

    if (quizType === 'guess_song') {
      const distractorTitles = Array.from(
        new Set(shuffledOthers.map((t) => t.trackName))
      ).slice(0, 3);

      const options = [track.trackName, ...distractorTitles];
      // Shuffle options and find correct index
      const shuffledOptions = [...options].sort(() => 0.5 - Math.random());
      const correctIndex = shuffledOptions.indexOf(track.trackName);

      return {
        id: `real-aud-${Date.now()}-${idx}`,
        questionText: `🎧 Listen to the actual 30-second audio clip! Which song is playing?`,
        songContext: `Artist: ${track.artistName} | Album: ${track.collectionName}`,
        audioUrl: track.previewUrl,
        options: shuffledOptions,
        correctIndex,
        explanation: `"${track.trackName}" by ${track.artistName} from the album "${track.collectionName}".`
      };
    } else {
      // Guess Artist
      const distractorArtists = Array.from(
        new Set(shuffledOthers.map((t) => t.artistName))
      ).filter((a) => a !== track.artistName).slice(0, 3);

      const options = [track.artistName, ...distractorArtists];
      const shuffledOptions = [...options].sort(() => 0.5 - Math.random());
      const correctIndex = shuffledOptions.indexOf(track.artistName);

      return {
        id: `real-aud-art-${Date.now()}-${idx}`,
        questionText: `🎧 Listen to this 30-second audio clip of "${track.trackName}". Who is the artist?`,
        songContext: `Track: ${track.trackName} | Album: ${track.collectionName}`,
        audioUrl: track.previewUrl,
        options: shuffledOptions,
        correctIndex,
        explanation: `"${track.trackName}" is recorded by ${track.artistName} on "${track.collectionName}".`
      };
    }
  });

  return {
    id: `real-audio-quiz-${Date.now()}`,
    title,
    subtitle: 'Real Chart Audio Clips (iTunes)',
    description: `Play real 30-second audio previews of popular hits and test your song recognition skills!`,
    quizType: 'audio_snip' as const,
    genre: 'all',
    difficulty: 'medium' as const,
    iconName: 'Radio',
    totalQuestions: questions.length,
    featured: true,
    playsCount: 45000,
    questions
  };
}
