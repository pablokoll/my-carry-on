"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api, setTokens } from "@/lib/api";
import {
  AuthShell,
  errorStyle,
  footerLinkStyle,
  inputStyle,
  labelStyle,
  submitBtnStyle,
} from "../auth-layout";

const schema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      await api.post("/auth/register", {
        email: data.email,
        password: data.password,
      });
      const res = await api.post<{
        access_token: string;
        refresh_token: string;
      }>("/auth/login", {
        email: data.email,
        password: data.password,
      });
      setTokens(res.access_token, res.refresh_token);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    }
  }

  return (
    <AuthShell
      title="Create an account"
      description="Start planning your trips"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" style={footerLinkStyle}>
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div>
          <label htmlFor="email" style={labelStyle}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
            style={inputStyle(!!errors.email)}
            onFocus={(e) => (e.target.style.boxShadow = "var(--shadow-focus)")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
          />
          {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("password")}
            style={inputStyle(!!errors.password)}
            onFocus={(e) => (e.target.style.boxShadow = "var(--shadow-focus)")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
          />
          {errors.password && (
            <p style={errorStyle}>{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" style={labelStyle}>
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("confirmPassword")}
            style={inputStyle(!!errors.confirmPassword)}
            onFocus={(e) => (e.target.style.boxShadow = "var(--shadow-focus)")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
          />
          {errors.confirmPassword && (
            <p style={errorStyle}>{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--destructive)",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={submitBtnStyle(isSubmitting)}
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
