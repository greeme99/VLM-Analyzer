import React, { useRef, useState } from "react";
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
    const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"];
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!validTypes.includes(file.type)) {
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
      // Step 1: Video Encoding
      setAnalysisStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Tokenization
      setAnalysisStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Analysis
      setAnalysisStep(3);
      
      // Mock analysis results
      const mockResults = [
        { time: "0:00-0:05", action: "준비 자세", confidence: 0.95 },
        { time: "0:05-0:12", action: "동작 수행", confidence: 0.88 },
        { time: "0:12-0:18", action: "마무리", confidence: 0.92 },
      ];

      const mockConfidence = [
        { name: "준비 자세", value: 95 },
        { name: "동작 수행", value: 88 },
        { name: "마무리", value: 92 },
      ];

      setAnalysisResults(mockResults);
      setConfidenceData(mockConfidence);

      toast.success(t("upload.analysisComplete"));
    } catch (err) {
      setError(t("upload.analysisFailed"));
      toast.error(t("upload.analysisFailed"));
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
                  className="text-center cursor-pointer transition-all"
                >
                  {videoPreview ? (
                    <div className="space-y-4">
                      <video
                        src={videoPreview}
                        className="w-full h-40 rounded-lg object-cover"
                        controls
                      />
                      <div className="text-sm">
                        <p className="font-semibold">{selectedFile?.name}</p>
                        <p className="text-muted-foreground">
                          {(selectedFile?.size || 0) / 1024 / 1024 > 0
                            ? `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB`
                            : ""}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setVideoPreview(null);
                        }}
                      >
                        {t("upload.changeFile")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <UploadIcon className="h-12 w-12 mx-auto text-blue-500 opacity-50" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {t("upload.dragDrop")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("upload.supportedFormats")}
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Analysis Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  {t("upload.analysisPrompt")}
                </CardTitle>
                <CardDescription>
                  {t("upload.analysisPromptDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={t("upload.promptPlaceholder")}
                  value={analysisPrompt}
                  onChange={(e) => setAnalysisPrompt(e.target.value)}
                  className="min-h-24"
                />
              </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">
                        {analysisStep === 1 && t("upload.step1")}
                        {analysisStep === 2 && t("upload.step2")}
                        {analysisStep === 3 && t("upload.step3")}
                      </span>
                      <span className="text-muted-foreground">
                        {analysisStep * 33}%
                      </span>
                    </div>
                    <Progress value={analysisStep * 33} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("upload.analyzing")}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Start Button */}
            <Button
              onClick={handleAnalysisStart}
              disabled={!selectedFile || !analysisPrompt.trim() || isAnalyzing}
              size="lg"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
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
          </div>

          {/* Right Column: Analysis Results & Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Real-time Motion Labeling */}
            {analysisResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    {t("upload.analysisResults")}
                  </CardTitle>
                  <CardDescription>
                    {t("upload.motionLabeling")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border transition-all ${
                          theme === "light"
                            ? "bg-gray-50 border-gray-200"
                            : theme === "dark"
                              ? "bg-slate-800 border-slate-700"
                              : "bg-blue-100/50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-500">
                              {result.time}
                            </p>
                            <p className="text-foreground font-medium mt-1">
                              {result.action}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" />
                              <span className="text-sm font-semibold text-emerald-500">
                                {Math.round(result.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confidence Chart */}
            {confidenceData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    {t("upload.confidenceChart")}
                  </CardTitle>
                  <CardDescription>
                    {t("upload.confidenceDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {confidenceData.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-blue-500 font-semibold">
                            {item.value}%
                          </span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${
                          theme === "light"
                            ? "bg-gray-200"
                            : theme === "dark"
                              ? "bg-slate-700"
                              : "bg-blue-200"
                        }`}>
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Download Results */}
            {analysisResults.length > 0 && (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  {t("upload.downloadPDF")}
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  {t("upload.downloadExcel")}
                </Button>
              </div>
            )}

            {/* Empty State */}
            {analysisResults.length === 0 && !isAnalyzing && (
              <Card className={`border-dashed ${
                theme === "light"
                  ? "border-gray-300 bg-gray-50"
                  : theme === "dark"
                    ? "border-slate-700 bg-slate-900"
                    : "border-blue-200 bg-blue-50/30"
              }`}>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground text-center">
                    {t("upload.noResults")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
