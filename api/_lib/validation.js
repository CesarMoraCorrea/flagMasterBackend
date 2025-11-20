import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  avatar: z.string().url().optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const SubmitSchema = z.object({
  country: z.string().min(1),
  answer: z.string().min(1),
  timeTaken: z.number().min(0)
});