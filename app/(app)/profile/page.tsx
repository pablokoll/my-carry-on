"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, clearTokens } from "@/lib/api";

interface Profile {
  email: string;
  created_at: string;
  trip_count: number;
  destination_count: number;
  bag_count: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/auth/me"),
  });

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  if (isLoading)
    return (
      <p className="text-[color:var(--fg-muted)] text-sm text-center pt-12">
        Loading…
      </p>
    );
  if (!profile) return null;

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground m-0">Profile</h2>

      <div className="bg-[var(--bg-surface)] rounded-xl p-5 flex flex-col gap-3">
        <div>
          <p className="text-xs text-[color:var(--fg-muted)] mt-0 mb-0.5">
            Email
          </p>
          <p className="text-[15px] font-medium text-foreground m-0">
            {profile.email}
          </p>
        </div>
        <div>
          <p className="text-xs text-[color:var(--fg-muted)] mt-0 mb-0.5">
            Member since
          </p>
          <p className="text-[15px] font-medium text-foreground m-0">
            {memberSince}
          </p>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-xl p-5">
        <p className="text-xs text-[color:var(--fg-muted)] mt-0 mb-3.5">
          Stats
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { value: profile.trip_count, label: "trips" },
            { value: profile.destination_count, label: "destinations" },
            { value: profile.bag_count, label: "bags" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-primary mt-0 mb-0.5">
                {value}
              </p>
              <p className="text-xs text-[color:var(--fg-muted)] m-0">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full bg-transparent border border-destructive rounded-lg text-destructive px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-[rgba(232,48,74,0.07)] transition-[background] duration-[180ms]"
      >
        Sign out
      </button>
    </div>
  );
}
