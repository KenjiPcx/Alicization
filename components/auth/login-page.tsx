"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Briefcase, Building2, Zap } from "lucide-react";

export function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[oklch(0.1797_0.0043_308.1928)]">
      {/* Floating orbs - yellow/orange glow */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-[oklch(0.7214_0.1337_49.9802)]/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-[oklch(0.7214_0.1337_49.9802)]/10 blur-3xl [animation-delay:700ms]" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-8">
          {/* Logo/Icon area with golden glow */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-[oklch(0.7214_0.1337_49.9802)]/30 blur-xl [animation-duration:2s]" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.7214_0.1337_49.9802)] to-[oklch(0.8721_0.0864_68.5474)] shadow-lg shadow-[oklch(0.7214_0.1337_49.9802)]/50">
                <Building2 className="h-10 w-10 text-[oklch(0.1797_0.0043_308.1928)]" />
              </div>
            </div>
          </div>

          {/* Title section with GTA-style typography */}
          <div className="mb-2 text-center">
            <h1 className="mb-2 bg-gradient-to-r from-[oklch(0.8109_0_0)] via-[oklch(0.7214_0.1337_49.9802)] to-[oklch(0.8109_0_0)] bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              ALICIZATION
            </h1>
            <div className="mb-6 h-0.5 w-full bg-gradient-to-r from-transparent via-[oklch(0.7214_0.1337_49.9802)] to-transparent shadow-[0_0_10px_rgba(255,200,0,0.5)]" />
          </div>

          {/* GTA-inspired copy */}
          <div className="mb-8 space-y-4 text-center">
            <p className="text-lg font-semibold leading-tight text-[oklch(0.8109_0_0)]">
              Build businesses like never before.
            </p>
            <p className="text-sm leading-relaxed text-[oklch(0.6268_0_0)]">
              Welcome to the new world where AI employees work alongside you in a digital office.
              Organize teams, delegate tasks, and watch your empire grow.
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-[oklch(0.7214_0.1337_49.9802)]">
              Good luck. Have fun.
            </p>
          </div>

          {/* Feature pills */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-[oklch(0.2520_0_0)] bg-[oklch(0.3211_0_0)]/50 px-3 py-1.5 text-xs text-[oklch(0.8109_0_0)]">
              <Briefcase className="h-3 w-3 text-[oklch(0.7214_0.1337_49.9802)]" />
              <span>AI Employees</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[oklch(0.2520_0_0)] bg-[oklch(0.3211_0_0)]/50 px-3 py-1.5 text-xs text-[oklch(0.8109_0_0)]">
              <Building2 className="h-3 w-3 text-[oklch(0.5940_0.0443_196.0233)]" />
              <span>3D Office</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[oklch(0.2520_0_0)] bg-[oklch(0.3211_0_0)]/50 px-3 py-1.5 text-xs text-[oklch(0.8109_0_0)]">
              <Zap className="h-3 w-3 text-[oklch(0.8721_0.0864_68.5474)]" />
              <span>Real-time Collab</span>
            </div>
          </div>

          {/* CTA Button with golden glow */}
          <SignInButton mode="modal">
            <Button
              size="lg"
              className="w-full bg-[oklch(0.7214_0.1337_49.9802)] text-[oklch(0.1797_0.0043_308.1928)] text-base font-semibold shadow-lg shadow-[oklch(0.7214_0.1337_49.9802)]/50 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-[oklch(0.7214_0.1337_49.9802)]/60 hover:bg-[oklch(0.8721_0.0864_68.5474)]"
            >
              Enter the Office
            </Button>
          </SignInButton>

        {/* Access notice */}
        <div className="mt-12 text-center space-y-3">
          <p className="text-sm text-[oklch(0.6268_0_0)]">
            Exclusive early access • Invite only
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-[oklch(0.6268_0_0)]/50">
            Powered by Nomous Labs
          </p>
        </div>
      </div>
    </div>
  );
}
