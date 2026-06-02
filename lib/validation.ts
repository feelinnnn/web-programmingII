export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function validateEmail(email: string) {
  if (!email) return "Email is required.";

  if (!emailRegex.test(email)) {
    return "Invalid email format.";
  }

  return null;
}

export function validateUsername(username: string) {
  if (!username) return "Username is required.";

  if (!usernameRegex.test(username)) {
    return "Username must be 3-20 characters and contain only letters, numbers, or _.";
  }

  return null;
}

export function validatePassword(password: string) {
  if (!password) return "Password is required.";

  if (!passwordRegex.test(password)) {
    return "Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter and 1 number.";
  }

  return null;
}