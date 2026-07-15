type Props = {
  variant?: 'gate' | 'stance';
};

/** One-panel guide: stance → count start → down/up = +1 · music/cheer ON by default. */
export function SquatSetupGuide({ variant = 'gate' }: Props) {
  const gate = variant === 'gate';

  return (
    <div
      className="card"
      style={{
        marginBottom: gate ? 16 : 0,
        padding: gate ? 14 : 10,
        border: '1px solid rgba(200,245,74,0.35)',
        background: 'linear-gradient(165deg, #161a10, #111)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: gate ? 16 : 13 }}>카운트 이렇게 돼요</div>
        <div className="meta" style={{ fontSize: 11, color: 'var(--accent)' }}>
          한 장으로 보기
        </div>
      </div>

      <svg
        viewBox="0 0 360 600"
        width="100%"
        style={{ display: 'block', borderRadius: 12, background: '#0a0a0a' }}
        role="img"
        aria-label="① 폰 세우기 ② 점이 원 안에 들어가면 카운트 시작 ③ 내려갔다 올라오면 1개 ④ 음악·응원은 처음부터 켜짐"
      >
        <rect width="360" height="600" fill="#0a0a0a" />

        <text x="24" y="28" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ① 폰을 앞에 세우기
        </text>
        <circle cx="70" cy="68" r="11" fill="none" stroke="#fff" strokeWidth="2" />
        <path
          d="M70 80 L70 108 M70 92 L52 100 M70 92 L88 100 M70 108 L58 130 M70 108 L82 130"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="130" y="48" width="40" height="70" rx="6" fill="#1e1e1e" stroke="#C8F54A" strokeWidth="1.5" />
        <rect x="136" y="56" width="28" height="46" rx="2" fill="#2a2a2a" />
        <text x="188" y="78" fill="#a1a1a1" fontSize="11" fontFamily="sans-serif">
          전면 카메라 · 전신이 보이게
        </text>
        <text x="188" y="96" fill="#6e6e6e" fontSize="10" fontFamily="sans-serif">
          너무 가깝거나 기울이면 인식이 흔들려요
        </text>

        <text x="24" y="158" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ② 머리 점이 동그라미 안 → 카운트 시작
        </text>
        <rect x="24" y="172" width="150" height="110" rx="14" fill="#151515" stroke="#3a3a3a" strokeWidth="1.5" />
        <text x="40" y="194" fill="#6e6e6e" fontSize="10" fontFamily="sans-serif">
          아직 밖
        </text>
        <ellipse cx="99" cy="232" rx="36" ry="26" fill="none" stroke="#6e6e6e" strokeWidth="2.5" strokeDasharray="5 4" />
        <circle cx="52" cy="222" r="6" fill="#ff6b6b" />
        <text x="40" y="268" fill="#ff8a8a" fontSize="10" fontFamily="sans-serif">
          대기 중…
        </text>

        <rect x="186" y="172" width="150" height="110" rx="14" fill="#151515" stroke="rgba(200,245,74,0.45)" strokeWidth="1.5" />
        <text x="202" y="194" fill="#C8F54A" fontSize="10" fontFamily="sans-serif">
          원 안 OK
        </text>
        <ellipse cx="261" cy="232" rx="36" ry="26" fill="none" stroke="#C8F54A" strokeWidth="3" />
        <circle cx="261" cy="232" r="7" fill="#C8F54A" />
        <text x="214" y="268" fill="#C8F54A" fontSize="10" fontWeight="700" fontFamily="sans-serif">
          ▶ 카운트 시작!
        </text>

        <text x="24" y="318" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ③ 내려갔다 올라오면 +1개
        </text>
        <rect x="24" y="332" width="312" height="118" rx="14" fill="#151515" stroke="#2a2a2a" strokeWidth="1.5" />
        <circle cx="78" cy="368" r="9" fill="none" stroke="#fff" strokeWidth="2" />
        <path
          d="M78 378 L78 408 M78 390 L62 398 M78 390 L94 398 M78 408 L66 438 M78 408 L90 438"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x="56" y="438" fill="#a1a1a1" fontSize="10" fontFamily="sans-serif">
          서 있음
        </text>
        <path d="M118 400 L148 400" stroke="#C8F54A" strokeWidth="2.5" />
        <circle cx="198" cy="388" r="9" fill="none" stroke="#C8F54A" strokeWidth="2" />
        <path
          d="M198 398 L198 418 M198 406 L180 414 M198 406 L216 414 M198 418 L184 442 M198 418 L212 442"
          fill="none"
          stroke="#C8F54A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x="172" y="438" fill="#C8F54A" fontSize="10" fontFamily="sans-serif">
          내려감
        </text>
        <path d="M238 400 L268 400" stroke="#C8F54A" strokeWidth="2.5" />
        <circle cx="308" cy="368" r="9" fill="none" stroke="#fff" strokeWidth="2" />
        <path
          d="M308 378 L308 408 M308 390 L292 398 M308 390 L324 398 M308 408 L296 438 M308 408 L320 438"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="286" y="428" width="46" height="18" rx="9" fill="#C8F54A" />
        <text x="294" y="441" fill="#0a0a0a" fontSize="11" fontWeight="800" fontFamily="sans-serif">
          +1
        </text>

        <text x="24" y="488" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ④ 음악 · 응원 — 처음부터 켜짐
        </text>
        <rect x="24" y="502" width="150" height="40" rx="20" fill="rgba(200,245,74,0.18)" stroke="#C8F54A" strokeWidth="1.5" />
        <text x="48" y="528" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ♪ 음악 ON
        </text>
        <rect x="186" y="502" width="150" height="40" rx="20" fill="rgba(200,245,74,0.18)" stroke="#C8F54A" strokeWidth="1.5" />
        <text x="208" y="528" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          응원 ON
        </text>
        <text x="24" y="568" fill="#a1a1a1" fontSize="11" fontFamily="sans-serif">
          스쿼트 화면의 그 버튼을 누르면 끌 수 있어요
        </text>
        <text x="24" y="588" fill="#6e6e6e" fontSize="10" fontFamily="sans-serif">
          앉아 올라올 때 1회 · 반도 안 세요
        </text>
      </svg>

      {gate && (
        <p className="meta" style={{ margin: '12px 0 0', fontSize: 12, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--accent)' }}>점 → 원 안</strong>이면 시작,{' '}
          <strong style={{ color: 'var(--accent)' }}>앉았다 일어서면</strong> 1개. 음악·응원은{' '}
          <strong style={{ color: 'var(--accent)' }}>처음부터 켜져 있고</strong>, 「♪ 음악」「응원」
          버튼으로 끌 수 있어요.
        </p>
      )}
    </div>
  );
}
