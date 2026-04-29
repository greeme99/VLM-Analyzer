# VLM MODAPTS Motion Analyzer - TODO

## Phase 1: 기술 조사 및 구현 사례 딥리서치
- [x] VLM 모델 최적화 방안 조사 (GPT-4V vs LLaVA vs PaliGemma)
- [x] MODAPTS 표준 코드 체계 및 TMU 계산 방식 확인
- [x] OpenCV + Mediapipe 손/부품 추적 구현 사례 조사
- [x] 제조 현장 동작 분석 웹앱 구현 사례 조사

## Phase 2: 데이터베이스 스키마 설계 및 마이그레이션
- [x] 분석 프로젝트 테이블 설계 (project_id, title, video_url, status, created_at)
- [x] 동작 이벤트 테이블 설계 (event_id, project_id, start_time, end_time, modapts_code, tmu, description)
- [x] 보정 이력 테이블 설계 (correction_id, project_id, event_id, old_code, new_code, reason)
- [x] 마이그레이션 SQL 생성 및 적용
- [x] 데이터베이스 쿼리 헬퍼 함수 작성

## Phase 3: 백엔드 핵심 파이프라인 구현
- [x] 프레임 추출 모듈 (OpenCV)
- [x] 손 랜드마크 감지 모듈 (Mediapipe)
- [x] 부품 객체 탐지 모듈 (선택: YOLO or 간단한 컬러 기반)
- [x] 동작 구간 분해 로직 (Reach, Move, Get, Place 분류)
- [x] Gemini 2.5 Flash 프롬프트 설계 및 호출 모듈
- [x] Gemini 2.5 Flash API 통합 (gemini_integration.py)
- [x] MODAPTS 코드 매핑 엔진 (M1~M5, G0~G3, P0~P2, D3, L1, E2, F3, R2)
- [x] TMU 계산 및 표준시간 산출 로직

## Phase 4: FastAPI 백엔드 API 서버 구현
- [x] 프로젝트 생성/조회/삭제 API
- [x] 영상 업로드 API (S3 스토리지 연동)
- [x] 분석 실행 API (비동기 작업 처리)
- [x] 분석 결과 조회 API
- [x] 동작 이벤트 보정 API (추가/수정/삭제)
- [x] 분석 이력 조회 API
- [x] tRPC 라우터 작성 (프로젝트, 동작, 보정, 보고서)

## Phase 5: React 다크 테마 대시보드 UI 구현
- [x] 레이아웃 및 네비게이션 구성
- [x] 홈/대시보드 페이지
- [x] 영상 업로드 페이지 (드래그앤드롭, 진행률 표시)
- [x] 분석 결과 대시보드 (MODAPTS 코드 목록, 차트, 통계)
- [x] 수동 보정 UI (코드 수정, 코멘트 입력)
- [x] 분석 이력 페이지 (프로젝트 목록)
- [x] 프로젝트 목록 페이지
- [x] 다크 테마 색상 팔레트 및 스타일 정의

## Phase 6: 보고서 생성 및 다국어 지원 기능
- [x] PDF 보고서 생성 (분석 결과 요약, 차트, MODAPTS 코드 표)
- [x] Excel 보고서 생성 (상세 동작 목록, TMU, 보정 이력)
- [x] 한국어/영어 다국어 지원 (i18n 라이브러리 통합)
- [x] 언어 전환 UI 구현

## Phase 7: 통합 테스트 및 기능 검증
- [x] 백엔드 단위 테스트 (Vitest)
- [x] API 통합 테스트
- [x] 프론트엔드 컴포넌트 테스트
- [x] 엔드툐엔드 테스트 (영상 업로드 → 분석 → 결과 확인)
- [x] 다크 테마 UI/UX 검증

## Phase 8: 최종 결과물 전달
- [x] 프로젝트 체크포인트 생성
- [x] 사용자 가이드 작성
- [x] 배포 준비 및 최종 검증


## Phase 9: 다중 테마 및 고도화 기능
- [x] 다중 테마 선택 기능 (라이트, 다크, 그레이+블루)
- [x] 테마 선택 UI 컴포넌트 구현
- [x] 테마 설정 로컬스토리지 저장
- [x] 단언어 선택 기능 강화 (한국어, 영어)
- [x] PDF/Excel 보고서 라이브러리 통합 (pdfkit, xlsx)
- [x] 실시간 분석 진행률 표시 (WebSocket/SSE)
- [x] Google Firebase/Firestore 통합 (서버 및 DB 대체)
- [x] Firebase Authentication 통합
- [x] Firestore 데이터 마이그레이션 가이드
