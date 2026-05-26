"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEmailUi } from "@/components/email-ui-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, SunIcon, MoonIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SignOutButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const { preview, highlights } = useEmailUi();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!session?.user) return null;

  const initials = (session.user.name ?? session.user.email ?? "?")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const panelOpen = preview != null;
  const highlightsOpen = highlights != null && highlights.messages.length > 0;

  const zIndex = panelOpen || highlightsOpen ? "z-30" : "z-50";

  let rightOffset = "right-4";
  if (panelOpen) {
    rightOffset = "md:right-[calc(20rem+1rem)]";
  } else if (highlightsOpen) {
    rightOffset = "md:right-[calc(18rem+1rem)]";
  }

  return (
    <div className={`fixed top-4 ${rightOffset} ${zIndex}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Account menu"
          >
            <span className="text-xs font-semibold">{initials}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{session.user.name}</DropdownMenuLabel>
          <DropdownMenuLabel className="font-normal text-muted-foreground truncate max-w-48">
            {session.user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? (
              <SunIcon className="size-4" />
            ) : (
              <MoonIcon className="size-4" />
            )}
            {mounted && theme === "dark" ? "Light mode" : "Dark mode"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={async () => {
              await signOut();
              router.push("/auth/sign-in");
              router.refresh();
            }}
          >
            <LogOutIcon className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
