import { NextRequest, NextResponse } from "next/server";
import { NoticiasController } from "./controllers/NoticiasController";

export async function GET(req: NextRequest) {
  return await NoticiasController.obtenerNoticias(req);
}

export async function POST(req: NextRequest) {
  return await NoticiasController.crearNoticia(req);
}
