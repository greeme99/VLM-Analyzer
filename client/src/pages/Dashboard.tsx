import React, { useMemo } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "../components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";


/**
 * 대시보드 페이지
 * 분석 이력, 성능 통계, 사용자 분석 데이터 시각화
 */

export function Dashboard() {

  // 대시보드 데이터 조회
  const dashboardQuery = trpc.dashboard.getDashboardData.useQuery();
  const successRateQuery = trpc.dashboard.getSuccessRateStats.useQuery();
  const analysisTimeQuery = trpc.dashboard.getAnalysisTimeStats.useQuery();
  const confidenceQuery = trpc.dashboard.getConfidenceStats.useQuery();
  const frameProcessingQuery = trpc.dashboard.getFrameProcessingStats.useQuery();
  const hourlyActivityQuery = trpc.dashboard.getHourlyActivityStats.useQuery();
  const dailyActivityQuery = trpc.dashboard.getDailyActivityStats.useQuery();

  const isLoading =
    dashboardQuery.isLoading ||
    successRateQuery.isLoading ||
    analysisTimeQuery.isLoading ||
    confidenceQuery.isLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = dashboardQuery.data;
  const successRate = successRateQuery.data;
  const analysisTime = analysisTimeQuery.data;
  const confidence = confidenceQuery.data;
  const frameProcessing = frameProcessingQuery.data;
  const hourlyActivity = hourlyActivityQuery.data || [];
  const dailyActivity = dailyActivityQuery.data || [];

  // 신뢰도 분포 데이터
  const confidenceDistribution = confidence
    ? [
        { name: "0-20%", value: confidence.distribution["0-20"] },
        { name: "20-40%", value: confidence.distribution["20-40"] },
        { name: "40-60%", value: confidence.distribution["40-60"] },
        { name: "60-80%", value: confidence.distribution["60-80"] },
        { name: "80-100%", value: confidence.distribution["80-100"] },
      ]
    : [];

  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">분석 대시보드</h1>
        <p className="text-gray-500 mt-2">분석 이력, 성능 통계, 사용자 분석 데이터</p>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 분석 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.userAnalytics.totalAnalyses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">이번 주: {data?.summary.thisWeek.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">성공률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate?.overall || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">이번 달: {successRate?.thisMonth || 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">평균 분석 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisTime?.average || 0}초</div>
            <p className="text-xs text-gray-500 mt-1">최소: {analysisTime?.min || 0}초</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">평균 신뢰도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confidence?.average || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">최대: {confidence?.max || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간대별 분석 활동 */}
        <Card>
          <CardHeader>
            <CardTitle>시간대별 분석 활동</CardTitle>
            <CardDescription>하루 중 분석이 가장 많이 이루어지는 시간</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 요일별 분석 활동 */}
        <Card>
          <CardHeader>
            <CardTitle>요일별 분석 활동</CardTitle>
            <CardDescription>요일별 분석 빈도</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 신뢰도 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>신뢰도 분포</CardTitle>
            <CardDescription>분석 결과의 신뢰도 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={confidenceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {confidenceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 성공률 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>성공률 추이</CardTitle>
            <CardDescription>기간별 성공률</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">오늘</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${successRate?.today || 0}%` }}></div>
                  </div>
                  <span className="text-sm font-bold">{successRate?.today || 0}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">이번 주</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${successRate?.thisWeek || 0}%` }}></div>
                  </div>
                  <span className="text-sm font-bold">{successRate?.thisWeek || 0}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">이번 달</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${successRate?.thisMonth || 0}%` }}></div>
                  </div>
                  <span className="text-sm font-bold">{successRate?.thisMonth || 0}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">전체</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${successRate?.overall || 0}%` }}></div>
                  </div>
                  <span className="text-sm font-bold">{successRate?.overall || 0}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 프레임 처리 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>프레임 처리 통계</CardTitle>
          <CardDescription>분석된 프레임 및 MODAPTS 코드 통계</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">평균 프레임</p>
              <p className="text-2xl font-bold text-blue-600">{frameProcessing?.averageFrames || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">평균 MOD</p>
              <p className="text-2xl font-bold text-green-600">{frameProcessing?.averageMods || 0}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">총 프레임</p>
              <p className="text-2xl font-bold text-purple-600">{frameProcessing?.totalFrames || 0}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">총 MOD</p>
              <p className="text-2xl font-bold text-orange-600">{frameProcessing?.totalMods || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 분석 이력 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 분석 이력</CardTitle>
          <CardDescription>최근 10개의 분석 기록</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.recentAnalyses && data.recentAnalyses.length > 0 ? (
              data.recentAnalyses.map((analysis, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{new Date(analysis.startedAt * 1000).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{analysis.analysisPrompt}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${analysis.status === "completed" ? "text-green-600" : "text-red-600"}`}>
                      {analysis.status === "completed" ? "완료" : "실패"}
                    </p>
                    <p className="text-xs text-gray-500">{analysis.duration}초</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">분석 이력이 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
