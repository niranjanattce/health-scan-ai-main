-- Create health_analyses table for storing analysis results
CREATE TABLE IF NOT EXISTS public.health_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  detected_indicators JSONB NOT NULL,
  conditions JSONB NOT NULL,
  recommended_tests JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.health_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for now, no auth required)
CREATE POLICY "Anyone can insert analyses"
ON public.health_analyses
FOR INSERT
WITH CHECK (true);

-- Allow anyone to view their recent analyses
CREATE POLICY "Anyone can view analyses"
ON public.health_analyses
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_health_analyses_created_at ON public.health_analyses(created_at DESC);