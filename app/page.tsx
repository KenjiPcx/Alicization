"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import OfficeSimulation from "@/components/office-simulation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <main className="w-[100dvw] h-[100dvh]">
      <div className="absolute top-0 right-0 p-4 z-10">
        <SignOutButton />
      </div>
      <SidebarProvider defaultOpen={false}>
        <SidebarInset>
          <OfficeSimulation />
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  return (
    <>
      {isAuthenticated && (
        <button
          className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-2 py-1"
          onClick={() =>
            void signOut().then(() => {
              router.push("/signin");
            })
          }
        >
          Sign out
        </button>
      )}
    </>
  );
}
