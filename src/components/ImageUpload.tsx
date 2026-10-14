import { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisResult {
  detectedIndicators: Array<{
    indicator: string;
    confidence: number;
    location: string;
  }>;
  conditions: Array<{
    condition: string;
    matchedIndicators: string[];
    confidence: number;
    reasoning: string;
  }>;
  recommendedTests: Array<{
    test: string;
    priority: string;
    reason: string;
  }>;
  overallConfidence: number;
  summary: string;
  disclaimer: string;
}

interface ImageUploadProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export default function ImageUpload({ onAnalysisComplete }: ImageUploadProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      toast.error('Image size must be less than 10MB');
      return;
    }

    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to base64 and analyze
    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      console.log("Sending image for analysis...");
      
      const { data, error } = await supabase.functions.invoke('analyze-health', {
        body: { imageData: base64 }
      });

      if (error) {
        throw error;
      }

      if (data && data.detectedIndicators) {
        console.log("Analysis received:", data);
        onAnalysisComplete(data);
        
        // Save to database
        await supabase.from('health_analyses').insert({
          detected_indicators: data.detectedIndicators,
          conditions: data.conditions,
          recommended_tests: data.recommendedTests,
          confidence_score: data.overallConfidence,
          notes: data.summary
        });
        
        toast.success("Analysis complete!");
      } else if (data.error) {
        toast.error(data.error);
        setError(data.error);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden shadow-[var(--shadow-strong)]">
        {!previewUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Photo</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Upload a clear photo of your face for AI health analysis. Best results with good lighting and frontal view.
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <Button 
              variant="scan" 
              size="lg"
              onClick={handleUploadClick}
              disabled={isAnalyzing}
              className="animate-pulse-glow"
            >
              <Upload className="mr-2" />
              Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <>
            <img
              src={previewUrl}
              alt="Uploaded photo"
              className="w-full h-full object-cover"
            />
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Analyzing your photo...</p>
                </div>
              </div>
            )}
            
            {!isAnalyzing && (
              <div className="absolute top-4 right-4">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={clearImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="flex flex-col gap-2 mt-4">
        <p className="text-xs text-muted-foreground text-center">
          Supported formats: JPG, PNG, WEBP • Max size: 10MB
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Your privacy is protected • No images are stored permanently
        </p>
      </div>
    </div>
  );
}
