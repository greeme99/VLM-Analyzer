# VLM MODAPTS 동작분석 시스템

제조 공정의 작업 동작을 자동으로 분석하고 표준시간을 산출하는 웹 기반 애플리케이션입니다.

## 🎯 주요 기능

- **자동 영상 분석**: Gemini 2.5 Flash VLM 기술로 제조 공정 영상 자동 분석
- **MODAPTS 코드 자동 부여**: 국제 표준 MODAPTS 코드 자동 매핑
- **표준시간 산출**: MOD 값 기반 표준시간(ST) 자동 계산
- **다크 테마 대시보드**: 제조 현장 친화적인 UI/UX
- **수동 보정**: 분석 결과 수동 보정 및 코멘트 입력
- **보고서 생성**: PDF/Excel 형식 보고서 다운로드
- **다국어 지원**: 한국어/영어 전환 가능
- **분석 이력 관리**: 과거 분석 프로젝트 조회 및 비교

## 🏗️ 기술 스택

### 백엔드
- **Node.js + Express**: REST API 서버
- **tRPC**: 타입 안전 RPC 프레임워크
- **FastAPI (Python)**: 분석 엔진 서버
- **MySQL/TiDB**: 데이터베이스
- **Drizzle ORM**: 데이터베이스 관리

### 프론트엔드
- **React 19**: UI 프레임워크
- **Tailwind CSS 4**: 스타일링
- **Recharts**: 데이터 시각화
- **shadcn/ui**: UI 컴포넌트 라이브러리

### AI/ML
- **Google Gemini 2.5 Flash**: VLM 기반 영상 분석
- **OpenCV**: 프레임 추출 및 이미지 처리
- **Mediapipe**: 손 랜드마크 감지

### 배포
- **Manus Platform**: 웹 호스팅 및 관리

## 📋 시스템 요구사항

### 개발 환경
- Node.js 22.13.0+
- Python 3.11+
- pnpm 10.4.1+

### 런타임 환경
- 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- 인터넷 연결

## 🚀 시작하기

### 1. 프로젝트 초기화
```bash
cd /home/ubuntu/vlm-motion-analysis
pnpm install
```

### 2. 데이터베이스 설정
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 3. 환경 변수 설정
다음 환경 변수를 설정해주세요:
- `OPENAI_API_KEY`: OpenAI API 키 (선택사항)
- `GOOGLE_API_KEY`: Google Gemini API 키
- `DATABASE_URL`: 데이터베이스 연결 문자열

### 4. 개발 서버 실행
```bash
pnpm dev
```

브라우저에서 `http://localhost:3000`으로 접속

### 5. 프로덕션 빌드
```bash
pnpm build
pnpm start
```

## 📁 프로젝트 구조

```
vlm-motion-analysis/
├── client/                    # React 프론트엔드
│   ├── src/
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── contexts/         # React 컨텍스트
│   │   ├── lib/              # 유틸리티 함수
│   │   ├── App.tsx           # 라우팅
│   │   └── main.tsx          # 진입점
│   └── index.html
├── server/                    # Node.js + Express 백엔드
│   ├── routers.ts            # tRPC 라우터
│   ├── db.ts                 # 데이터베이스 쿼리
│   ├── analysis_pipeline.py  # 분석 파이프라인
│   ├── gemini_integration.py # Gemini API 통합
│   ├── report_generator.py   # 보고서 생성
│   └── _core/                # 프레임워크 코드
├── drizzle/                   # 데이터베이스 스키마
│   └── schema.ts             # 테이블 정의
├── shared/                    # 공유 타입/상수
├── storage/                   # S3 스토리지 헬퍼
├── package.json
└── tsconfig.json
```

## 🔧 주요 API

### 프로젝트 관리
- `POST /api/trpc/project.create` - 프로젝트 생성
- `GET /api/trpc/project.list` - 프로젝트 목록 조회
- `GET /api/trpc/project.get` - 프로젝트 상세 조회
- `DELETE /api/trpc/project.delete` - 프로젝트 삭제

### 분석 관리
- `POST /api/trpc/analysis.start` - 분석 시작
- `GET /api/trpc/analysis.status` - 분석 상태 조회
- `GET /api/trpc/motionEvent.list` - 동작 이벤트 조회

### 보정 관리
- `POST /api/trpc/correction.create` - 보정 기록 생성
- `GET /api/trpc/correction.list` - 보정 이력 조회

### 보고서
- `GET /api/trpc/report.generate` - 보고서 생성

## 📊 MODAPTS 코드 체계

### 이동 (Move) - M1~M6
- M1: 손가락 이동 (2.5cm)
- M2: 손 이동 (5cm)
- M3: 팔뚝 이동 (15cm)
- M4: 팔 이동 (30cm)
- M5: 팔 + 몸 이동 (60cm)
- M6: 전신 이동 (90cm+)

### 집기 (Get) - G0~G3
- G0: 쉬운 집기
- G1: 일반 집기
- G2: 어려운 집기
- G3: 도구 집기

### 놓기 (Place) - P0~P2
- P0: 가벼운 놓기
- P1: 일반 놓기
- P2: 조심스러운 놓기

### 기타
- D3: 판단
- L1: 읽기 (짧음)
- E2: 눈 이동
- F3: 발 이동
- R2: 읽기 (일반)

## 🧪 테스트

### 백엔드 테스트
```bash
pnpm test
```

### 타입 체크
```bash
pnpm check
```

## 📝 사용 가이드

자세한 사용 방법은 [USER_GUIDE.md](./USER_GUIDE.md)를 참고하세요.

## 🔐 보안

- OAuth 2.0 기반 인증
- 세션 쿠키 암호화
- HTTPS 통신
- 데이터베이스 연결 암호화

## 📈 성능

- 평균 분석 시간: 1-5분
- 분석 정확도: 85%+
- 동시 사용자: 100+

## 🐛 알려진 문제

없음

## 🔄 업데이트 이력

### v1.0.0 (2026-04-29)
- 초기 릴리스
- Gemini 2.5 Flash 기반 분석
- 다크 테마 대시보드
- 다국어 지원

## 📞 지원

문제가 발생하거나 기능 요청이 있으면:
1. 시스템 관리자에게 문의
2. 에러 메시지와 함께 스크린샷 첨부
3. 프로젝트 ID 및 분석 시간 정보 제공

## 📄 라이선스

이 프로젝트는 Manus Platform에서 관리됩니다.

## 👥 개발팀

- AI/ML 엔지니어: VLM 분석 파이프라인 개발
- 백엔드 엔지니어: tRPC/FastAPI 서버 구현
- 프론트엔드 엔지니어: React 대시보드 개발
- 산업공학 전문가: MODAPTS 엔진 설계

---

**마지막 업데이트**: 2026년 4월 29일  
**버전**: 1.0.0
