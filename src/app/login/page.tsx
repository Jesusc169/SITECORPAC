import type { Metadata } from "next";
import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";
import LoginView from "../../views/LoginView";

export const metadata: Metadata = {
  title: "Iniciar sesión | SITECORPAC",
};

export default function LoginPage() {
  return (
    <PaginaPublica>
      <LoginView />
    </PaginaPublica>
  );
}
