// src/types/student-management.ts

export interface StudentStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
}

export interface StudentFilters {
  searchQuery: string;
  statusFilter: string;
  gradeFilter: string;
}

export interface PinData {
  currentPin: string;
  newPin: string;
  confirmPin: string;
}

export interface SchoolProfile {
  schoolId: string;
  schoolName: string;
  schoolType: string;
  ownership: string;
  Link: string;
}