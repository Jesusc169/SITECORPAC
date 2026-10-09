"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/Login.module.css"; // 👈 Importa el CSS Module aquí

export default function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error en login");
        return;
      }

      // ✅ Redirigir al dashboard o página principal
      router.push("/dashboard");
    } catch (err) {
      setError("Error en el servidor");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Iniciar sesión</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="login-email" className={styles.srOnly}>
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
          <label htmlFor="login-password" className={styles.srOnly}>
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
          <button type="submit" className={styles.button}>
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
      </div>
    </div>
  );
}
