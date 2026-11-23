"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/Login.module.css";
import { ERROR_CONEXION, ERROR_SISTEMA_LOGIN, errorDe, leerJson } from "@/lib/mensajes";

export default function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnviando(true);
    // Se quita el aviso anterior: si sale el mismo error, el lector de
    // pantalla lo vuelve a anunciar.
    setError("");

    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      // Sin internet o el servidor no responde.
      setError(ERROR_CONEXION);
      setEnviando(false);
      return;
    }

    if (!res.ok) {
      // Si llega una página de error (p. ej. HTML de nginx), no hay {error}:
      // se muestra el aviso de problema del sistema, nunca texto técnico.
      setError(errorDe(await leerJson(res)) ?? ERROR_SISTEMA_LOGIN);
      setEnviando(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.kick}>Panel administrativo</span>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Solo para el personal autorizado del SITECORPAC.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="login-email" className={styles.label}>
            Correo
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className={styles.input}
          />
          <label htmlFor="login-password" className={styles.label}>
            Contraseña
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className={styles.input}
          />
          <button type="submit" className={styles.button} disabled={enviando}>
            Ingresar
          </button>
        </form>

        {/* role="alert": el lector de pantalla anuncia el error apenas
            aparece; antes solo se veía en pantalla. */}
        {error && (
          <p id="login-error" role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <p className={styles.ayuda}>
          ¿Olvidaste tu contraseña? Pídele al administrador del panel que te asigne una nueva.
        </p>
      </div>
    </div>
  );
}
