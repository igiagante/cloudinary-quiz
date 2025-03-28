import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Temporary function until Clerk authentication is implemented
export function getTestUserId() {
  return "a77c7b9b-aa9d-4f90-b70a-ab74206a7d8e";
}
