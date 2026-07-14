# VERCEL.md — 오스완 공개 배포

영구 HTTPS 주소로 배포하는 방법입니다. (카메라·카톡 공유에 HTTPS 필요)

## 사전 준비

1. [vercel.com](https://vercel.com) 계정 (GitHub 연동 권장)  
2. Supabase URL / anon key ([SUPABASE.md](./SUPABASE.md))  
3. 이 폴더: `oswan/`

---

## 방법 A — CLI (가장 빠름)

### 1) 로그인

PowerShell:

```powershell
cd "c:\Users\user\Desktop\스쿼트\oswan"
npx vercel login
```

브라우저에서 이메일/GitHub로 승인.

토큰이 예전에 깨졌다면:

```powershell
npx vercel logout
npx vercel login
```

### 2) 프로젝트 연결 + 첫 배포

```powershell
cd "c:\Users\user\Desktop\스쿼트\oswan"
npx vercel
```

질문에 대략:

- Set up and deploy? **Y**  
- Scope: 본인 계정  
- Link to existing? **N** (첫 배포)  
- Project name: `oswan`  
- Directory: `./`  

### 3) 환경변수 (Supabase)

```powershell
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_ANON_KEY production
```

붙여넣기 후 Enter. Preview에도 쓰려면 `preview` 에도 동일하게 추가.

대시보드에서 넣어도 됩니다:  
Vercel Project → **Settings → Environment Variables**

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

### 4) 프로덕션 배포

```powershell
npx vercel --prod
```

끝나면 주소가 나옵니다. 예:

`https://oswan-xxxx.vercel.app`

커스텀 도메인: Project → **Settings → Domains**

### 5) SPA 라우팅

이미 `vercel.json` 에 rewrite가 있습니다:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

`/c/:id` 도전 링크가 새로고침해도 404가 나지 않습니다.

---

## 방법 B — GitHub 연동 (추천, 자동 배포)

1. GitHub에 `oswan` 저장소 생성 후 `oswan/` 코드 push  
2. [vercel.com/new](https://vercel.com/new) → Import repository  
3. Framework Preset: **Vite**  
4. Root Directory: `oswan` (모노레포면)  
5. Environment Variables에 `VITE_SUPABASE_*` 추가  
6. Deploy  

이후 `main` push마다 자동 배포.

---

## 빌드 설정 (자동 감지되지만 확인)

| 항목 | 값 |
|---|---|
| Install | `npm install` |
| Build | `npm run build` |
| Output | `dist` |

`vite.config.ts` 의 `base` 는 `/` 유지 (Vercel 루트 도메인용).

GitHub Pages 하위경로로 올릴 때만:

```powershell
$env:VITE_BASE="/oswan/"; npm run build
```

---

## 배포 후 체크리스트

- [ ] `https://…vercel.app` 열림  
- [ ] 닉네임 → 홈  
- [ ] **나** 탭에 Supabase 연결됨  
- [ ] 연습/실세션 후 **기록** 그래프  
- [ ] **랭킹**에 닉네임 노출  
- [ ] 도전 링크 공유 → 다른 기기에서 수락 (SQL + sync 후)

---

## 문제 해결

| 증상 | 조치 |
|---|---|
| `The specified token is not valid` | `npx vercel logout` → `npx vercel login` |
| 랭킹 비어 있음 | SQL 미실행 / env 미설정 / 세션 미동기화 |
| `/c/xxx` 404 | `vercel.json` rewrite 확인 후 재배포 |
| 카메라 안 됨 | HTTP가 아닌지 확인 (Vercel은 HTTPS) |
| env 반영 안 됨 | Production env 저장 후 **Redeploy** (빌드 타임에 Vite가 주입) |

Vite의 `VITE_*` 는 **빌드 시** 박힙니다. env 바꾼 뒤에는 반드시 다시 `vercel --prod` / Redeploy.
