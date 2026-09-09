import { Question, Quiz } from '../types';

export const shuffleQuestion = (question: Question, random = Math.random): Question => {
  const correctAnswer = question.options[question.correctIndex];
  const options = [...question.options];
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { ...question, options, correctIndex: options.indexOf(correctAnswer) };
};

export const buildQuizRound = (quiz: Quiz, recentIds: string[], random = Math.random): Quiz => {
  const recent = new Set(recentIds);
  const ordered = [...quiz.questions].sort((a, b) => Number(recent.has(a.id)) - Number(recent.has(b.id)) || random() - 0.5);
  const questions = ordered.slice(0, Math.min(quiz.totalQuestions, ordered.length)).map((item) => shuffleQuestion(item, random));
  return { ...quiz, questions, totalQuestions: questions.length };
};
