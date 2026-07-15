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
  ensureChallengeRecipient,
  getChallenge,
  importChallengeFromPayload,
  mergeChallenge,
  upsertChallenge,
} from '../lib/storage';
import type { Challenge } from '../lib/types';
import { useAppStore } from '../store';

export function ChallengePage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const user = useAppStore((s) => s.user)!;
  const setUser = useAppStore((s) => s.setUser);
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [acceptName, setAcceptName] = useState(user.nickname);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const payload = decodeChallengePayload(params.get('p'));
      if (payload) importChallengeFromPayload(payload);

      const compact = challengeFromCompact(id, {
        n: params.get('n'),
        r: params.get('r'),
        f: params.get('f'),
        dl: params.get('dl'),
        s: params.get('s'),
      });
      if (compact) importChallengeFromPayload(compact);

      const local = getChallenge(id);
      const remote = await fetchRemoteChallenge(id);
      const merged = mergeChallenge(local, remote) ?? compact ?? local ?? remote;
      if (merged) upsertChallenge(merged, { sync: false });

      if (!cancelled) {
        setChallenge(merged);
        setLoading(false);
      }
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

  useEffect(() => {
    if (!challenge) return;
    if (user.id === challenge.fromSoftUserId) setAcceptName('');
    else setAcceptName(user.nickname);
  }, [challenge, user.id, user.nickname]);

  // Soft-poll remote so sender sees accept / clear updates
  useEffect(() => {
    if (!id) return;
    const tick = window.setInterval(() => {
      void fetchRemoteChallenge(id).then((remote) => {
        if (!remote) return;
        const local = getChallenge(id);
        const merged = mergeChallenge(local, remote);
        if (!merged) return;
        upsertChallenge(merged, { sync: false });
        setChallenge(merged);
      });
    }, 8000);
    return () => clearInterval(tick);
  }, [id]);

  const remaining = useMemo(() => {
    if (!challenge) return '';
    const ms = +new Date(challenge.deadlineAt) - Date.now();
    if (ms <= 0) return '만료';
    const h = Math.floor(ms / 3600_000);
    const m = Math.floor((ms % 3600_000) / 60_000);
    return `${h}시간 ${m}분 남음`;
  }, [challenge]);

  if (loading) {
    return (
      <div className="page">
        <BrandHeader size="sm" />
        <p className="meta" style={{ marginTop: 40 }}>
          도전장 불러오는 중…
        </p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="page">
        <BrandHeader size="sm" />
        <h1 className="page-title" style={{ marginTop: 24 }}>
          도전장을 찾을 수 없어요
        </h1>
        <p className="meta" style={{ lineHeight: 1.5 }}>
          링크가 잘렸거나 아직 동기화되지 않았을 수 있어요.
          <br />
          보낸 사람에게 다시 보내 달라고 부탁해 주세요.
        </p>
        <Link to="/" className="cta-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
          홈
        </Link>
      </div>
    );
  }

  const isFrom = challenge.fromSoftUserId === user.id;
  const isTo = challenge.toSoftUserId === user.id;
  const takenByOther = Boolean(challenge.toSoftUserId) && challenge.toSoftUserId !== user.id;
  /** Not yet bound to a recipient — always show nickname field */
  const showNameAccept =
    !isTo &&
    !takenByOther &&
    challenge.status === 'open' &&
    !challenge.toSoftUserId;
  const canPlay =
    challenge.status !== 'expired' &&
    challenge.status !== 'completed' &&
    (isFrom || isTo);
  const oneSideDone =
    (challenge.fromCleared === true && challenge.toCleared !== true) ||
    (challenge.toCleared === true && challenge.fromCleared !== true);

  const onAcceptAndStart = (startSession: boolean) => {
    setAcceptError(null);
    const name = acceptName.trim();
    if (!name) {
      setAcceptError('받는 사람 닉네임을 입력해 주세요.');
      return;
    }
    if (isFrom) {
      if (
        !window.confirm(
          `"${name}"(으)로 이 기기 Soft ID를 바꿔 도전을 수락할까요?\n보낸 사람 기록은 이 기기에서 안 보일 수 있어요.`,
        )
      ) {
        return;
      }
    }
    setBusy(true);
    const recipient = ensureChallengeRecipient(name, challenge.fromSoftUserId);
    setUser(recipient);
    const next = acceptChallenge(challenge.id, recipient.id, recipient.nickname);
    setBusy(false);
    if (!next) {
      setAcceptError('이 도전장은 수락할 수 없어요. 이미 다른 사람이 수락했을 수 있어요.');
      return;
    }
    setChallenge(next);
    if (startSession) {
      navigate(`/session?target=${next.targetReps}&challenge=${next.id}`);
    }
  };

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
        {challenge.fromNickname}님이 <strong style={{ color: '#fff' }}>{challenge.targetReps}개</strong>
        에 도전합니다. 목표 채우면 오스완.
        {challenge.stakeLabel ? (
          <>
            <br />
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              걸기: {challenge.stakeLabel}
            </span>
            <span> · 둘이 지키는 명예 약속 (결제 없음)</span>
          </>
        ) : null}
      </p>

      <ChallengeInviteCard challenge={challenge} remaining={remaining} />

      {showNameAccept && (
        <div
          className="card"
          style={{
            marginTop: 16,
            border: '2px solid rgba(200,245,74,0.45)',
            background: 'linear-gradient(160deg, #1a2210, #151515)',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18 }}>받는 사람 닉네임</div>
          <p className="meta" style={{ marginTop: 8, lineHeight: 1.5, fontSize: 13 }}>
            Soft ID 이름이에요. <strong style={{ color: 'var(--accent)' }}>{challenge.fromNickname}</strong>
            님과 기록이 따로 저장됩니다.
          </p>
          {isFrom && (
            <p className="meta" style={{ marginTop: 8, color: 'var(--warn)', fontSize: 12, lineHeight: 1.4 }}>
              지금 이 기기는 보낸 사람 계정이에요. 받는 사람 이름을 넣으면 그 이름으로 수락됩니다.
            </p>
          )}
          <label className="meta" style={{ display: 'block', marginTop: 14, fontSize: 12 }}>
            내 닉네임 (필수)
          </label>
          <input
            value={acceptName}
            onChange={(e) => setAcceptName(e.target.value)}
            placeholder="예: 민수"
            maxLength={12}
            autoComplete="nickname"
            autoFocus
            style={{
              width: '100%',
              marginTop: 8,
              padding: '16px 16px',
              borderRadius: 14,
              border: '1px solid var(--accent)',
              background: 'var(--surface-2)',
              fontSize: 18,
              fontWeight: 700,
              outline: 'none',
            }}
          />
          {acceptError && (
            <p style={{ marginTop: 10, color: 'var(--warn)', fontSize: 13, lineHeight: 1.4 }}>
              {acceptError}
            </p>
          )}
        </div>
      )}

      {isTo && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="meta">수락됨 · 내 기록</div>
          <div style={{ fontWeight: 700, marginTop: 6, color: 'var(--accent)' }}>
            {challenge.toNickname || user.nickname}
          </div>
        </div>
      )}

      {takenByOther && (
        <div
          className="card"
          style={{ marginTop: 12, border: '1px solid var(--warn)', color: 'var(--warn)' }}
        >
          이미 <strong>{challenge.toNickname}</strong>님이 수락한 도전장이에요.
        </div>
      )}

      <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
        {showNameAccept && (
          <button className="cta-primary" disabled={busy} onClick={() => onAcceptAndStart(true)}>
            {busy ? '저장 중…' : '닉네임으로 수락하고 스쿼트 시작'}
          </button>
        )}
        {isFrom && showNameAccept && (
          <button
            className="cta-secondary"
            onClick={() =>
              navigate(`/session?target=${challenge.targetReps}&challenge=${challenge.id}`)
            }
          >
            나는 보낸 사람 · 내 스쿼트 시작
          </button>
        )}
        {canPlay && !showNameAccept && (
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
          <button className="cta-secondary" onClick={() => setSheetOpen(true)}>
            {showNameAccept ? '카톡·메신저로 도전장 보내기' : '카톡·메신저로 보내기'}
          </button>
        )}
        {(isFrom || isTo) && oneSideDone && (
          <button className="cta-secondary" onClick={() => setSheetOpen(true)}>
            상대에게 독촉 · 도전장 다시 보내기
          </button>
        )}
        {challenge.status === 'completed' && (
          <button
            className="cta-secondary"
            onClick={() =>
              navigate('/', { state: { rematchTarget: challenge.targetReps } })
            }
          >
            같은 개수로 재대결 만들기
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
