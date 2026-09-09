import { authenticatedFetch } from '../../../../src/services/authService';
import { useCoinAction } from '../../../../src/useCoinAction';
import React, { useState } from 'react';
import { BattleState, UserProfile } from '../../types';
import { backendApiUrl } from '../../services/backend';
import { Award, Trophy, Sparkles, ThumbsUp, Scale, RefreshCw } from 'lucide-react';

interface Props {
  battle: BattleState;
  currentUser: UserProfile | null;
  onVote: (voteForPlayerId: string) => void;
}

export const JudgePanel: React.FC<Props> = ({ battle, currentUser, onVote }) => {
  const judgeCoin = useCoinAction('/api/gemini/battle-judge');
  const [judgeData, setJudgeData] = useState<any>(battle.judgeScore || null);
  const [isLoadingJudge, setIsLoadingJudge] = useState(false);

  const hasVoted = currentUser ? battle.spectatorVotes.voterIds.includes(currentUser.id) : false;

  const triggerAiJudge = async () => {
    setIsLoadingJudge(true);
    try {
      const p1Verses = battle.verses.filter((v) => v.authorId === battle.player1.id).map((v) => v.text);
      const p2Verses = battle.verses.filter((v) => v.authorId === battle.player2.id).map((v) => v.text);

      const res = await authenticatedFetch(backendApiUrl('/api/gemini/battle-judge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Name: battle.player1.nickname,
          player2Name: battle.player2.nickname,
          player1Verses: p1Verses.length > 0 ? p1Verses : ['Dropped heavy rhythmic cadence.'],
          player2Verses: p2Verses.length > 0 ? p2Verses : ['Answered with double time bars.'],
          tier: battle.tier,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setJudgeData(data.evaluation);
      }
    } catch (e) {
      console.error('Failed to trigger AI judge:', e);
    } finally {
      setIsLoadingJudge(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-amber-400" />
          <h3 className="font-bold text-white text-base">Battle Judge & Spectator Panel</h3>
        </div>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
          {battle.tier} Tier
        </span>
      </div>

      {/* Spectator Voting Section */}
      <div className="mb-6 rounded-xl bg-slate-950 p-4 border border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Crowd Voting</span>
          <span className="text-amber-400 font-bold">
            {battle.spectatorVotes.p1Votes + battle.spectatorVotes.p2Votes} Votes Total
          </span>
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={hasVoted}
            onClick={() => onVote(battle.player1.id)}
            className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${hasVoted
                ? 'border-slate-800 bg-slate-900 text-slate-400 cursor-not-allowed'
                : 'border-amber-500/40 bg-slate-900 hover:border-amber-500 hover:bg-amber-500/10 text-white'
              }`}
          >
            <div>
              <p className="font-bold text-sm text-amber-300">{battle.player1.nickname}</p>
              <p className="text-xs text-slate-400">{battle.spectatorVotes.p1Votes} Crowd Votes</p>
            </div>
            <ThumbsUp className="h-5 w-5 text-amber-400" />
          </button>

          <button
            disabled={hasVoted}
            onClick={() => onVote(battle.player2.id)}
            className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${hasVoted
                ? 'border-slate-800 bg-slate-900 text-slate-400 cursor-not-allowed'
                : 'border-amber-500/40 bg-slate-900 hover:border-amber-500 hover:bg-amber-500/10 text-white'
              }`}
          >
            <div>
              <p className="font-bold text-sm text-amber-300">{battle.player2.nickname}</p>
              <p className="text-xs text-slate-400">{battle.spectatorVotes.p2Votes} Crowd Votes</p>
            </div>
            <ThumbsUp className="h-5 w-5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Gemini AI Master Judge Analysis */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            AI Master Judge Verdict
          </h4>
          <button
            onClick={triggerAiJudge}
            disabled={isLoadingJudge || judgeCoin.insufficient}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition"
          >
            {isLoadingJudge ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Judging...
              </>
            ) : (
              <>
                <Award className="h-3.5 w-3.5" />
                {judgeCoin.insufficient ? judgeCoin.label : `${judgeData ? 'Re-Evaluate Verses' : 'Run Master Evaluation'} · ${judgeCoin.action?.cost ?? 5} BC`}
              </>
            )}
          </button>
        </div>

        {judgeData ? (
          <div className="space-y-4 rounded-xl bg-slate-950 p-4 border border-amber-500/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-bold text-white">Winner:</span>
                <span className="text-sm font-extrabold text-amber-300">{judgeData.winnerName}</span>
              </div>
            </div>

            {/* Score breakdown comparison */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="font-bold text-amber-400">{battle.player1.nickname}</p>
                <div>
                  <p className="text-[10px] text-slate-400">Rhyme & Flow: {judgeData.p1RhymeFlow}/10</p>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${(judgeData.p1RhymeFlow / 10) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Punchlines: {judgeData.p1Punchlines || 8}/10</p>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${((judgeData.p1Punchlines || 8) / 10) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-amber-400">{battle.player2.nickname}</p>
                <div>
                  <p className="text-[10px] text-slate-400">Rhyme & Flow: {judgeData.p2RhymeFlow}/10</p>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${(judgeData.p2RhymeFlow / 10) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Punchlines: {judgeData.p2Punchlines || 8}/10</p>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${((judgeData.p2Punchlines || 8) / 10) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-900 p-3 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-400 block mb-1">Master Judge Critique:</span>
              {judgeData.judgeFeedback}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
            Submit verses in the battle ring above, then click 'Run Master Evaluation' for a detailed Gemini AI breakdown of rhyme schemes, flow cadence, and punchlines!
          </p>
        )}
      </div>
    </div>
  );
};
