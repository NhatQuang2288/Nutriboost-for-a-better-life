import Link from "next/link";

const NAV_ITEMS = [
  { href: "/c/today", label: "Hôm nay" },
  { href: "/c/log", label: "Ghi bữa ăn" },
  { href: "/c/progress", label: "Tiến độ" },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <main className="mx-auto max-w-md px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 border-t bg-background">
        <div className="mx-auto flex max-w-md">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 py-3 text-center text-sm font-medium text-muted-foreground active:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
