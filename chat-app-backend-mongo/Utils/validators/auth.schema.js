const z = require("zod");

exports.generateOtpSchema = z.object({
  body: z
    .object({
      name: z
        .string({
          required_error: "All credentials required",
          invalid_type_error: "Name must be a string",
        })
        .trim()
        .min(1, "All credentials required")
        .min(2, "Name must have atleast 2 characters")
        .max(25, "Name must not have more than 25 characters"),

      email: z
        .string({
          required_error: "All credentials required",
        })
        .min(1, "All credentials required")
        .email(),
    })
    .strict(),
});

exports.verifyOtpSchema = z.object({
  body: z
    .object({
      id: z.string(),
      otp: z.string().regex(/^\d{4}$/, "OTP must be exactly 4 digits"),
    })
    .strict(),
});

exports.registerSchema = z.object({
  body: z
    .object({
      userId: z.string(),
      publicKey: z.string(),
      password: z
        .string({
          required_error: "All credentials required",
        })
        .min(1, "All credentials required")
        .min(6, "Password length must be of 6 digits."),
      encryptedPrivateKey: z.string(),
      salt: z.string(),
      iv: z.string(),
    })
    .strict(),
});

exports.loginSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: z.string(),
    })
    .strict(),
});
