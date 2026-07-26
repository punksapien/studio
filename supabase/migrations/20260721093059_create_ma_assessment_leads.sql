CREATE TABLE IF NOT EXISTS public.ma_assessment_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'popup_ma_assessment',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ma_assessment_leads_email ON public.ma_assessment_leads(email);
COMMENT ON TABLE public.ma_assessment_leads IS 'Email leads captured by the Private M&A Assessment site pop-up.';
ALTER TABLE public.ma_assessment_leads ENABLE ROW LEVEL SECURITY;
