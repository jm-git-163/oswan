import { setCoachPrefs, type CoachPrefs } from '../lib/coachPrefs';

type Props = {
  prefs: CoachPrefs;
  onChange: (next: CoachPrefs) => void;
  /** Compact chips for session overlay */
  variant?: 'card' | 'chips';
};

export function CoachToggles({ prefs, onChange, variant = 'card' }: Props) {
  const toggle = (key: keyof CoachPrefs) => {
    onChange(setCoachPrefs({ [key]: !prefs[key] }));
  };

  if (variant === 'chips') {
    return (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Chip active={prefs.music} onClick={() => toggle('music')} label="♪ 음악" />
        <Chip active={prefs.cheer} onClick={() => toggle('cheer')} label="응원" />
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="meta">세션 응원</div>
      <p className="meta" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.45 }}>
        기본은 켜져 있어요. 원치 않으면 눌러서 끄면 됩니다.
      </p>
      <ToggleRow
        label="동기부여 음악"
        hint="스쿼트 중 BGM · 기본 ON"
        on={prefs.music}
        onToggle={() => toggle('music')}
      />
      <ToggleRow
        label="카운트 응원"
        hint="개수마다 문구·음성 · 기본 ON"
        on={prefs.cheer}
        onToggle={() => toggle('cheer')}
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 12px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        border: active ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.2)',
        background: active ? 'rgba(200,245,74,0.2)' : 'rgba(0,0,0,0.55)',
        color: active ? 'var(--accent)' : '#fff',
      }}
    >
      {label} {active ? 'ON' : 'OFF'}
    </button>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: '100%',
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid var(--surface-3)',
        background: 'var(--surface-2)',
        textAlign: 'left',
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
        <div className="meta" style={{ fontSize: 11, marginTop: 4 }}>
          {hint}
        </div>
      </div>
      <span
        style={{
          flexShrink: 0,
          minWidth: 44,
          textAlign: 'center',
          fontWeight: 800,
          fontSize: 12,
          color: on ? 'var(--accent)' : 'var(--text-tertiary)',
        }}
      >
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
