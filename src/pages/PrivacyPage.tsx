import { Link } from 'react-router-dom';
import { BrandHeader } from '../components/BrandMark';

/** Public privacy policy — required for Play Store Data safety / listing. */
export function PrivacyPage() {
  const updated = '2026년 7월 14일';

  return (
    <div className="page" style={{ paddingBottom: 48, maxWidth: 640, margin: '0 auto' }}>
      <BrandHeader size="sm" />
      <p className="meta" style={{ letterSpacing: '0.08em', marginTop: 24 }}>
        LEGAL
      </p>
      <h1 className="page-title" style={{ marginTop: 6 }}>
        개인정보처리방침
      </h1>
      <p className="meta" style={{ marginBottom: 24 }}>
        오스완(Oswan) · 시행일 {updated}
      </p>

      <Section title="1. 개요">
        오스완(“서비스”)은 카메라로 스쿼트 개수를 세고, 친구에게 도전장을 보내는 피트니스
        웹·앱 서비스입니다. 본 방침은 서비스가 어떤 정보를 다루는지 설명합니다. 본 서비스는
        의료기기가 아니며, 진단·치료 목적이 아닙니다.
      </Section>

      <Section title="2. 운영 주체">
        서비스 운영자: 오스완 프로젝트 (연락: 앱 내 Soft ID·닉네임과 함께 문의)
        <br />
        서비스 주소: https://oswan.vercel.app
      </Section>

      <Section title="3. 수집하는 정보">
        <ul style={{ margin: '8px 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>
            <strong>Soft ID</strong>: 기기/브라우저에 저장되는 임의 UUID. 가입(이메일·전화) 없이
            사용자를 구분합니다.
          </li>
          <li>
            <strong>닉네임</strong>: 사용자가 입력한 표시 이름(최대 12자).
          </li>
          <li>
            <strong>운동 세션</strong>: 스쿼트 개수, 목표 개수, 클리어 여부, 세션 시간, 규칙 버전.
          </li>
          <li>
            <strong>도전장</strong>: 보낸/받는 Soft ID·닉네임, 목표 개수, 마감, 수락·완료 상태.
          </li>
          <li>
            <strong>선택 입력</strong>: 체중(kg, 칼로리 추정용, 기기에 저장).
          </li>
          <li>
            <strong>기기 권한</strong>: 카메라(포즈 추정·카운트용). 마이크는 사용하지 않습니다.
          </li>
        </ul>
      </Section>

      <Section title="4. 카메라·영상 처리">
        카메라는 스쿼트 자세 추정과 개수 계산을 위해 사용됩니다. 포즈 추정은 기본적으로{' '}
        <strong>사용자 기기에서</strong> 이뤄집니다. 챌린지 자랑(선택)용 영상은 기기에만 생성·저장되며,
        오스완 서버로 업로드하지 않습니다. 사용자가 SNS 등에 직접 공유하는 경우는 해당 플랫폼의
        정책이 적용됩니다.
      </Section>

      <Section title="5. 이용 목적">
        <ul style={{ margin: '8px 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>스쿼트 카운트·기록·칼로리/자극 추정 표시</li>
          <li>친구 도전장 생성·수락·결과 비교</li>
          <li>선택적 랭킹·주간 통계(백엔드 연결 시)</li>
          <li>서비스 개선·오류 파악(필수 최소 범위)</li>
        </ul>
      </Section>

      <Section title="6. 보관·동기화">
        Soft ID·세션·도전장은 브라우저 localStorage에 저장될 수 있습니다. Supabase 등 백엔드가
        연결된 경우 Soft ID, 닉네임, 세션, 도전장 요약이 서버에 동기화될 수 있습니다. 원시 카메라
        영상은 서버에 보관하지 않는 것을 원칙으로 합니다.
      </Section>

      <Section title="7. 제3자 제공">
        판매·임대를 목적으로 개인정보를 제3자에게 제공하지 않습니다. 인프라(예: Vercel 호스팅,
        Supabase 데이터베이스) 처리가 필요할 수 있으며, 각 제공자의 보안·개인정보 정책이 적용됩니다.
      </Section>

      <Section title="8. 이용자 권리·삭제">
        앱의 「나」 화면에서 Soft ID를 확인하고, 로컬 데이터를 삭제(계정 초기화)할 수 있습니다.
        서버 동기화가 켜진 경우 삭제 반영에 시간이 걸리거나 운영자 확인이 필요할 수 있습니다. Soft
        ID와 삭제 요청을 함께 남겨 주세요.
      </Section>

      <Section title="9. 아동">
        만 14세 미만을 주 대상으로 하지 않습니다. 관련 법령상 보호자 동의가 필요한 경우 서비스를
        이용하지 말아 주세요.
      </Section>

      <Section title="10. 방침 변경">
        내용이 변경되면 본 페이지의 시행일을 갱신합니다. 중요한 변경은 앱 내 공지 또는 서비스
        화면에 안내할 수 있습니다.
      </Section>

      <Section title="11. Play / Data safety 요약">
        <ul style={{ margin: '8px 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>수집 가능: 앱 활동(운동), 사용자 ID(Soft ID), 이름(닉네임), 선택적 체중</li>
          <li>카메라: 기기 내 처리 · 서버로 영상 업로드하지 않음(원칙)</li>
          <li>목적: 앱 기능 · 분석(최소)</li>
          <li>본 문서는 https://oswan.vercel.app/privacy 에서 확인할 수 있습니다</li>
        </ul>
      </Section>

      <Link to="/me" className="cta-secondary" style={{ display: 'inline-flex', marginTop: 8 }}>
        나로 돌아가기
      </Link>
      <Link to="/" className="cta-secondary" style={{ display: 'inline-flex', marginTop: 10 }}>
        홈
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div className="meta" style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}
