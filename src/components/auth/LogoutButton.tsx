"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import React from "react";

interface LogoutButtonProps {
  fullWidth?: boolean;
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ fullWidth = false, className }) => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Use the centralized logout function that handles both Supabase and cache
      await logout();

      toast({ title: "Logged out", description: "You have been signed out." });
      router.push("/");
    } catch (err) {
      toast({ variant: "destructive", title: "Logout failed", description: (err as Error).message });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className={`text-destructive-foreground bg-destructive hover:bg-destructive/90 flex items-center justify-center ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
    >
      <LogOut className="h-5 w-5 mr-2" />
      Logout
    </Button>
  );
};

export default LogoutButton;
