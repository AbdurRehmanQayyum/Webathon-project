import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(128)
  .regex(/[A-Za-z]/, 'Include a letter.')
  .regex(/[0-9]/, 'Include a number.')

export const fullNameSchema = z.string().trim().min(3, 'Enter your full name.').max(100)

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  rememberMe: z.boolean(),
})

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: z.email('Enter a valid email address.').max(256),
    registrationNumber: z
      .string()
      .trim()
      .min(3, 'Enter your registration or roll number.')
      .max(30)
      .regex(/^[A-Za-z0-9\-/]+$/, 'Use letters, numbers, hyphens or slashes only.'),
    semester: z.string().min(1, 'Choose your semester.'),
    password: passwordSchema,
    confirmPassword: z.string(),
    bio: z.string().max(500, 'Keep it under 500 characters.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'Choose a password you are not already using.',
  })

export const semesterOptions = Array.from({ length: 8 }, (_, index) => ({
  value: String(index + 1),
  label: `Semester ${index + 1}`,
}))

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export type RegisterPayload = Omit<RegisterValues, 'confirmPassword' | 'semester' | 'bio'> & {
  semester: number
  bio: string | null
}
