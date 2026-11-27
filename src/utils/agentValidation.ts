const PERSONAL_PROVIDERS = new Set([
  'gmail', 'googlemail', 'yahoo', 'ymail', 'rocketmail', 'yopmail', 'outlook',
  'hotmail', 'live', 'msn', 'icloud', 'aol', 'proton', 'protonmail', 'gmx',
  'yandex', 'zohomail', 'mailinator', 'guerrillamail', 'tempmail', '10minutemail',
  'sharklasers', 'trashmail', 'getnada', 'maildrop',
]);
const SLD_PARTS = new Set(['co', 'com', 'org', 'net', 'ac', 'gov', 'edu']);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns the provider/company label of the domain, e.g. acme.co.uk -> "acme" */
const mainLabel = (domain: string) => {
  const parts = domain.split('.');
  if (parts.length >= 3 && SLD_PARTS.has(parts[parts.length - 2]) && parts[parts.length - 1].length === 2) {
    return parts[parts.length - 3];
  }
  return parts[parts.length - 2];
};

export const isCompanyEmail = (email: string) => {
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return false;
  const label = mainLabel(e.split('@')[1]);
  return !!label && !PERSONAL_PROVIDERS.has(label);
};

export const validateProfessional = (companyName: string, companyEmail: string, companyPhone: string) => {
  const errors: { companyName?: string; companyEmail?: string; companyPhone?: string } = {};
  const name = companyName.trim();
  const email = companyEmail.trim();
  const phone = companyPhone.trim();

  if (!name && !email && !phone) return errors; 

  if (!name) errors.companyName = 'Enter the company name, since a company email was provided.';
  if(!phone) errors.companyPhone = 'Enter the company phone number'
  if (!email) errors.companyEmail = 'Enter the company email, since a company name was provided.';
  else if (!EMAIL_RE.test(email.toLowerCase())) errors.companyEmail = 'Enter a valid email address.';
  else if (!isCompanyEmail(email)) {
    errors.companyEmail = 'Use your company email (e.g. grace@acme.com), not Gmail, Yahoo, etc.';
  }
  return errors;
};