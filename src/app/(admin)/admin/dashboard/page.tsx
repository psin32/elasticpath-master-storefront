"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const router = useRouter();
  const { status } = useSession();

  if (status == "unauthenticated") {
    router.push("/admin");
  }

  return (
    <div className="p-8 shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6">
        Welcome to the Admin Dashboard
      </h2>
      <p className="mt-4 text-gray-600 text-lg">
        This is the home page of the dashboard where you can manage various
        sections of the admin panel.
      </p>
    </div>
  );
}
