# COST_SAFE — 유료 과금 방지 (재검토 2026-07-14)

오스완·풀완 모두 **무료만** 전제. 카드 자동 결제·Pro 업그레이드 금지.

## 결론 (코드 기준)

| 서비스 | 앱에서 쓰는가 | 과금이 되는가 (무료 플랜 유지 시) |
|---|---|---|
| **Vercel Hobby** | 오스완 배포 `oswan.vercel.app` | **카드에서 자동 출금 안 됨**. 한도 초과 시 보통 **배포/서비스 제한·정지** |
| **Supabase Free** | Soft ID·세션·도전·랭킹(선택) | **카드 없어도 Free 가능**. 한도 초과 시 **제한·프로젝트 pause**. Pro 미사용이면 **과금 없음** |
| **MediaPipe** | 브라우저 온디바이스 | $0 |
| **OpenAI / Gemini / ElevenLabs / Stripe** | **미사용** | 키만 넣지 않으면 $0 |
| **풀완 LLM 채점** | 아직 미구현 | 나중에 Vision API 쓰면 **유료 위험** → 별도 게이트 |

코드에 `stripe` / `openai` / 유료 SDK **없음** (`package.json` 확인).

---

## Vercel Hobby — 꼼꼼히

**안전한 점**
- Hobby = $0. Pro로 올리지 않으면 초과분이 카드로 청구되는 구조가 아님(초과 시 pause / upgrade 유도).
- 정적 SPA + 카메라 온디바이스 → 서버리스 함수 거의 안 씀.

**주의**
1. 대시보드에서 **Upgrade to Pro** 누르지 말 것.
2. 결제 수단을 연결한 뒤 Pro/Spend Cap 끄면 **그때부터 과금 가능** → 가능하면 **카드를 안 넣기**.
3. Hobby는 약관상 **비상업(personal/non-commercial)** 성격이 강함. Play에 “상업 앱”으로 크게 키울 때는 Pro 또는 다른 호스팅 검토(비용≠자동과금, **약관** 이슈).
4. 대역폭(대략 월 ~100GB 수준) 공유. BGM mp3·큰 JS를 많이 받으면 한도에 빨리 닿을 수 있음 → 한도 초과 시 **앱이 멈추는 것**이지 보통 청구는 아님.
5. 같은 Vercel 팀에 `oswan` 외 프로젝트 다수 존재 → **계정 전체 Hobby 쿼터를 나눠 씀**. 불필요 배포 정리하면 대역폭 여유↑.

**확인 URL:** https://vercel.com/account/billing → Plan = **Hobby**

---

## Supabase Free — 꼼꼼히

**안전한 점**
- Free: 카드 필수 아님. Pro 미전환 시 초과 과금보다 **제한/일시정지**.
- 오스완은 Storage에 영상 안 올림(원칙) → file storage 부담 작음.
- DB는 Soft ID·개수·도전장 텍스트 수준 → 500MB 한도와 거리 있음(초기).

**주의**
1. Org Billing → Plan = **Free**. **Upgrade to Pro / Team 금지**.
2. 활성 Free 프로젝트 **최대 2개**.  
   - 오스완 1개 + 풀완용 1개 = **꽉 참**.  
   - 세 번째를 만들면 Free로 안 되거나 Pro 유도 → **풀완은 당분간 로컬만** 또는 오스완 DB를 쓰지 말고 **paused 프로젝트 교체**.
3. **7일 무활동 시 Free 프로젝트 pause** (과금 아님, 대시보드에서 Resume).
4. Egress 약 5GB/월 — 랭킹·도전 sync만이면 보통 충분. 열린 RLS로 봇이 긁으면 한도→제한.
5. Payment method 연결 + Pro + Spend Cap off → **과금 루트**. Cap은 Pro일 때만 의미. **애초에 Pro 금지**.

**확인 URL:** https://supabase.com/dashboard/org/_/billing → **Free**

---

## 풀완 (수학 도전) — 과금 특수 주의

| 항목 | 권장 |
|---|---|
| Vercel | 새 프로젝트 가능(Hobby 쿼터 공유). Pro 올리지 말 것 |
| Supabase | **2프로젝트 한도** → 당분간 Soft ID 로컬만, 또는 오스완과 org/플랜 재배치 |
| GPT/Gemini Vision 채점 | **유료 API**. 키를 `.env`에 넣기 전 월 한도·선불·별도 저가 모델 정책 필수 |
| 지금은 | 코드에 유료 API **없음** → $0 |

---

## 절대 하지 말 것 (체크리스트)

- [ ] Supabase Upgrade to Pro / Team  
- [ ] Vercel Upgrade to Pro  
- [ ] Spend Cap 끄기 (Pro를 쓴 경우)  
- [ ] Compute / Disk / Branching / PITR 유료 애드온  
- [ ] OpenAI·Gemini·ElevenLabs·Stripe 키를 프론트 `VITE_*`에 넣기  
- [ ] 유료 도메인·유료 이메일 필수화(선택 전에 검토)  
- [ ] “한도 넘으면 자동으로 카드 결제”라고 가정하고 Cap 끄기  

---

## 한도 넘치면 생기는 일 (Free/Hobby)

| | 보통 결과 | 카드 출금? |
|---|---|---|
| Vercel Hobby 대역폭 등 | 배포/사이트 제한·정지 | **아니오** (Pro 미사용 시) |
| Supabase Free 스토리지·egress | 제한 / pause 유도 | **아니오** (Pro 미사용 시) |
| Pro + Cap off | 초과분 청구 | **예** |

---

## 지금 바로 수동 확인 (1회)

1. Vercel → Account → Billing → **Hobby**  
2. Supabase → Org Billing → **Free**, Active projects ≤ 2  
3. 결제 카드가 연결돼 있으면: **Pro/애드온이 켜져 있지 않은지** 확인  
4. 오스완 코드: 유료 AI 키 없음 ✓  

앱 URL: https://oswan.vercel.app  
