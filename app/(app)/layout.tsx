"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChatWindow } from "@/components/chat-window";
import { Nav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Nav />
      <main className="max-w-[640px] mx-auto px-4 py-6">{children}</main>
      <ChatWindow />
    </div>
  );
}
