import { NextResponse } from "next/server";
import { AuthController } from "../../../../controllers/AuthController";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await AuthController.register(body);

    return NextResponse.json({ message: "Usuario registrado", user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
