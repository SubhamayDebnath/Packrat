import { z } from "zod";
import { GROUP_COLORS } from "./constants";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be 32 characters or fewer")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Use letters, numbers, dots, dashes or underscores");

export const emailSchema = z
  .email("Enter a valid email address")
  .max(254)
  .transform((v) => v.toLowerCase());

// bcrypt only reads the first 72 bytes, so cap there.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(72),
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = registerSchema
  .extend({ confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export const activateSchema = z.object({
  token: z.string().min(32).max(128),
  password: passwordSchema.optional(),
});

export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const updateUserSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reset-password"), password: passwordSchema }),
  z.object({ action: z.literal("resend-activation") }),
]);

export const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    currentPassword: z.string().max(72).optional(),
    newPassword: passwordSchema.optional(),
  })
  .refine((v) => !v.newPassword || !!v.currentPassword, {
    path: ["currentPassword"],
    message: "Enter your current password",
  });

export const urlInputSchema = z
  .string()
  .trim()
  .min(1, "Enter a link")
  .max(2048, "That link is too long");

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");
export const idSchema = objectId;

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a group name")
    .max(40, "Keep it under 40 characters"),
  color: z.enum(GROUP_COLORS),
});

/** Groups are private unless isPublic is true. */
export const createGroupSchema = groupSchema.extend({ isPublic: z.boolean().optional() });

export const updateGroupSchema = groupSchema
  .partial()
  .extend({ isPublic: z.boolean().optional() });

export const createBookmarkSchema = z.object({
  url: urlInputSchema,
  groupId: objectId,
  title: z.string().trim().max(200).optional(),
});

export const updateBookmarkSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  groupId: objectId.optional(),
});

export const bulkSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("delete"), ids: z.array(objectId).min(1).max(500) }),
  z.object({
    action: z.literal("move"),
    ids: z.array(objectId).min(1).max(500),
    groupId: objectId,
  }),
]);

export const importSchema = z.object({
  groups: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(40),
        links: z
          .array(z.object({ url: z.string().max(2048), title: z.string().max(200) }))
          .max(2000),
      }),
    )
    .max(50),
});

export const metadataSchema = z.object({ url: urlInputSchema });
