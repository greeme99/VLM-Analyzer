import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload as UploadIcon, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Play,
  Pause,
  BarChart3,
  Brain,
  Download
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getTranslation } from "@/lib/i18n";

/**
 * Upload Page - VLM-based Motion Analysis Platform
 * AI Workflow: Input (Video/Prompt) -> Processing (Inference) -> Output (Analysis)
 */
export default function UploadPage() {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [confidenceData, setConfidenceData] = useState<any[]>([]);

  const t = (key: string) => getTranslation(language, key);

  // tRPC mutations
  const createProjectMutation = trpc.project.create.useMutation();
  const startAnalysisMutation = trpc.analysis.startAnalysis.useMutation();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("auth.loginRequired")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("border-blue-500", "bg-blue-50/10");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-blue-500", "bg-blue-50/10");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-blue-500", "bg-blue-50/10");
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const supportedFormats = ["video/mp4", "video/x-msvideo", "video/quicktime", "video/x-matroska", "video/x-flv"];
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!supportedFormats.includes(file.type)) {
      setError(t("upload.invalidFormat"));
      return;
    }

    if (file.size > maxSize) {
      setError(t("upload.fileTooLarge"));
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create video preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalysisStart = async () => {
    if (!selectedFile || !analysisPrompt.trim()) {
      setError(t("upload.missingInput"));
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);
    setError(null);

    try {
      // Step 1: Prepare video data
      setAnalysisStep(1);
      const videoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      });

      // Step 2: Create Project
      setAnalysisStep(2);
      const projectResult = await createProjectMutation.mutateAsync({
        title: selectedFile.name.replace(/\.[^.]*$/, ""),
        description: analysisPrompt,
        videoUrl: videoDataUrl,
        videoKey: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        videoDuration: "0", // Will be calculated by backend
      });

      if (!projectResult.id) {
        throw new Error("Failed to create project");
      }

      // Step 3: Start Analysis with Gemini
      setAnalysisStep(3);
      const analysisResult = await startAnalysisMutation.mutateAsync({
        projectId: projectResult.id,
        videoUrl: videoDataUrl,
        analysisPrompt: analysisPrompt,
      });

      // Convert motion events to display format
      const displayResults = analysisResult.analysis?.motions?.map((motion: any) => ({
        time: motion.timeRange,
        action: motion.description,
        confidence: motion.confidence,
      })) || [];

      const confidenceChartData = analysisResult.analysis?.motions?.map((motion: any) => ({
        name: motion.description,
        value: Math.round(motion.confidence * 100),
      })) || [];

      setAnalysisResults(displayResults);
      setConfidenceData(confidenceChartData);

      toast.success(t("upload.analysisComplete"));

      // Redirect to project detail page after 2 seconds
      setTimeout(() => {
        setLocation(`/projects/${projectResult.id}`);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("upload.analysisFailed");
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${
      theme === "light"
        ? "bg-white"
        : theme === "dark"
          ? "bg-slate-950"
          : "bg-blue-50"
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-500" />
            {t("nav.upload")}
          </h1>
          <p className="text-muted-foreground">
            {t("upload.videoUploadDesc")}
          </p>
        </div>

        {/* Main Layout: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Input & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Dropzone */}
            <Card className={`border-2 border-dashed transition-all ${
              theme === "light"
                ? "border-gray-300 hover:border-blue-400"
                : theme === "dark"
                  ? "border-slate-700 hover:border-blue-500"
                  : "border-blue-200 hover:border-blue-400"
            }`}>
              <CardContent className="p-8">
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer text-center space-y-4"
                >
                  <UploadIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="font-semibold">{t("upload.dragDrop")}</p>
                    <p className="text-sm text-gray-500">{t("upload.supportedFormats")}</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Video Preview */}
            {videoPreview && (
              <Card>
                <CardContent className="p-4">
                  <video
                    src={videoPreview}
                    className="w-full h-auto rounded-lg"
                    controls
                  />
                  <div className="mt-4 text-sm">
                    <p className="font-semibold">{selectedFile?.name}</p>
                    <p className="text-gray-500">
                      {(selectedFile?.size || 0) / 1024 / 1024 > 0 
                        ? `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB`
                        : "0 MB"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("upload.analysisPrompt")}</CardTitle>
                <CardDescription>{t("upload.analysisPromptDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={t("upload.promptPlaceholder")}
                  value={analysisPrompt}
                  onChange={(e) => setAnalysisPrompt(e.target.value)}
                  className="min-h-24"
                />
              </CardContent>
            </Card>

            {/* Start Button */}
            <Button
              onClick={handleAnalysisStart}
              disabled={!selectedFile || !analysisPrompt.trim() || isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("upload.analyzing")}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t("upload.startAnalysis")}
                </>
              )}
            </Button>

            {/* Error Alert */}
            {error && (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right Column: Analysis Progress & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress */}
            {isAnalyzing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("upload.analyzing")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        {analysisStep === 1 && t("upload.step1")}
                        {analysisStep === 2 && t("upload.step2")}
                        {analysisStep === 3 && t("upload.step3")}
                      </span>
                      <span className="text-sm text-gray-500">{analysisStep}/3</span>
                    </div>
                    <Progress value={(analysisStep / 3) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {analysisResults.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      {t("upload.analysisResults")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResults.map((result, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{result.action}</p>
                            <p className="text-xs text-gray-500">{result.time}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{Math.round(result.confidence * 100)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Download Buttons */}
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    {t("upload.downloadPDF")}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    {t("upload.downloadExcel")}
                  </Button>
                </div>
              </>
            )}

            {/* Empty State */}
            {!isAnalyzing && analysisResults.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">{t("upload.noResults")}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
