import { Activity, AlertTriangle, Beaker, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

interface AnalysisResultsProps {
  result: AnalysisResult | null;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  if (!result) {
    return (
      <div className="medical-card text-center py-12">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Waiting for Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Start your camera to begin live health indicator detection
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-medical-warning text-white';
      case 'low': return 'bg-medical-info text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-medical-success';
    if (confidence >= 0.4) return 'text-medical-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Analysis Summary
          </CardTitle>
          <CardDescription>
            Confidence: <span className={getConfidenceColor(result.overallConfidence)}>
              {(result.overallConfidence * 100).toFixed(0)}%
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{result.summary}</p>
        </CardContent>
      </Card>

      {/* Detected Indicators */}
      {result.detectedIndicators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Detected Indicators
            </CardTitle>
            <CardDescription>
              Observable features identified in the analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.detectedIndicators.map((indicator, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{indicator.indicator}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      • {indicator.location}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {(indicator.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={indicator.confidence * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Potential Conditions */}
      {result.conditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" />
              Potential Conditions
            </CardTitle>
            <CardDescription>
              Areas that may warrant further investigation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.conditions.map((condition, idx) => (
              <div key={idx} className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold">{condition.condition}</h4>
                  <Badge className={getConfidenceColor(condition.confidence)}>
                    {(condition.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {condition.reasoning}
                </p>
                <div className="flex flex-wrap gap-2">
                  {condition.matchedIndicators.map((indicator, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommended Tests */}
      {result.recommendedTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-primary" />
              Recommended Laboratory Tests
            </CardTitle>
            <CardDescription>
              Tests to help evaluate the detected indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.recommendedTests.map((test, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Badge className={getPriorityColor(test.priority)}>
                  {test.priority}
                </Badge>
                <div className="flex-1">
                  <h5 className="font-medium text-sm">{test.test}</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    {test.reason}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Medical Disclaimer */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-destructive">Medical Disclaimer:</strong> {result.disclaimer}
            This analysis is for informational purposes only and should not replace professional medical advice, 
            diagnosis, or treatment. Always consult with qualified healthcare providers for proper evaluation 
            and personalized recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}