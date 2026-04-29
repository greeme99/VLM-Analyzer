import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload as UploadIcon, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Upload Page - Video upload and analysis initiation
 */
export default function UploadPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProjectMutation = trpc.project.create.useMutation();

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

  const handleFileSelect = (file: File | null) => {
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    const validTypes = ["video/mp4", "video/x-msvideo", "video/quicktime", "video/x-matroska", "video/x-flv"];
    if (!validTypes.includes(file.type)) {
      setError("지원하지 않는 파일 형식입니다. MP4, AVI, MOV, MKV, FLV만 가능합니다.");
      return;
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError("파일 크기가 너무 큽니다. 500MB 이하만 가능합니다.");
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      setError("제목과 파일을 선택해주세요");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create project first
      const projectResult = await createProjectMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      if (!projectResult.success) {
        throw new Error("프로젝트 생성 실패");
      }

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success("분석이 시작되었습니다!");
      setLocation("/projects");
    } catch (err) {
      const message = err instanceof Error ? err.message : "업로드 실패";
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">새 분석 시작</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 정보</CardTitle>
              <CardDescription>분석할 프로젝트의 기본 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">프로젝트 제목 *</Label>
                <Input
                  id="title"
                  placeholder="예: 조립 공정 분석 - 2026-04-29"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명 (선택사항)</Label>
                <Textarea
                  id="description"
                  placeholder="이 분석에 대한 추가 정보를 입력하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>영상 파일 업로드</CardTitle>
              <CardDescription>제조 공정 영상을 업로드하세요 (최대 500MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  selectedFile
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                } ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp4,.avi,.mov,.mkv,.flv"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  disabled={isUploading}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                    <p className="font-semibold">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="font-semibold">영상 파일을 드래그하거나 클릭하세요</p>
                    <p className="text-sm text-muted-foreground">
                      MP4, AVI, MOV, MKV, FLV (최대 500MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">업로드 중...</span>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* File Info */}
              {selectedFile && !isUploading && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">파일 정보</p>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">파일명:</dt>
                    <dd className="font-mono">{selectedFile.name}</dd>
                    <dt className="text-muted-foreground">크기:</dt>
                    <dd>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</dd>
                    <dt className="text-muted-foreground">유형:</dt>
                    <dd>{selectedFile.type}</dd>
                  </dl>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => setLocation("/projects")}
              disabled={isUploading}
            >
              취소
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  분석 시작
                </>
              )}
            </Button>
          </div>

          {/* Info Box */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>팁:</strong> 최적의 분석 결과를 위해 밝은 환경에서 촬영된 영상을 권장합니다.
              한 명의 작업자와 1~3개의 부품을 포함한 30초 이내의 영상이 가장 좋습니다.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}
