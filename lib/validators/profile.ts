import { z } from "zod";

const urlOptional = z
  .string()
  .url("Debe ser una URL válida")
  .max(200)
  .or(z.literal(""))
  .optional()
  .transform((value) => value?.trim() || "");

const socialHandle = z
  .string()
  .max(200, "Máximo 200 caracteres")
  .optional()
  .transform((value) => value?.trim() || "");

const phoneOptional = z
  .string()
  .max(30, "Teléfono demasiado largo")
  .regex(/^[0-9+\-()\s]*$/, "Usa solo números y símbolos (+ - ( ) )")
  .or(z.literal(""))
  .optional()
  .transform((value) => value?.trim() || "");

export const profileFormSchema = z.object({
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  headline: z
    .string({ required_error: "El titular es obligatorio" })
    .min(2, "El titular debe tener al menos 2 caracteres")
    .max(160, "Máximo 160 caracteres"),
  company: z
    .string({ required_error: "La empresa es obligatoria" })
    .min(2, "La empresa debe tener al menos 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  job_title: z
    .string()
    .max(120, "Máximo 120 caracteres")
    .optional()
    .transform((value) => value?.trim() || ""),
  bio: z
    .string({ required_error: "La bio es obligatoria" })
    .min(10, "La bio debe tener al menos 10 caracteres")
    .max(400, "Máximo 400 caracteres"),
  location: z
    .string({ required_error: "La ubicación es obligatoria" })
    .min(2, "La ubicación debe tener al menos 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  social_linkedin: socialHandle,
  social_twitter: socialHandle,
  social_instagram: socialHandle,
  social_facebook: socialHandle,
  phone: phoneOptional,
  email_public: z
    .string()
    .email("Debe ser un correo válido")
    .max(120, "Máximo 120 caracteres")
    .or(z.literal(""))
    .optional()
    .transform((value) => value?.trim() || ""),
  website: urlOptional,
  hide_phone_until_connected: z.boolean().default(true),
  hide_email_until_connected: z.boolean().default(true),
  hide_socials_until_connected: z.boolean().default(true),
  avatar_url: z.string().optional().nullable(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
