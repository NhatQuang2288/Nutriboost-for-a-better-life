export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="text-2xl font-semibold text-primary">NutriBoost</span>
        </div>
        {children}
      </div>
    </div>
  );
}
