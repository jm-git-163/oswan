import { CHALLENGE_STAKES, type ChallengeStakeId } from '../lib/challengeStakes';

type Props = {
  value: ChallengeStakeId;
  onChange: (id: ChallengeStakeId) => void;
};

/** Honor-only bet chips for challenge invites. */
export function ChallengeStakePicker({ value, onChange }: Props) {
  return (
    <div className="surface-card stack-sm" style={{ marginBottom: 12 }}>
      <div className="meta" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
        도전 걸기 · 명예만 (결제 없음)
      </div>
      <p className="meta" style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
        받은 친구에게 “왜 해야 하는지”가 보여요. 둘이 지키는 약속이에요.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CHALLENGE_STAKES.map((s) => {
          const on = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              style={{
                border: on ? '1.5px solid var(--accent)' : '1px solid rgba(255,255,255,0.12)',
                background: on ? 'rgba(200,245,74,0.14)' : 'var(--surface-2)',
                color: on ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: 999,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
