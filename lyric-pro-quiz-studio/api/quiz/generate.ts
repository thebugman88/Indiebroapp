import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

/**
 * Vercel Serverless Function: POST /api/quiz/generate
 * Replaces the Express server.ts route for Vercel deployment.
 * Uses GEMINI_API_KEY from Vercel environment variables.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, quizType, difficulty, numberOfQuestions = 5 } = req.body || {};

  if (!topic || !quizType || !difficulty) {
    return res.status(400).json({ error: 'Missing required parameters: topic, quizType, or difficulty' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' });
  }

  const ai = new GoogleGenAI({ apiKey });

  const quizTypeLabel =
    quizType === 'finish_the_song' ? 'Finish the Song Lyrics'
    : quizType === 'whats_the_artist' ? "Guess What's the Artist"
    : 'Genre Music Trivia';

  const prompt = `Generate a ${difficulty} level music quiz about "${topic}".
Quiz Type: ${quizTypeLabel}.
Create ${numberOfQuestions} distinct multiple-choice questions.

Requirements:
1. For "Finish the Song": Provide a famous lyric snippet with a missing line or blank (indicated by _____), and options must be potential completing lyric lines.
2. For "What's the Artist": Provide famous lyrics or track references, and options must be 4 real artist names.
3. For Genre or general music trivia: Provide engaging, accurate music questions with 4 plausible multiple choice options.
4. Each question MUST have exactly 4 options.
5. Provide the correct option index (0, 1, 2, or 3).
6. Provide a concise 1-2 sentence explanation / interesting music trivia snippet for the answer.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Title of the custom quiz' },
            description: { type: Type.STRING, description: 'Short description of the quiz' },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionText: { type: Type.STRING, description: 'The prompt or lyric snippet' },
                  songContext: { type: Type.STRING, description: 'Song title or hint context if applicable' },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Exactly 4 answer choices' },
                  correctIndex: { type: Type.INTEGER, description: '0-based index of correct option' },
                  explanation: { type: Type.STRING, description: 'Trivia explanation of the answer' },
                },
                required: ['id', 'questionText', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['title', 'description', 'questions'],
        },
      },
    });

    const quizData = JSON.parse(response.text || '{}');
    return res.status(200).json({ success: true, quiz: quizData });
  } catch (error: any) {
    console.error('Error generating custom quiz:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate custom quiz' });
  }
}
