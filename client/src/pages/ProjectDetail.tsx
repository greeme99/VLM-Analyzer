import { useAuth } from "@/_core/hooks/useAuth";
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
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/projects/:id");

  if (!isAuthenticated || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>로그인이 필요합니다</AlertDescription>
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
          <AlertDescription>프로젝트를 찾을 수 없습니다</AlertDescription>
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
                {project.status === "completed" ? "분석 완료" : "분석 중..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={project.status === "completed" ? "default" : "secondary"}>
              {project.status === "completed" ? "완료" : "진행 중"}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              보고서
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
              label="표준시간"
              value={project.standardTime ? `${parseFloat(project.standardTime).toFixed(2)}s` : "-"}
              unit="초"
            />
            <SummaryCard label="총 MOD" value={project.totalMods || "0"} unit="MOD" />
            <SummaryCard label="동작 수" value={motionEvents.length.toString()} unit="개" />
            <SummaryCard
              label="평균 신뢰도"
              value={
                motionEvents.length > 0
                  ? (
                      motionEvents.reduce((sum: number, e: any) => sum + (e.confidence || 0), 0) /
                      motionEvents.length
                    ).toFixed(0)
                  : "0"
              }
              unit="%"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">분석 결과</TabsTrigger>
              <TabsTrigger value="details">상세 목록</TabsTrigger>
              <TabsTrigger value="corrections">보정 이력</TabsTrigger>
            </TabsList>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* MOD Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>MOD 값 분포</CardTitle>
                    <CardDescription>각 동작별 MOD 값</CardDescription>
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
                    <CardTitle>코드 유형 분포</CardTitle>
                    <CardDescription>MODAPTS 코드 유형별 비율</CardDescription>
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
                  <CardTitle>동작 이벤트 상세</CardTitle>
                  <CardDescription>분석된 모든 동작 이벤트 목록</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/40">
                          <th className="text-left py-3 px-4 font-semibold">순번</th>
                          <th className="text-left py-3 px-4 font-semibold">코드</th>
                          <th className="text-left py-3 px-4 font-semibold">MOD</th>
                          <th className="text-left py-3 px-4 font-semibold">시간</th>
                          <th className="text-left py-3 px-4 font-semibold">설명</th>
                          <th className="text-left py-3 px-4 font-semibold">신뢰도</th>
                          <th className="text-left py-3 px-4 font-semibold">작업</th>
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
                  <CardTitle>보정 이력</CardTitle>
                  <CardDescription>수동 보정 기록</CardDescription>
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
                            <Badge variant="secondary">보정됨</Badge>
                          </div>
                          {correction.comment && <p className="text-sm italic text-muted-foreground">{correction.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">보정 이력이 없습니다</p>
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
