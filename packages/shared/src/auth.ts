import * as z from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const CODE_LENGTH = 6;

export const emailSchema = z
  .email("Enter a valid email address.")
  .trim()
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`);

export const codeSchema = z
  .string()
  .regex(/^\d{6}$/, `Enter the ${CODE_LENGTH}-digit code.`);

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Use at most 80 characters."),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const emailOnlySchema = z.object({
  email: emailSchema,
});

export const codeOnlySchema = z.object({
  code: codeSchema,
});

export const resetPasswordSchema = z.object({
  code: codeSchema,
  password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type EmailOnlyInput = z.infer<typeof emailOnlySchema>;
export type CodeOnlyInput = z.infer<typeof codeOnlySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
