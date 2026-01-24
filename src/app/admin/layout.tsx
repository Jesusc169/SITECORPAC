import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  // 🔒 BLOQUEO TOTAL NIVEL BANCO
  if (!token) {
    redirect("/login");
  }

  return <>{children}</>;
}
