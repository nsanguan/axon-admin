import './global.css';
import { Providers } from './providers';

export const metadata = {
  title: 'AXON Admin',
  description: 'AXON System Administration & Control Plane',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
