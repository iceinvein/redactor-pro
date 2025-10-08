import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden app-bg">
      {/* Decorative gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-default-50 dark:to-default-950" />
      <div aria-hidden className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full blur-3xl opacity-30 bg-primary/30 dark:bg-primary/20" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-[-10%] h-72 w-72 rounded-full blur-3xl opacity-30 bg-secondary/30 dark:bg-secondary/20" />

      <Navbar />

      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}
