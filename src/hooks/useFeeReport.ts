import { useEffect, useState } from 'react';
import { type FeeReport, type FeeReportParams } from '../types/school';
import { getFeeReport } from '../services';

export const useFeeReport = (params: FeeReportParams) => {
  const [report, setReport] = useState<FeeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFeeReport(params)
      .then((r) => !cancelled && (setReport(r), setError(null)))
      .catch((e) => !cancelled && setError(e?.response?.data?.message || 'Failed to load fee report'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { report, loading, error };
};