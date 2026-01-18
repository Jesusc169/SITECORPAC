"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/Login.module.css"; // 👈 Importa el CSS Module aquí

export default function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
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

      // ✅ Guardar token en localStorage o cookies
      localStorage.setItem("token", data.token);

      // ✅ Redirigir al dashboard o página principal
      router.push("/dashboard");
    } catch (err) {
      setError("Error en el servidor");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Iniciar sesión</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Ingresar
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
