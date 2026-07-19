"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/token-manager";
import { Loader2 } from "lucide-react";
import { InactivityGuard } from "./InactivityGuard";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isLogged = useAppSelector((state: any) => state.session.isLogged);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = TokenManager.getToken();
    if (!token || isLogged !== "authenticated") {
      router.replace(paths.auth.login);
    } else {
      setChecking(false);
    }
  }, [isLogged, router]);

  if (checking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return <InactivityGuard>{children}</InactivityGuard>;
}
export default AuthGuard;
