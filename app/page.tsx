"use client";

import { useSession } from "next-auth/react";
import { CalorieTracker } from "@/components/CalorieTracker";
import { AuthPage } from "@/components/AuthPage";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return <CalorieTracker />;
}
