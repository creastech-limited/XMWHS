// src/types/registration.ts
export interface ClassInfo {
  className: string;
  section: string;
}

export interface SchoolInfo {
  _id: string;
  schoolName: string;
  schoolType: string;
  schoolAddress: string;
  classes: ClassInfo[];
}

export interface StudentRegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  classAdmittedTo: string;
  password: string;
  confirmPassword: string;
  phone: string;
  schoolId: string;
  schoolName: string;
  schoolType: string;
  schoolAddress: string;
  agreeToTerms: boolean;
}

export interface RegistrationFormErrors {
  firstName: string;
  lastName: string;
  email: string;
  classAdmittedTo: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: string;
}
export interface StoreRegistrationFormData {
  firstName: string;
  lastName: string;
  storeName: string;
  storeType: string;
  email: string;
  phone: string;
  location: string;
  password: string;
  confirmPassword: string;
  description: string;
}

export interface StoreRegistrationFormErrors {
  firstName: string;
  lastName: string;
  storeName: string;
  storeType: string;
  email: string;
  phone: string;
  location: string;
  password: string;
  confirmPassword: string;
  description: string;
}

// Add to existing registration.ts
export interface SchoolRegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolName: string;
  schoolAddress: string;
  phone: string;
  schoolType: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface SchoolRegistrationFormErrors {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolName: string;
  schoolAddress: string;
  phone: string;
  schoolType: string;
  password: string;
  confirmPassword: string;
  termsAccepted: string;
}// Add to existing registration.ts
export interface SecurityRegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface SecurityRegistrationFormErrors {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: string;
}