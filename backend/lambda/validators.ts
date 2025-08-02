import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const signupSchema = loginSchema;

export const analyzeSchema = z.object({
  text: z.string().min(1),
});
