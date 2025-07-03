"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  return <AuthForm onSignIn={() => {
    void signIn("github");
    router.push("/");
  }} />
}
