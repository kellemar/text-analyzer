import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, LogOut, Loader2, Globe, Users, Building2, User } from "lucide-react";
import { useTextAnalysis } from "@/hooks/useTextAnalysis";
import { ApiError } from "@/services/textAnalysisApi";
import { validateFile, formatFileSize } from "@/utils/fileValidation";
import { PRDAnalysisResponse, mapApiResponseToPRD } from "@/utils/textProcessing";

type AnalysisResult = PRDAnalysisResponse;

interface Session {
  access_token: string;
  expires_at: string;
}

interface TextAnalyzerProps {
  username: string;
  session: Session | null;
  onLogout: () => void;
}

export const TextAnalyzer = ({ username, session, onLogout }: TextAnalyzerProps) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzedText, setAnalyzedText] = useState<string>(""); // Store text for language detection
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const analysisMutation = useTextAnalysis({
    onSuccess: (data) => {
      // Log the API response for debugging
      console.log('API Response:', data);
      
      // Map API response to PRD structure
      const prdResponse = mapApiResponseToPRD(data, analyzedText);
      console.log('Mapped PRD Response:', prdResponse);
      
      setResult(prdResponse);
      toast({
        title: "Analysis Complete",
        description: "Content has been successfully analyzed",
      });
    },
    onError: (error) => {
      let title = "Analysis Failed";
      let description = error.message;
      
      // Provide better error messages based on error type
      if (error instanceof ApiError) {
        if (error.category === 'config') {
          title = "Configuration Error";
          description = "Please check your API settings";
        } else if (error.category === 'network') {
          title = "Connection Error";
        }
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file using shared utility
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast({
        title: "File Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setText(""); // Clear text input when file is selected
    toast({
      title: "File Selected",
      description: `${file.name} is ready for analysis`,
    });
  };

  const analyzeContent = async () => {
    // Validate that either text or file is provided
    if (!text.trim() && !selectedFile) {
      toast({
        title: "No Content",
        description: "Please enter text or select a file to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store the text for language detection
      let textForAnalysis = text.trim();
      
      // If a file is selected, we'll read it for language detection
      if (selectedFile && !textForAnalysis) {
        if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')) {
          textForAnalysis = await selectedFile.text();
        } else {
          // For other file types, we'll use a default since we can't easily extract text client-side
          textForAnalysis = '';
        }
      }
      
      setAnalyzedText(textForAnalysis);
      
      await analysisMutation.mutateAsync({
        text: text.trim() || undefined,
        file: selectedFile || undefined,
        accessToken: session?.access_token,
        options: {
          includeEntities: true,
          includeSummary: true,
        }
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const clearAll = () => {
    setText("");
    setSelectedFile(null);
    setResult(null);
    setAnalyzedText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const exportResults = () => {
    if (!result) return;
    
    const exportData = {
      analyzedAt: new Date().toISOString(),
      text: text ? text.substring(0, 200) + "..." : "[File upload]",
      analysis: result
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                TextAnalyzer Pro
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {username}</p>
            </div>
            <Button variant="outline" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Input Section */}
        <Card className="shadow-[var(--shadow-card)] border-border/50 bg-gradient-to-b from-card to-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Document Input
            </CardTitle>
            <CardDescription>
              Upload a document or paste text directly for analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload Document</Label>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Supports .txt, .docx, and .pdf files (max 10MB)
              </span>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-border"></div>
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 border-t border-border"></div>
            </div>

            {/* Text Input Section */}
            <div className="space-y-2">
              <Label htmlFor="text-input">Paste text directly</Label>
              <Textarea
                id="text-input"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value.trim() && selectedFile) {
                    setSelectedFile(null); // Clear file when typing
                  }
                }}
                placeholder="Paste your text here for analysis..."
                className="min-h-[200px] transition-all duration-300 focus:shadow-[var(--shadow-glow)]"
                disabled={!!selectedFile}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={analyzeContent}
                disabled={analysisMutation.isPending || (!text.trim() && !selectedFile)}
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-[var(--shadow-glow)] transition-all duration-300"
              >
                {analysisMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Content"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={clearAll}
                disabled={analysisMutation.isPending}
              >
                Clear
              </Button>
            </div>

            {/* Error Display */}
            {analysisMutation.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">
                  {analysisMutation.error.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Summary - Full Width */}
            <Card className="shadow-[var(--shadow-card)] border-border/50 bg-gradient-to-b from-card to-card/80">
              <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Article Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{result.article_summary}</p>
              </CardContent>
            </Card>

            {/* Grid for other results */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Nationalities */}
              <Card className="shadow-[var(--shadow-card)] border-border/50 bg-gradient-to-b from-card to-card/80">
                <CardHeader>
                  <CardTitle className="text-lg text-accent flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Nationalities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.nationalities && Array.isArray(result.nationalities) && result.nationalities.length > 0 ? (
                      result.nationalities.map((nationality: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-accent/10 text-green-600 rounded-full text-sm border border-accent/20"
                        >
                          {nationality}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None detected</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Organizations */}
              <Card className="shadow-[var(--shadow-card)] border-border/50 bg-gradient-to-b from-card to-card/80">
                <CardHeader>
                  <CardTitle className="text-lg text-primary flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Organizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.organizations && Array.isArray(result.organizations) && result.organizations.length > 0 ? (
                      result.organizations.map((org: string, index: number) => (
                        <div
                          key={index}
                          className="px-3 py-2 bg-primary/5 text-primary rounded-md text-sm border border-primary/10"
                        >
                          {org}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None detected</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* People */}
              <Card className="shadow-[var(--shadow-card)] border-border/50 bg-gradient-to-b from-card to-card/80">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <User className="h-5 w-5" />
                    People Mentioned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.people && Array.isArray(result.people) && result.people.length > 0 ? (
                      result.people.map((person: string, index: number) => (
                        <div
                          key={index}
                          className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
                        >
                          {person}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None detected</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              <Card className="shadow-[var(--shadow-card)] border-border/50 bg-gradient-to-b from-card to-card/80">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Languages Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.languages && Array.isArray(result.languages) && result.languages.length > 0 ? (
                      result.languages.map((language: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm border border-blue-200"
                        >
                          {language}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Unable to detect</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Export Button */}
        {result && (
          <div className="flex justify-center">
            <Button
              onClick={exportResults}
              variant="outline"
              className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              <Download className="h-4 w-4" />
              Export Results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};