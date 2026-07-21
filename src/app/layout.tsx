import { getServerSession } from "next-auth";
import type { Metadata } from "next";

import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { NavBar } from "@/components/NavBar";
import { PlayerBar } from "@/components/PlayerBar";
import { PlayerProvider } from "@/components/PlayerProvider";
import { ThemeStyle } from "@/components/ThemeStyle";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paletteForUser } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "Music Manager",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;
  const palette = paletteForUser(dbUser);

  return (
    <html lang="en">
      <body>
        <ThemeStyle palette={palette} />
        <AuthSessionProvider>
          <PlayerProvider>
            {session && <NavBar username={session.user.name ?? ""} isAdmin={session.user.isAdmin} />}
            <div id="app-content">{children}</div>
            {session && <PlayerBar />}
          </PlayerProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
