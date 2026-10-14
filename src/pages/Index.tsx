import { useState } from 'react';
import { Heart, Shield, Sparkles, Camera, Upload } from 'lucide-react';
import CameraView from '@/components/CameraView';
import ImageUpload from '@/components/ImageUpload';
import AnalysisResults from '@/components/AnalysisResults';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

const Index = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="medical-container">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Health Lens</h1>
                <p className="text-xs text-muted-foreground">AI Health Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-medical-success" />
              <span className="text-xs text-muted-foreground">Secure & Private</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="medical-container py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Live AI Analysis</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your Personal Health Assistant
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Get instant insights into your health with real-time facial analysis. 
            Our AI detects visible health indicators and recommends appropriate laboratory tests.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="medical-card text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Real-Time Detection</h3>
            <p className="text-sm text-muted-foreground">
              Continuous facial analysis with live updates every second
            </p>
          </div>
          <div className="medical-card text-center">
            <div className="w-12 h-12 rounded-full bg-medical-info/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-medical-info" />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
            <p className="text-sm text-muted-foreground">
              Advanced vision AI trained on medical health indicators
            </p>
          </div>
          <div className="medical-card text-center">
            <div className="w-12 h-12 rounded-full bg-medical-success/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-medical-success" />
            </div>
            <h3 className="font-semibold mb-2">Privacy First</h3>
            <p className="text-sm text-muted-foreground">
              No images stored • Secure processing • Your data stays private
            </p>
          </div>
        </div>

        {/* Camera & Upload Tabs */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Choose Analysis Method</h3>
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Live Camera
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Image
                </TabsTrigger>
              </TabsList>
              <TabsContent value="camera" className="mt-6">
                <CameraView onAnalysisComplete={setCurrentAnalysis} />
              </TabsContent>
              <TabsContent value="upload" className="mt-6">
                <ImageUpload onAnalysisComplete={setCurrentAnalysis} />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Analysis Results</h3>
            <AnalysisResults result={currentAnalysis} />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted py-16">
        <div className="medical-container">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: "Choose Method", desc: "Use live camera or upload a photo for analysis" },
              { step: 2, title: "AI Analysis", desc: "Our AI analyzes your face for visible health indicators" },
              { step: 3, title: "Get Results", desc: "View detected indicators and potential health concerns" },
              { step: 4, title: "Take Action", desc: "Consult with healthcare providers using test recommendations" }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-8">
        <div className="medical-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Health Lens. Made with AI technology.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Your health data is secure and private</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;