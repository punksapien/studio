-- Create function to get monthly user growth statistics
CREATE OR REPLACE FUNCTION public.get_monthly_user_growth()
RETURNS TABLE (
  month TEXT,
  sellers INTEGER,
  buyers INTEGER,
  total INTEGER
)
LANGUAGE sql
STABLE
AS $$
  WITH months AS (
    SELECT
      date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * generate_series(0, 11)) AS month_date
  ),
  monthly_counts AS (
    SELECT
      date_trunc('month', created_at) AS month_date,
      SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END)::INTEGER AS sellers,
      SUM(CASE WHEN role = 'buyer' THEN 1 ELSE 0 END)::INTEGER AS buyers,
      COUNT(*)::INTEGER AS total
    FROM user_profiles
    WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      AND role IN ('seller', 'buyer')
    GROUP BY date_trunc('month', created_at)
  )
  SELECT
    to_char(m.month_date, 'Mon YYYY') AS month,
    COALESCE(mc.sellers, 0) AS sellers,
    COALESCE(mc.buyers, 0) AS buyers,
    COALESCE(mc.total, 0) AS total
  FROM months m
  LEFT JOIN monthly_counts mc ON m.month_date = mc.month_date
  ORDER BY m.month_date;
$$;
