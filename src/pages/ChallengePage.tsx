import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BrandHeader } from '../components/BrandMark';
import { ChallengeInviteCard } from '../components/ChallengeInviteCard';
import { ShareSheet } from '../components/ShareSheet';
import { fetchRemoteChallenge } from '../lib/api';
import {
  acceptChallenge,
  challengeFromCompact,
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
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // legacy long ?p= payload still supported
      const payload = decodeChallengePayload(params.get('p'));
      if (payload) importChallengeFromPayload(payload);

      // compact ?n=&r=&f= (clean share links)
      const compact = challengeFromCompact(id, {
        n: params.get('n'),
        r: params.get('r'),
        f: params.get('f'),
        dl: params.get('dl'),
      });
      if (compact && !getChallenge(id)) importChallengeFromPayload(compact);

      let local = getChallenge(id);
      if (!local) {
        const remote = await fetchRemoteChallenge(id);
        if (remote) {
          upsertChallenge(remote);
          local = remote;
        }
      }
      if (!local && compact) local = compact;
      if (!cancelled) setChallenge(local);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, params]);

  useEffect(() => {
    if (!challenge) return;
    document.title = `${challenge.fromNickname}의 ${challenge.targetReps}개 도전장 · 오스완`;
    return () => {
      document.title = '오스완';
    };
  }, [challenge]);

  const remaining = useMemo(() => {
    if (!challenge) return '';
    const ms = +new Date(challenge.deadlineAt) - Date.now();
    if (ms <= 0) return '만료';
    const h = Math.floor(ms / 3600_000);
    const m = Math.floor((ms % 3600_000) / 60_000);
    return `${h}시간 ${m}분 남음`;
  }, [challenge]);

  if (!challenge) {
    return (
      <div className="page">
        <BrandHeader size="sm" />
        <h1 className="page-title" style={{ marginTop: 24 }}>
          도전장을 찾을 수 없어요
        </h1>
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

  const onShare = () => setSheetOpen(true);

  return (
    <div className="page">
      <BrandHeader size="sm" />
      <p className="meta" style={{ letterSpacing: '0.1em', marginTop: 20 }}>
        CHALLENGE
      </p>
      <h1 className="page-title" style={{ marginTop: 6 }}>
        도전장
      </h1>
      <p className="meta" style={{ fontSize: 15, lineHeight: 1.5 }}>
        {challenge.fromNickname}님이 <strong style={{ color: '#fff' }}>{challenge.targetReps}개</strong>에
        도전합니다. 목표 채우면 오스완.
      </p>

      <ChallengeInviteCard challenge={challenge} remaining={remaining} />

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
            카톡·메신저로 보내기
          </button>
        )}
        <Link to="/challenges" className="cta-secondary" style={{ textAlign: 'center' }}>
          도전 목록
        </Link>
      </div>

      <ShareSheet open={sheetOpen} challenge={challenge} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
