"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


export default function Header({project_id}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/projects", label: "ホーム" },
    { href: `/projects/${project_id}/editor`, label: "Editor" },
    { href: `/projects/${project_id}/presenter`, label: "View" },
    { href: `/projects/${project_id}/controller`, label: "Controller" },
  ];
  

  return (
    <header className="shrink-0 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/projects"
          className="flex items-center gap-2 text-slate-700 transition-colors hover:text-slate-900"
          aria-label="ホームへ"
        >
          <span className="text-lg font-semibold tracking-tight flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1 text-slate-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              style={{ display: "inline" }}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.75L12 4l9 6.75V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
            </svg>
          </span>
        </Link>
        <nav className="flex items-center gap-0.5" aria-label="メインナビゲーション">
          {navItems.map(({ href, label }) => {
            const isActive =
              href === "/projects"
                ? pathname === "/projects"
                : pathname !== null && pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`
                  rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-slate-200/80 text-slate-900"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-800"
                  }
                `}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
