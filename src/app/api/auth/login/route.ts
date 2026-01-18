// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { AuthController } from "../../../../controllers/AuthController";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validación básica
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Faltan credenciales" },
        { status: 400 }
      );
    }

    // Llamar al AuthController
    const { token, user } = await AuthController.login({
      email: body.email,
      password: body.password,
    });

    return NextResponse.json({
      message: "Login exitoso",
      token,
      user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error en el servidor" },
      { status: 500 }
    );
  }
}
