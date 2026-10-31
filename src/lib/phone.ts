// Normaliza un número argentino al formato de wa.me (549 + código de área + número).
// Si ya viene con 54 adelante, se deja como está.
export function toWaNumber(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) return digits;
  digits = digits.replace(/^0/, ""); // 011... -> 11...
  return `549${digits}`;
}

// Acepta dígitos, espacios, +, guiones y paréntesis, con 8 a 15 dígitos en total
export function isValidPhone(input: string): boolean {
  const digits = input.replace(/\D/g, "").length;
  return digits >= 8 && digits <= 15 && !/[^\d\s+()-]/.test(input);
}
