import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, Download, Edit2, AlertCircle, Loader2, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";

const MODAPTS_COLORS = {
  M: "#3b82f6",
  G: "#10b981",
  P: "#f59e0b",
  D: "#8b5cf6",
  L: "#ec4899",
  E: "#06b6d4",
  F: "#14b8a6",
  R: "#f97316",
};

/**
 * Project Detail Page - Analysis results and corrections
 */
export default function ProjectDetailPage() {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/projects/:id");

  const t = {
    ko: {
      loginRequired: "로그인이 필요합니다",
      projectNotFound: "프로젝트를 찾을 수 없습니다",
      analysisComplete: "분석 완료",
      analyzing: "분석 중...",
      completed: "완료",
      inProgress: "진행 중",
      report: "보고서",
      standardTime: "표준시간",
      totalMod: "총 MOD",
      motionCount: "동작 수",
      avgConfidence: "평균 신뢰도",
      seconds: "초",
      mod: "MOD",
      count: "개",
      percent: "%",
      analysisResults: "분석 결과",
      modDistribution: "MOD 값 분포",
      modDistributionDesc: "각 동작별 MOD 값",
      codeDistribution: "코드 유형 분포",
      codeDistributionDesc: "MODAPTS 코드 유형별 비율",
      detailsList: "동작 이벤트 상세",
      detailsListDesc: "분석된 모든 동작 이벤트 목록",
      sequence: "순번",
      code: "코드",
      time: "시간",
      description: "설명",
      confidence: "신뢰도",
      action: "작업",
      corrections: "보정 이력",
      correctionsDesc: "수동 보정 기록",
      corrected: "보정됨",
      noCorrections: "보정 이력이 없습니다",
      details: "상세 목록",
    },
    en: {
      loginRequired: "Login is required",
      projectNotFound: "Project not found",
      analysisComplete: "Analysis Complete",
      analyzing: "Analyzing...",
      completed: "Completed",
      inProgress: "In Progress",
      report: "Report",
      standardTime: "Standard Time",
      totalMod: "Total MOD",
      motionCount: "Motion Count",
      avgConfidence: "Avg Confidence",
      seconds: "sec",
      mod: "MOD",
      count: "items",
      percent: "%",
      analysisResults: "Analysis Results",
      modDistribution: "MOD Value Distribution",
      modDistributionDesc: "MOD value for each motion",
      codeDistribution: "Code Type Distribution",
      codeDistributionDesc: "MODAPTS code type ratio",
      detailsList: "Motion Event Details",
      detailsListDesc: "List of all analyzed motion events",
      sequence: "No.",
      code: "Code",
      time: "Time",
      description: "Description",
      confidence: "Confidence",
      action: "Action",
      corrections: "Correction History",
      correctionsDesc: "Manual correction records",
      corrected: "Corrected",
      noCorrections: "No correction history",
      details: "Details",
    },
  };

  const text = t[language];

  if (!isAuthenticated || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{text.loginRequired}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const projectId = parseInt(params?.id || "0");
  const projectQuery = trpc.project.get.useQuery({ projectId });
  const motionEventsQuery = trpc.motionEvent.list.useQuery({ projectId });
  const correctionsQuery = trpc.correction.list.useQuery({ projectId });

  if (projectQuery.isLoading || motionEventsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const project = projectQuery.data;
  const motionEvents = motionEventsQuery.data || [];

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{text.projectNotFound}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare chart data
  const chartData = motionEvents.map((event: any, idx: number) => ({
    name: String(event.modaptsCode),
    value: Number(event.modValue),
    time: parseFloat(String(event.timeSeconds)),
    sequence: idx + 1,
  }));

  const codeDistribution = motionEvents.reduce((acc: any, event: any) => {
    const codeType = event.modaptsCode[0];
    const existing = acc.find((item: any) => item.name === codeType);
    if (existing) {
      existing.value += event.modValue;
      existing.count += 1;
    } else {
      acc.push({ name: codeType, value: event.modValue, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/projects")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <p className="text-sm text-muted-foreground">
                {project.status === "completed" ? text.analysisComplete : text.analyzing}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={project.status === "completed" ? "default" : "secondary"}>
              {project.status === "completed" ? text.completed : text.inProgress}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {text.report}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              label={text.standardTime}
              value={project.standardTime ? `${parseFloat(project.standardTime).toFixed(2)}` : "-"}
              unit={text.seconds}
            />
            <SummaryCard label={text.totalMod} value={project.totalMods || "0"} unit={text.mod} />
            <SummaryCard label={text.motionCount} value={motionEvents.length.toString()} unit={text.count} />
            <SummaryCard
              label={text.avgConfidence}
              value={
                motionEvents.length > 0
                  ? (
                      motionEvents.reduce((sum: number, e: any) => sum + (e.confidence || 0), 0) /
                      motionEvents.length
                    ).toFixed(0)
                  : "0"
              }
              unit={text.percent}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">{text.analysisResults}</TabsTrigger>
              <TabsTrigger value="details">{text.details}</TabsTrigger>
              <TabsTrigger value="corrections">{text.corrections}</TabsTrigger>
            </TabsList>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* MOD Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>{text.modDistribution}</CardTitle>
                    <CardDescription>{text.modDistributionDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Code Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>{text.codeDistribution}</CardTitle>
                    <CardDescription>{text.codeDistributionDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={codeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, count }) => `${name} (${count})`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {codeDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={MODAPTS_COLORS[entry.name as keyof typeof MODAPTS_COLORS] || "#999"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>{text.detailsList}</CardTitle>
                  <CardDescription>{text.detailsListDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/40">
                          <th className="text-left py-3 px-4 font-semibold">{text.sequence}</th>
                          <th className="text-left py-3 px-4 font-semibold">{text.code}</th>
                          <th className="text-left py-3 px-4 font-semibold">{text.mod}</th>
                          <th className="text-left py-3 px-4 font-semibold">{text.time}</th>
                          <th className="text-left py-3 px-4 font-semibold">{text.description}</th>
                          <th className="text-left py-3 px-4 font-semibold">{text.confidence}</th>
                          <th className="text-left py-3 px-4 font-semibold">{text.action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {motionEvents.map((event: any, idx: number) => (
                          <tr key={event.id} className="border-b border-border/20 hover:bg-muted/50">
                            <td className="py-3 px-4">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{event.modaptsCode}</Badge>
                            </td>
                            <td className="py-3 px-4 font-mono">{event.modValue}</td>
                            <td className="py-3 px-4 font-mono">{parseFloat(event.timeSeconds).toFixed(3)}s</td>
                            <td className="py-3 px-4 text-muted-foreground">{event.description}</td>
                            <td className="py-3 px-4">
                              <span className={event.confidence >= 80 ? "text-green-500" : "text-yellow-500"}>
                                {event.confidence}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Corrections Tab */}
            <TabsContent value="corrections">
              <Card>
                <CardHeader>
                  <CardTitle>{text.corrections}</CardTitle>
                  <CardDescription>{text.correctionsDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  {correctionsQuery.data && correctionsQuery.data.length > 0 ? (
                    <div className="space-y-4">
                      {correctionsQuery.data.map((correction: any) => (
                        <div key={correction.id} className="border border-border/40 rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">
                                {correction.originalCode} → {correction.newCode}
                              </p>
                              <p className="text-sm text-muted-foreground">{correction.reason}</p>
                            </div>
                            <Badge variant="secondary">{text.corrected}</Badge>
                          </div>
                          {correction.comment && <p className="text-sm italic text-muted-foreground">{correction.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">{text.noCorrections}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

/**
 * Summary Card Component
 */
function SummaryCard({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="text-xs">{label}</CardDescription>
        <div className="flex items-baseline gap-2">
          <CardTitle className="text-2xl font-bold">{value}</CardTitle>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </CardHeader>
    </Card>
  );
}
