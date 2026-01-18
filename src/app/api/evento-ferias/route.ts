import { EventoFeriaController } from "@/controllers/EventoFeria.controller";

export async function GET(request: Request) {
  return EventoFeriaController.list(request);
}
