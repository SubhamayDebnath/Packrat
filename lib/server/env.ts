function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  get mongoUri() {
    return required("MONGODB_URI");
  },
  get jwtSecret() {
    const secret = required("JWT_SECRET");
    if (secret.length < 32)
      throw new Error("JWT_SECRET must be at least 32 characters long.");
    return secret;
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
};
