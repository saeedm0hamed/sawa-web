/* eslint-disable @typescript-eslint/no-unused-vars */
// Firebase has been removed - this file is kept for compatibility
// Replace with Clerk/MongoDB/Prisma later

// Stub functions that return null/empty to prevent errors
export const registerWithEmail = async (email: string, password: string) => {
  throw new Error("Authentication not configured. Please set up Clerk/MongoDB.");
};

export const loginWithEmail = async (email: string, password: string) => {
  throw new Error("Authentication not configured. Please set up Clerk/MongoDB.");
};

export const loginWithGoogle = async () => {
  throw new Error("Authentication not configured. Please set up Clerk/MongoDB.");
};

export const logoutUser = async () => {
  // No-op
};

export const saveUserProfile = async (uid: string, data: any) => {
  throw new Error("Database not configured. Please set up MongoDB/Prisma.");
};

export const getUserProfile = async (uid: string) => {
  return null;
};

export const getCurrentUser = async () => {
  return null;
};

export const resetPassword = async (email: string) => {
  throw new Error("Authentication not configured. Please set up Clerk/MongoDB.");
};

export const updateUserProfile = async (uid: string, newData: any) => {
  throw new Error("Database not configured. Please set up MongoDB/Prisma.");
};

export const sendVerificationLink = async () => {
  throw new Error("Authentication not configured. Please set up Clerk/MongoDB.");
};

export const checkEmailVerificationAndUpdate = async () => {
  // No-op
};
