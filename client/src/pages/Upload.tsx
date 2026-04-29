import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    ko: {
      loginRequired: "로그인이 필요합니다",
      startAnalysis: "새 분석 시작",
      projectInfo: "프로젝트 정보",
      projectInfoDesc: "분석할 프로젝트의 기본 정보를 입력하세요",
      projectTitle: "프로젝트 제목 *",
      projectTitlePlaceholder: "예: 조립 공정 분석 - 2026-04-29",
      description: "설명 (선택사항)",
      descriptionPlaceholder: "이 분석에 대한 추가 정보를 입력하세요",
      videoUpload: "영상 파일 업로드",
      videoUploadDesc: "제조 공정 영상을 업로드하세요 (최대 500MB)",
      dragDrop: "영상 파일을 드래그하거나 클릭하세요",
      supportedFormats: "MP4, AVI, MOV, MKV, FLV (최대 500MB)",
      fileInfo: "파일 정보",
      fileName: "파일명:",
      fileSize: "크기:",
      fileType: "유형:",
      uploading: "업로드 중...",
      cancel: "취소",
      startBtn: "분석 시작",
      uploadingBtn: "업로드 중...",
      tip: "팁:",
      tipText: "최적의 분석 결과를 위해 밝은 환경에서 촬영된 영상을 권장합니다. 한 명의 작업자와 1~3개의 부품을 포함한 30초 이내의 영상이 가장 좋습니다.",
      errorInvalidFormat: "지원하지 않는 파일 형식입니다. MP4, AVI, MOV, MKV, FLV만 가능합니다.",
      errorFileTooLarge: "파일 크기가 너무 큽니다. 500MB 이하만 가능합니다.",
      errorRequired: "제목과 파일을 선택해주세요",
      errorCreateFailed: "프로젝트 생성 실패",
      successStarted: "분석이 시작되었습니다!",
      errorUpload: "업로드 실패",
    },
    en: {
      loginRequired: "Login is required",
      startAnalysis: "Start New Analysis",
      projectInfo: "Project Information",
      projectInfoDesc: "Enter basic information for the project to analyze",
      projectTitle: "Project Title *",
      projectTitlePlaceholder: "e.g., Assembly Process Analysis - 2026-04-29",
      description: "Description (Optional)",
      descriptionPlaceholder: "Enter additional information about this analysis",
      videoUpload: "Video File Upload",
      videoUploadDesc: "Upload manufacturing process video (Max 500MB)",
      dragDrop: "Drag video file here or click to select",
      supportedFormats: "MP4, AVI, MOV, MKV, FLV (Max 500MB)",
      fileInfo: "File Information",
      fileName: "File name:",
      fileSize: "Size:",
      fileType: "Type:",
      uploading: "Uploading...",
      cancel: "Cancel",
      startBtn: "Start Analysis",
      uploadingBtn: "Uploading...",
      tip: "Tip:",
      tipText: "For optimal analysis results, we recommend videos shot in bright environments. Videos of 30 seconds or less with one worker and 1-3 parts work best.",
      errorInvalidFormat: "Unsupported file format. Only MP4, AVI, MOV, MKV, FLV are supported.",
      errorFileTooLarge: "File size is too large. Maximum 500MB is allowed.",
      errorRequired: "Please select a title and file",
      errorCreateFailed: "Project creation failed",
      successStarted: "Analysis has started!",
      errorUpload: "Upload failed",
    },
  };

  const text = t[language];

  const createProjectMutation = trpc.project.create.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{text.loginRequired}</AlertDescription>
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
      setError(text.errorInvalidFormat);
      return;
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError(text.errorFileTooLarge);
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
      setError(text.errorRequired);
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
        throw new Error(text.errorCreateFailed);
      }

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success(text.successStarted);
      setLocation("/projects");
    } catch (err) {
      const message = err instanceof Error ? err.message : text.errorUpload;
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
          <h1 className="text-2xl font-bold">{text.startAnalysis}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>{text.projectInfo}</CardTitle>
              <CardDescription>{text.projectInfoDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{text.projectTitle}</Label>
                <Input
                  id="title"
                  placeholder={text.projectTitlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{text.description}</Label>
                <Textarea
                  id="description"
                  placeholder={text.descriptionPlaceholder}
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
              <CardTitle>{text.videoUpload}</CardTitle>
              <CardDescription>{text.videoUploadDesc}</CardDescription>
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
                    <p className="font-semibold">{text.dragDrop}</p>
                    <p className="text-sm text-muted-foreground">
                      {text.supportedFormats}
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
                    <span className="text-sm font-medium">{text.uploading}</span>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* File Info */}
              {selectedFile && !isUploading && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">{text.fileInfo}</p>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">{text.fileName}</dt>
                    <dd className="font-mono">{selectedFile.name}</dd>
                    <dt className="text-muted-foreground">{text.fileSize}</dt>
                    <dd>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</dd>
                    <dt className="text-muted-foreground">{text.fileType}</dt>
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
              {text.cancel}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {text.uploadingBtn}
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  {text.startBtn}
                </>
              )}
            </Button>
          </div>

          {/* Info Box */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{text.tip}</strong> {text.tipText}
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}
