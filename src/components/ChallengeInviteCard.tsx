import type { Challenge } from '../lib/types';

type Props = {
  challenge: Challenge;
  remaining?: string;
};

/** Visual invite card — what recipients should feel in-app */
export function ChallengeInviteCard({ challenge, remaining }: Props) {
  const fromDone = challenge.fromCleared;
  const toDone = challenge.toCleared;

  return (
    <div
      className="card"
      style={{
        marginTop: 20,
        padding: 0,
        overflow: 'hidden',
        background: 'linear-gradient(165deg, #1c2210 0%, #151515 42%, #0f0f0f 100%)',
        border: '1px solid rgba(200,245,74,0.28)',
      }}
    >
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#0a0a0a' }}>
        <img
          src="/og-challenge.png"
          alt="오스완 도전장"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      <div
        style={{
          padding: '18px 20px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15 }}>친구에게 목표 개수 도전</div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--accent)',
            background: 'rgba(200,245,74,0.12)',
            padding: '6px 10px',
            borderRadius: 999,
          }}
        >
          CHALLENGE
        </div>
      </div>

      <div style={{ padding: '28px 20px 24px', textAlign: 'center' }}>
        <div className="meta" style={{ marginBottom: 10 }}>
          <strong style={{ color: '#fff' }}>{challenge.fromNickname}</strong>님이 보냈어요
        </div>
        <div className="hero-num" style={{ fontSize: 84, color: 'var(--accent)' }}>
          {challenge.targetReps}
        </div>
        <div className="meta" style={{ marginTop: 10, fontSize: 14 }}>
          목표 개수 · 채우면 오스완
          {remaining ? ` · ${remaining}` : ''}
        </div>

        {challenge.stakeLabel && (
          <div
            style={{
              marginTop: 16,
              display: 'inline-block',
              padding: '10px 16px',
              borderRadius: 14,
              background: 'rgba(200,245,74,0.12)',
              border: '1px solid rgba(200,245,74,0.35)',
              color: 'var(--accent)',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            걸기 · {challenge.stakeLabel}
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            justifyContent: 'center',
            gap: 18,
            fontSize: 14,
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            {challenge.fromNickname}{' '}
            {fromDone === true ? '✓' : fromDone === false ? '✗' : '·'}
          </span>
          <span style={{ color: 'var(--accent)' }}>vs</span>
          <span>
            {challenge.toNickname
              ? `${challenge.toNickname} ${toDone === true ? '✓' : toDone === false ? '✗' : '·'}`
              : '상대 대기'}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: '12px 20px 16px',
          background: 'rgba(0,0,0,0.35)',
          fontSize: 12,
          color: 'var(--text-tertiary)',
          textAlign: 'center',
        }}
      >
        규칙 {challenge.ruleVersion} · 갯수 달성
        {challenge.stakeLabel ? ' · 명예 걸기' : ''} · #오스완
      </div>
    </div>
  );
}
