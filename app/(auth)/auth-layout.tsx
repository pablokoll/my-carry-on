"use client";

interface AuthShellProps {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-foreground m-0">
            My Carry-On
          </h1>
          <p className="text-sm text-[color:var(--fg-muted)] mt-1.5 mb-0">
            Pack smarter, travel lighter.
          </p>
        </div>

        <div className="bg-card border border-border rounded-[10px] px-6 py-7 shadow-[var(--shadow-sm-val)]">
          <h2 className="text-lg font-semibold text-foreground m-0 mb-1">
            {title}
          </h2>
          <p className="text-[13px] text-[color:var(--fg-muted)] mt-0 mb-6">
            {description}
          </p>

          {children}

          <p className="text-[13px] text-[color:var(--fg-muted)] text-center mt-5 mb-0">
            {footer}
          </p>
        </div>
      </div>
    </div>
  );
}
