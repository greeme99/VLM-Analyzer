/**
 * Internationalization (i18n) Configuration
 * Supports Korean and English
 */

export type Language = "ko" | "en";

export const translations = {
  ko: {
    // Navigation
    nav: {
      home: "홈",
      upload: "업로드",
      projects: "프로젝트",
      settings: "설정",
      logout: "로그아웃",
    },

    // Home Page
    home: {
      title: "MODAPTS 동작분석 시스템",
      subtitle: "제조 공정의 작업 동작을 분석하고 표준시간을 산출합니다",
      features: "주요 기능",
      feature1: "영상 업로드",
      feature1Desc: "MP4, AVI, MOV 형식의 제조 공정 영상을 업로드하세요",
      feature2: "자동 분석",
      feature2Desc: "VLM 기술로 동작을 인식하고 MODAPTS 코드를 자동 부여합니다",
      feature3: "결과 시각화",
      feature3Desc: "차트와 통계로 분석 결과를 직관적으로 확인하세요",
      feature4: "보정 및 보고서",
      feature4Desc: "수동 보정 후 PDF/Excel 보고서를 다운로드합니다",
      cta: "시작하기",
    },

    // Upload Page
    upload: {
      title: "영상 업로드",
      dragDrop: "여기에 파일을 드래그하거나 클릭하여 선택하세요",
      supportedFormats: "지원 형식: MP4, AVI, MOV",
      maxSize: "최대 파일 크기: 500MB",
      projectName: "프로젝트 이름",
      projectNamePlaceholder: "예: 조립 공정 분석",
      description: "설명 (선택사항)",
      descriptionPlaceholder: "이 분석에 대한 설명을 입력하세요",
      upload: "업로드",
      uploading: "업로드 중...",
      analyzing: "분석 중...",
      success: "분석이 완료되었습니다",
      error: "업로드 중 오류가 발생했습니다",
    },

    // Projects Page
    projects: {
      title: "분석 프로젝트",
      newProject: "새 프로젝트",
      search: "검색...",
      status: "상태",
      completed: "완료",
      analyzing: "분석 중",
      failed: "실패",
      createdAt: "생성일",
      actions: "작업",
      view: "보기",
      delete: "삭제",
      noProjects: "프로젝트가 없습니다",
    },

    // Project Detail Page
    projectDetail: {
      title: "분석 결과",
      status: "상태",
      completed: "완료",
      analyzing: "분석 중",
      download: "다운로드",
      report: "보고서",
      summary: "요약",
      analysis: "분석 결과",
      details: "상세 목록",
      corrections: "보정 이력",
      standardTime: "표준시간",
      totalMods: "총 MOD",
      motionCount: "동작 수",
      avgConfidence: "평균 신뢰도",
      modDistribution: "MOD 값 분포",
      codeDistribution: "코드 유형 분포",
      sequence: "순번",
      code: "코드",
      modValue: "MOD",
      time: "시간",
      description: "설명",
      confidence: "신뢰도",
      actions: "작업",
      correctionHistory: "보정 이력",
      noCorrections: "보정 이력이 없습니다",
    },

    // Motion Correction
    correction: {
      title: "동작 코드 보정",
      subtitle: "분석된 MODAPTS 코드를 수정하고 이유를 기록하세요",
      originalCode: "원본 코드",
      newCode: "새로운 코드",
      reason: "보정 사유 (선택사항)",
      reasonPlaceholder: "예: 손 이동 거리가 더 길어 보임",
      comment: "추가 코멘트 (선택사항)",
      commentPlaceholder: "추가 설명이나 메모를 입력하세요",
      cancel: "취소",
      save: "보정 저장",
      saving: "저장 중...",
      success: "보정이 완료되었습니다",
      error: "보정 중 오류가 발생했습니다",
      bulkCorrection: "일괄 보정",
      selectMotions: "보정할 동작 선택",
      applyCode: "적용할 코드",
      apply: "일괄 적용",
      applying: "적용 중...",
      selected: "개 선택됨",
    },

    // MODAPTS Codes
    modapts: {
      move: "이동 (Move)",
      get: "집기 (Get)",
      place: "놓기 (Place)",
      other: "기타",
      m1: "손가락 이동 (2.5cm)",
      m2: "손 이동 (5cm)",
      m3: "팔뚝 이동 (15cm)",
      m4: "팔 이동 (30cm)",
      m5: "팔 + 몸 이동 (60cm)",
      m6: "전신 이동 (90cm+)",
      g0: "쉬운 집기",
      g1: "일반 집기",
      g2: "어려운 집기",
      g3: "도구 집기",
      p0: "가벼운 놓기",
      p1: "일반 놓기",
      p2: "조심스러운 놓기",
      d3: "판단",
      l1: "읽기 (짧음)",
      e2: "눈 이동",
      f3: "발 이동",
      r2: "읽기 (일반)",
    },

    // Common
    common: {
      loading: "로딩 중...",
      error: "오류가 발생했습니다",
      success: "성공",
      cancel: "취소",
      save: "저장",
      delete: "삭제",
      edit: "수정",
      close: "닫기",
      back: "뒤로",
      next: "다음",
      prev: "이전",
      confirm: "확인",
      selectLanguage: "언어 선택",
    },
  },

  en: {
    // Navigation
    nav: {
      home: "Home",
      upload: "Upload",
      projects: "Projects",
      settings: "Settings",
      logout: "Logout",
    },

    // Home Page
    home: {
      title: "MODAPTS Motion Analysis System",
      subtitle: "Analyze manufacturing process motions and calculate standard time",
      features: "Key Features",
      feature1: "Video Upload",
      feature1Desc: "Upload manufacturing process videos in MP4, AVI, or MOV format",
      feature2: "Automatic Analysis",
      feature2Desc: "VLM technology recognizes motions and assigns MODAPTS codes automatically",
      feature3: "Results Visualization",
      feature3Desc: "View analysis results intuitively with charts and statistics",
      feature4: "Correction & Reports",
      feature4Desc: "Manually correct results and download PDF/Excel reports",
      cta: "Get Started",
    },

    // Upload Page
    upload: {
      title: "Video Upload",
      dragDrop: "Drag files here or click to select",
      supportedFormats: "Supported formats: MP4, AVI, MOV",
      maxSize: "Maximum file size: 500MB",
      projectName: "Project Name",
      projectNamePlaceholder: "e.g., Assembly Process Analysis",
      description: "Description (Optional)",
      descriptionPlaceholder: "Enter a description for this analysis",
      upload: "Upload",
      uploading: "Uploading...",
      analyzing: "Analyzing...",
      success: "Analysis completed",
      error: "An error occurred during upload",
    },

    // Projects Page
    projects: {
      title: "Analysis Projects",
      newProject: "New Project",
      search: "Search...",
      status: "Status",
      completed: "Completed",
      analyzing: "Analyzing",
      failed: "Failed",
      createdAt: "Created",
      actions: "Actions",
      view: "View",
      delete: "Delete",
      noProjects: "No projects found",
    },

    // Project Detail Page
    projectDetail: {
      title: "Analysis Results",
      status: "Status",
      completed: "Completed",
      analyzing: "Analyzing",
      download: "Download",
      report: "Report",
      summary: "Summary",
      analysis: "Analysis Results",
      details: "Details",
      corrections: "Correction History",
      standardTime: "Standard Time",
      totalMods: "Total MODs",
      motionCount: "Motion Count",
      avgConfidence: "Avg Confidence",
      modDistribution: "MOD Distribution",
      codeDistribution: "Code Type Distribution",
      sequence: "Seq",
      code: "Code",
      modValue: "MOD",
      time: "Time",
      description: "Description",
      confidence: "Confidence",
      actions: "Actions",
      correctionHistory: "Correction History",
      noCorrections: "No corrections found",
    },

    // Motion Correction
    correction: {
      title: "Motion Code Correction",
      subtitle: "Modify analyzed MODAPTS codes and record the reason",
      originalCode: "Original Code",
      newCode: "New Code",
      reason: "Correction Reason (Optional)",
      reasonPlaceholder: "e.g., Hand movement distance appears longer",
      comment: "Additional Comment (Optional)",
      commentPlaceholder: "Enter additional notes or explanations",
      cancel: "Cancel",
      save: "Save Correction",
      saving: "Saving...",
      success: "Correction completed",
      error: "An error occurred during correction",
      bulkCorrection: "Bulk Correction",
      selectMotions: "Select Motions to Correct",
      applyCode: "Code to Apply",
      apply: "Apply Bulk",
      applying: "Applying...",
      selected: "selected",
    },

    // MODAPTS Codes
    modapts: {
      move: "Move",
      get: "Get",
      place: "Place",
      other: "Other",
      m1: "Finger Move (2.5cm)",
      m2: "Hand Move (5cm)",
      m3: "Forearm Move (15cm)",
      m4: "Arm Move (30cm)",
      m5: "Arm + Body Move (60cm)",
      m6: "Full Body Move (90cm+)",
      g0: "Easy Get",
      g1: "Normal Get",
      g2: "Difficult Get",
      g3: "Tool Get",
      p0: "Light Place",
      p1: "Normal Place",
      p2: "Careful Place",
      d3: "Decision",
      l1: "Read (Short)",
      e2: "Eye Move",
      f3: "Foot Move",
      r2: "Read (Normal)",
    },

    // Common
    common: {
      loading: "Loading...",
      error: "An error occurred",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      back: "Back",
      next: "Next",
      prev: "Previous",
      confirm: "Confirm",
      selectLanguage: "Select Language",
    },
  },
};

/**
 * Get translation by key path
 * Example: t("home.title") -> "MODAPTS 동작분석 시스템"
 */
export function getTranslation(language: Language, keyPath: string): string {
  const keys = keyPath.split(".");
  let value: any = translations[language];

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return keyPath; // Return key path if translation not found
    }
  }

  return typeof value === "string" ? value : keyPath;
}

/**
 * Create translation helper for a specific language
 */
export function createTranslator(language: Language) {
  return (keyPath: string) => getTranslation(language, keyPath);
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): Array<{ code: Language; name: string }> {
  return [
    { code: "ko", name: "한국어" },
    { code: "en", name: "English" },
  ];
}
