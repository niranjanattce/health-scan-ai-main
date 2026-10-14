import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraCapture } from '@/utils/camera';
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

interface CameraViewProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export default function CameraView({ onAnalysisComplete }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<CameraCapture | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<number>(0);

  useEffect(() => {
    cameraRef.current = new CameraCapture();
    
    return () => {
      cameraRef.current?.stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      if (videoRef.current && cameraRef.current) {
        await cameraRef.current.startCamera(videoRef.current);
        setIsActive(true);
        
        // Start continuous frame capture (1 frame per second)
        cameraRef.current.startContinuousCapture(handleFrameCapture, 1000);
        
        toast.success("Camera activated. Analysis will begin automatically.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start camera";
      setError(message);
      toast.error(message);
    }
  };

  const stopCamera = () => {
    cameraRef.current?.stopCamera();
    setIsActive(false);
    setIsAnalyzing(false);
    toast.info("Camera stopped");
  };

  const handleFrameCapture = async (frameData: string) => {
    // Prevent multiple simultaneous analyses
    const now = Date.now();
    if (isAnalyzing || now - lastAnalysis < 2000) {
      return;
    }

    setIsAnalyzing(true);
    setLastAnalysis(now);

    try {
      console.log("Sending frame for analysis...");
      
      const { data, error } = await supabase.functions.invoke('analyze-health', {
        body: { imageData: frameData }
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
        
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      const message = err instanceof Error ? err.message : "Analysis failed";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden shadow-[var(--shadow-strong)]">
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Ready to Begin</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Start your camera to begin real-time facial health analysis. Make sure you're in good lighting.
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
              onClick={startCamera}
              className="animate-pulse-glow"
            >
              <Camera className="mr-2" />
              Start Camera
            </Button>
          </div>
        )}
        
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!isActive ? 'hidden' : ''}`}
          playsInline
          muted
        />
        
        {isActive && (
          <>
            {isAnalyzing && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Analyzing...</span>
              </div>
            )}
            
            <div className="absolute top-4 right-4">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Button 
                variant="secondary" 
                onClick={stopCamera}
              >
                Stop Camera
              </Button>
            </div>
          </>
        )}
      </div>
      
      {isActive && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Live analysis running • Your privacy is protected • No images are stored
        </p>
      )}
    </div>
  );
}