// src/types/agent.ts
export interface AgentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

export interface AgentFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface AgentRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  store_id: string;
  schoolId: string;
  isStandAlone: boolean;
}