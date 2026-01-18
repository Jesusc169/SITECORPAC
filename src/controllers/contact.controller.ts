// controllers/contact.controller.ts

import { contacto } from "../models/contact.model";

export function getWhatsAppLink() {
  const { numero, mensaje } = contacto.whatsapp;
  const encodedMsg = encodeURIComponent(mensaje);
  return `https://wa.me/${numero}?text=${encodedMsg}`;
}
