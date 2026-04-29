import { useAuth } from "@/_core/hooks/useAuth";
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
          <p className="text-muted-foreground">로딩 중...</p>
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
            <a href={getLoginUrl()}>로그인</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            제조 동작 분석, 이제 자동으로
          </h1>
          <p className="text-xl text-muted-foreground">
            VLM 기반 MODAPTS 분석으로 제조 공정의 표준시간을 정확하게 산출하세요.
            영상 업로드 한 번으로 전체 분석이 완료됩니다.
          </p>
          <Button size="lg" asChild className="mt-8">
            <a href={getLoginUrl()}>지금 시작하기</a>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">주요 기능</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Upload className="w-6 h-6" />}
            title="간편한 업로드"
            description="제조 공정 영상을 드래그앤드롭으로 업로드하세요. MP4, AVI, MOV 형식 지원"
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="자동 분석"
            description="GPT-4V 기반 VLM이 동작을 인식하고 MODAPTS 코드를 자동으로 부여합니다"
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="보고서 생성"
            description="분석 결과를 PDF, Excel 형식으로 다운로드하세요"
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">왜 MODAPTS Analyzer를 선택해야 할까요?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <BenefitItem title="정확한 분석" description="AI 기반 동작 인식으로 높은 정확도 보장" />
          <BenefitItem title="시간 절감" description="수동 분석 대비 80% 이상 시간 절감" />
          <BenefitItem title="표준화" description="MODAPTS 표준에 따른 일관된 결과" />
          <BenefitItem title="추적 가능" description="모든 분석 이력을 DB에 저장하여 비교 분석 가능" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h2>
        <p className="text-lg text-muted-foreground mb-8">
          무료로 가입하고 첫 분석을 진행해보세요
        </p>
        <Button size="lg" asChild>
          <a href={getLoginUrl()}>로그인 / 가입</a>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 MODAPTS Motion Analyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Dashboard Page for authenticated users
 */
function DashboardPage({ user }: { user: any }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">MODAPTS Analyzer</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">설정</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">대시보드</h1>
            <p className="text-muted-foreground">
              새로운 분석을 시작하거나 기존 프로젝트를 관리하세요
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/upload">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    새 분석 시작
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    제조 공정 영상을 업로드하고 MODAPTS 분석을 시작하세요
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/projects">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    프로젝트 관리
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    기존 분석 결과를 조회하고 보정하세요
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    설정
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    언어, 알림, API 키 등을 설정하세요
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="총 분석 수" value="0" />
            <StatCard label="완료된 분석" value="0" />
            <StatCard label="진행 중" value="0" />
            <StatCard label="평균 표준시간" value="0s" />
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
