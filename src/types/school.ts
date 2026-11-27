export interface FeeReportTotals {
  expected: number;
  collected: number;
  outstanding: number;
  overdue: number;
  collectionRate: number;
  students: number;
  paidInFull: number;
  partlyPaid: number;
  notPaid: number;
}

export interface FeeReportGroup extends FeeReportTotals {
  feeId: string;
  feeType: string;
  term?: string;
  session: string;
  className: string;
}

export interface FeeReport {
  totals: FeeReportTotals;
  groupBy: string;
  groups: FeeReportGroup[];
}

export interface FeeReportParams {
  session?: string;
  term?: string;
  feeType?: string;
  className?: string;
  feeId?: string;
  groupBy?: string;
}