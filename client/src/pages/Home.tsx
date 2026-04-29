import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, BarChart3, Settings, FileText } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useEffect, useState } from "react";

/**
 * Home Page - Landing & Dashboard
 * Shows feature overview for unauthenticated users
 * Shows project list for authenticated users
 */
export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{language === "ko" ? "로딩 중..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <DashboardPage user={user} />;
}

/**
 * Landing Page for unauthenticated users
 */
function LandingPage() {
  const { language } = useLanguage();

  const t = {
    ko: {
      login: "로그인",
      title: "제조 동작 분석, 이제 자동으로",
      subtitle: "VLM 기반 MODAPTS 분석으로 제조 공정의 표준시간을 정확하게 산출하세요.\n영상 업로드 한 번으로 전체 분석이 완료됩니다.",
      features: "주요 기능",
      feature1: "간편한 업로드",
      feature1Desc: "제조 공정 영상을 드래그앤드롭으로 업로드하세요. MP4, AVI, MOV 형식 지원",
      feature2: "자동 분석",
      feature2Desc: "Gemini 2.5 Flash 기반 VLM이 동작을 인식하고 MODAPTS 코드를 자동으로 부여합니다",
      feature3: "보고서 생성",
      feature3Desc: "분석 결과를 PDF, Excel 형식으로 다운로드하세요",
      why: "왜 MODAPTS Analyzer를 선택해야 할까요?",
      benefit1: "정확한 분석",
      benefit1Desc: "AI 기반 동작 인식으로 높은 정확도 보장",
      benefit2: "시간 절감",
      benefit2Desc: "수동 분석 대비 80% 이상 시간 절감",
      benefit3: "표준화",
      benefit3Desc: "MODAPTS 표준에 따른 일관된 결과",
      benefit4: "추적 가능",
      benefit4Desc: "모든 분석 이력을 DB에 저장하여 비교 분석 가능",
      cta: "지금 바로 시작하세요",
      ctaDesc: "무료로 가입하고 첫 분석을 진행해보세요",
      ctaButton: "로그인 / 가입",
      copyright: "© 2026 MODAPTS Motion Analyzer. All rights reserved.",
    },
    en: {
      login: "Login",
      title: "Automated Manufacturing Motion Analysis",
      subtitle: "Accurately calculate standard time for manufacturing processes using VLM-based MODAPTS analysis.\nComplete analysis with just one video upload.",
      features: "Key Features",
      feature1: "Easy Upload",
      feature1Desc: "Upload manufacturing process videos with drag-and-drop. Supports MP4, AVI, MOV formats",
      feature2: "Automatic Analysis",
      feature2Desc: "Gemini 2.5 Flash-based VLM recognizes motions and automatically assigns MODAPTS codes",
      feature3: "Report Generation",
      feature3Desc: "Download analysis results in PDF and Excel formats",
      why: "Why Choose MODAPTS Analyzer?",
      benefit1: "Accurate Analysis",
      benefit1Desc: "High accuracy guaranteed with AI-based motion recognition",
      benefit2: "Time Saving",
      benefit2Desc: "80% or more time savings compared to manual analysis",
      benefit3: "Standardization",
      benefit3Desc: "Consistent results according to MODAPTS standards",
      benefit4: "Traceability",
      benefit4Desc: "Compare analyses by storing all analysis history in the database",
      cta: "Get Started Now",
      ctaDesc: "Sign up for free and try your first analysis",
      ctaButton: "Login / Sign Up",
      copyright: "© 2026 MODAPTS Motion Analyzer. All rights reserved.",
    },
  };

  const text = t[language];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">MODAPTS Analyzer</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>{text.login}</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            {text.title}
          </h1>
          <p className="text-xl text-muted-foreground whitespace-pre-line">
            {text.subtitle}
          </p>
          <Button size="lg" asChild className="mt-8">
            <a href={getLoginUrl()}>{text.cta}</a>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{text.features}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Upload className="w-6 h-6" />}
            title={text.feature1}
            description={text.feature1Desc}
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title={text.feature2}
            description={text.feature2Desc}
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title={text.feature3}
            description={text.feature3Desc}
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">{text.why}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <BenefitItem title={text.benefit1} description={text.benefit1Desc} />
          <BenefitItem title={text.benefit2} description={text.benefit2Desc} />
          <BenefitItem title={text.benefit3} description={text.benefit3Desc} />
          <BenefitItem title={text.benefit4} description={text.benefit4Desc} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">{text.cta}</h2>
        <p className="text-lg text-muted-foreground mb-8">
          {text.ctaDesc}
        </p>
        <Button size="lg" asChild>
          <a href={getLoginUrl()}>{text.ctaButton}</a>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>{text.copyright}</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Dashboard Page for authenticated users
 */
function DashboardPage({ user }: { user: any }) {
  const { language } = useLanguage();

  const t = {
    ko: {
      settings: "설정",
      dashboard: "대시보드",
      dashboardDesc: "새로운 분석을 시작하거나 기존 프로젝트를 관리하세요",
      newAnalysis: "새 분석 시작",
      newAnalysisDesc: "제조 공정 영상을 업로드하고 MODAPTS 분석을 시작하세요",
      projectManagement: "프로젝트 관리",
      projectManagementDesc: "기존 분석 결과를 조회하고 보정하세요",
      settingsLabel: "설정",
      settingsDesc: "언어, 알림, API 키 등을 설정하세요",
      totalAnalysis: "총 분석 수",
      completedAnalysis: "완료된 분석",
      inProgress: "진행 중",
      avgStandardTime: "평균 표준시간",
    },
    en: {
      settings: "Settings",
      dashboard: "Dashboard",
      dashboardDesc: "Start a new analysis or manage existing projects",
      newAnalysis: "Start New Analysis",
      newAnalysisDesc: "Upload manufacturing process video and start MODAPTS analysis",
      projectManagement: "Project Management",
      projectManagementDesc: "View and correct existing analysis results",
      settingsLabel: "Settings",
      settingsDesc: "Configure language, notifications, API keys, etc.",
      totalAnalysis: "Total Analysis",
      completedAnalysis: "Completed Analysis",
      inProgress: "In Progress",
      avgStandardTime: "Avg Standard Time",
    },
  };

  const text = t[language];

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{text.dashboard}</h1>
            <p className="text-muted-foreground">
              {text.dashboardDesc}
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/upload">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    {text.newAnalysis}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {text.newAnalysisDesc}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/projects">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {text.projectManagement}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {text.projectManagementDesc}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    {text.settingsLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {text.settingsDesc}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label={text.totalAnalysis} value="0" />
            <StatCard label={text.completedAnalysis} value="0" />
            <StatCard label={text.inProgress} value="0" />
            <StatCard label={text.avgStandardTime} value="0s" />
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Feature Card Component
 */
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-border/40 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Benefit Item Component
 */
function BenefitItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="text-xs">{label}</CardDescription>
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
