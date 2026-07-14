import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchRemoteChallenge } from '../lib/api';
import {
  acceptChallenge,
  challengeShareUrl,
  decodeChallengePayload,
  getChallenge,
  importChallengeFromPayload,
  upsertChallenge,
} from '../lib/storage';
import type { Challenge } from '../lib/types';
import { useAppStore } from '../store';

export function ChallengePage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const user = useAppStore((s) => s.user)!;
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const payload = decodeChallengePayload(params.get('p'));
      if (payload) importChallengeFromPayload(payload);
      let local = getChallenge(id);
      if (!local) {
        const remote = await fetchRemoteChallenge(id);
        if (remote) {
          upsertChallenge(remote);
          local = remote;
        }
      }
      if (!cancelled) setChallenge(local);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, params]);

  const remaining = useMemo(() => {
    if (!challenge) return '';
    const ms = +new Date(challenge.deadlineAt) - Date.now();
    if (ms <= 0) return '만료';
    const h = Math.floor(ms / 3600_000);
    const m = Math.floor((ms % 3600_000) / 60_000);
    return `${h}시간 ${m}분`;
  }, [challenge]);

  if (!challenge) {
    return (
      <div className="page">
        <h1 className="page-title">도전장을 찾을 수 없어요</h1>
        <p className="meta">링크가 올바르는지 확인해 주세요.</p>
        <Link to="/" className="cta-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
          홈
        </Link>
      </div>
    );
  }

  const isFrom = challenge.fromSoftUserId === user.id;
  const canAccept = !isFrom && challenge.status === 'open';
  const canPlay =
    challenge.status !== 'expired' &&
    challenge.status !== 'completed' &&
    (isFrom || challenge.toSoftUserId === user.id || canAccept);

  const onAccept = () => {
    const next = acceptChallenge(challenge.id, user.id, user.nickname);
    if (next) setChallenge(next);
  };

  const onShare = async () => {
    const url = challengeShareUrl(challenge);
    if (navigator.share) {
      try {
        await navigator.share({
          title: '오스완 도전장',
          text: `${challenge.fromNickname} · ${challenge.targetReps}개 클리어 도전. 너도 오스완?`,
          url,
        });
        return;
      } catch {
        /* */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fromDone = challenge.fromCleared;
  const toDone = challenge.toCleared;

  return (
    <div className="page">
      <p className="meta" style={{ letterSpacing: '0.1em' }}>
        CHALLENGE
      </p>
      <h1 className="page-title">오스완 도전</h1>
      <p className="meta" style={{ fontSize: 15, lineHeight: 1.5 }}>
        {challenge.fromNickname}님이 <strong style={{ color: '#fff' }}>{challenge.targetReps}개</strong> 도전장을
        보냈어요. 목표 채우면 오스완.
      </p>

      <div
        className="card"
        style={{
          marginTop: 28,
          padding: 28,
          textAlign: 'center',
          background: 'linear-gradient(160deg,#1e1e1e,#151515)',
        }}
      >
        <div className="hero-num" style={{ fontSize: 72 }}>
          {challenge.targetReps}
        </div>
        <div className="meta" style={{ marginTop: 8 }}>
          목표 개수 · {remaining} 남음
        </div>
        <div style={{ marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          {challenge.fromNickname} {fromDone === true ? '✓' : fromDone === false ? '✗' : '·'}{' '}
          {challenge.toNickname
            ? `↔ ${challenge.toNickname} ${toDone === true ? '✓' : toDone === false ? '✗' : '·'}`
            : '↔ 상대 대기'}
        </div>
        <div className="meta" style={{ marginTop: 12 }}>
          규칙 {challenge.ruleVersion} · 갯수 달성
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
        {canAccept && (
          <button className="cta-primary" onClick={onAccept}>
            도전 수락
          </button>
        )}
        {canPlay && (isFrom || challenge.toSoftUserId === user.id) && (
          <button
            className="cta-primary"
            onClick={() =>
              navigate(`/session?target=${challenge.targetReps}&challenge=${challenge.id}`)
            }
          >
            스쿼트 시작
          </button>
        )}
        {isFrom && (
          <button className="cta-secondary" onClick={onShare}>
            {copied ? '링크 복사됨' : '카톡·메신저로 보내기'}
          </button>
        )}
        <Link to="/challenges" className="cta-secondary" style={{ textAlign: 'center' }}>
          도전 목록
        </Link>
      </div>
    </div>
  );
}
