import { Header } from "./Header";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />
      <main className={`flex-1 py-10 px-6 ${className}`}>{children}</main>
    </div>
  );
}
