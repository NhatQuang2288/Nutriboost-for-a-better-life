import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/clients", label: "Khách hàng" },
  { href: "/foods", label: "Cơ sở dữ liệu món" },
  { href: "/settings", label: "Cài đặt" },
];

export default function PtLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r bg-sidebar px-4 py-6 md:min-h-screen">
        <div className="mb-8 flex items-center justify-between md:block">
          <span className="text-xl font-semibold text-primary">NutriBoost</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 hidden md:block">
          <LogoutButton />
        </div>
      </aside>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
