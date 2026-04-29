import React from "react";
import { useTheme, getThemeDisplayName, type ThemeType } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="테마 선택"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">{getThemeDisplayName(theme as ThemeType)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableThemes.map((t) => (
          <DropdownMenuItem
            key={t}
            onClick={() => setTheme(t)}
            className={theme === t ? "bg-accent" : ""}
          >
            <div className="flex items-center gap-2 w-full">
              <div
                className="w-4 h-4 rounded border"
                style={{
                  backgroundColor:
                    t === "light"
                      ? "#ffffff"
                      : t === "dark"
                        ? "#0a0a0a"
                        : "#1a1f2e",
                  borderColor:
                    t === "light"
                      ? "#dee2e6"
                      : t === "dark"
                        ? "#27272a"
                        : "#3a4556",
                }}
              />
              <span>{getThemeDisplayName(t)}</span>
              {theme === t && <span className="ml-auto">✓</span>}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
