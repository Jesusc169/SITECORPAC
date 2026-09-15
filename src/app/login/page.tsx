import type { Metadata } from "next";
import Cabecera from "../../components/Cabecera/Cabecera";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import LoginView from "../../views/LoginView";

export const metadata: Metadata = {
  title: "Iniciar sesión | SITECORPAC",
};

export default function LoginPage() {
  return (
    <>
      <Cabecera />
      <Navbar />
      <LoginView />
      <Footer />
    </>
  );
}
