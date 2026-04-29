import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { getTranslation } from "@/lib/i18n";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = (key: string) => getTranslation(language, key);

  const isActive = (path: string) => location === path;

  const navItems = [
    { path: "/", label: t("nav.home") },
    { path: "/upload", label: t("nav.upload") },
    { path: "/projects", label: t("nav.projects") },
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        theme === "light"
          ? "bg-white border-gray-200"
          : theme === "dark"
            ? "bg-slate-950 border-slate-800"
            : "bg-blue-100 border-blue-200"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
              LI
            </div>
            <span>MODAPTS Analyzer</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-500 text-white"
                    : theme === "light"
                      ? "text-gray-700 hover:bg-gray-100"
                      : theme === "dark"
                        ? "text-gray-300 hover:bg-slate-800"
                        : "text-gray-700 hover:bg-blue-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Menu */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.name || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="gap-2"
                  title={t("nav.logout")}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("nav.logout")}</span>
                </Button>
              </div>
            ) : null}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 flex flex-col gap-2 border-t pt-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors block ${
                  isActive(item.path)
                    ? "bg-blue-500 text-white"
                    : theme === "light"
                      ? "text-gray-700 hover:bg-gray-100"
                      : theme === "dark"
                        ? "text-gray-300 hover:bg-slate-800"
                        : "text-gray-700 hover:bg-blue-200"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
