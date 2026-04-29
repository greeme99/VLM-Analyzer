import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Loader2, AlertCircle, BarChart3, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * Projects Page - List and manage analysis projects
 */
export default function ProjectsPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const projectsQuery = trpc.project.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>로그인이 필요합니다</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <Button onClick={() => setLocation("/upload")}>
            <Plus className="w-4 h-4 mr-2" />
            새 분석
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {projectsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : projectsQuery.data && projectsQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsQuery.data.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">분석 프로젝트가 없습니다</h2>
            <p className="text-muted-foreground mb-6">
              새로운 분석을 시작하려면 아래 버튼을 클릭하세요
            </p>
            <Button onClick={() => setLocation("/upload")}>
              <Plus className="w-4 h-4 mr-2" />
              첫 분석 시작하기
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Project Card Component
 */
function ProjectCard({ project }: { project: any }) {
  const [, setLocation] = useLocation();
  const deleteProjectMutation = trpc.project.delete.useMutation();

  const statusConfig: Record<string, { label: string; variant: any }> = {
    pending: { label: "대기 중", variant: "outline" },
    analyzing: { label: "분석 중", variant: "secondary" },
    completed: { label: "완료", variant: "default" },
    failed: { label: "실패", variant: "destructive" },
  };

  const status = statusConfig[project.status] || statusConfig.pending;

  const handleDelete = async () => {
    if (confirm("이 프로젝트를 삭제하시겠습니까?")) {
      try {
        await deleteProjectMutation.mutateAsync({ projectId: project.id });
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setLocation(`/projects/${project.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{project.title}</CardTitle>
            <CardDescription className="mt-2">
              {format(new Date(project.createdAt), "yyyy년 M월 d일 HH:mm", { locale: ko })}
            </CardDescription>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-border/40">
          <div>
            <p className="text-xs text-muted-foreground">표준시간</p>
            <p className="text-lg font-semibold">
              {project.standardTime ? `${parseFloat(project.standardTime).toFixed(2)}s` : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">MOD</p>
            <p className="text-lg font-semibold">{project.totalMods || "-"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/projects/${project.id}`);
            }}
          >
            상세보기
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={deleteProjectMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
