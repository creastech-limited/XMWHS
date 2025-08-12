/**
 * Represents bank data from API response
 */
export interface BankApiResponse {
  id: number;
  name: string;
  code: string;
  slug?: string;
  active?: boolean;
}

/**
 * Client-side bank representation
 */
export interface Bank {
  id: string;
  name: string;
  code: string;
}