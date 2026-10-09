import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import { optimizarImagen } from "@/lib/imagenes";
import { guardarImagenNoticia, borrarImagenNoticia, guardarDocumentoNoticia, borrarDocumentoNoticia } from "@/lib/archivosNoticia";
import { guardarImagenFeria, borrarImagenFeria } from "@/lib/archivosFeria";
import { guardarImagenSorteo, borrarImagenSorteo } from "@/lib/archivosSorteo";
import { guardarFotoDirectorio, borrarFotoDirectorio } from "@/lib/archivosDirectorio";
import { resolverGaleria } from "@/lib/resolverGaleria";
import { verificarSesion } from "@/lib/auth";
import { imagenPng, archivo, ponerCookie } from "../helpers";

const enDisco = (url: string) => existsSync(path.join(process.cwd(), "public", url));

async function img(formato: "jpeg" | "png" | "webp" | "gif", ancho = 30) {
  return sharp({ create: { width: ancho, height: 10, channels: 3, background: "#c33" } })[formato]().toBuffer();
}

describe("optimizarImagen", () => {
  it.each(["jpeg", "png", "webp"] as const)("recomprime %s", async (f) => {
    const salida = await optimizarImagen(await img(f));
    expect((await sharp(salida).metadata()).format).toBe(f);
  });

  it("achica a 1600px de ancho las fotos grandes", async () => {
    const salida = await optimizarImagen(await img("jpeg", 2400));
    expect((await sharp(salida).metadata()).width).toBe(1600);
  });

  it("otros formatos se dejan como vienen (sin recomprimir)", async () => {
    const salida = await optimizarImagen(await img("gif"));
    expect((await sharp(salida).metadata()).format).toBe("gif");
  });

  it("si el archivo está dañado devuelve el original", async () => {
    const roto = Buffer.from("no soy una imagen");
    expect(await optimizarImagen(roto)).toBe(roto);
  });
});

describe("guardar y borrar archivos subidos", () => {
  it.each([
    ["noticias", guardarImagenNoticia, borrarImagenNoticia],
    ["ferias", guardarImagenFeria, borrarImagenFeria],
    ["sorteos", guardarImagenSorteo, borrarImagenSorteo],
  ] as const)("imágenes de %s: se guardan en su carpeta y se borran", async (carpeta, guardar, borrar) => {
    const url = await guardar(await imagenPng("mi foto (1).png"));
    expect(url).toMatch(new RegExp(`^/uploads/${carpeta}/.*mi_foto__1_.png$`));
    expect(enDisco(url)).toBe(true);
    await borrar(url);
    expect(enDisco(url)).toBe(false);
    await borrar(url); // ya no existe: no falla
    await borrar(null); // sin imagen: no hace nada
  });

  it("documentos de noticias", async () => {
    const url = await guardarDocumentoNoticia(archivo("acta.pdf", "application/pdf"), 2);
    expect(url).toMatch(/^\/uploads\/noticias\/pdf\/noticia-\d+-2-acta.pdf$/);
    expect(enDisco(url)).toBe(true);
    await borrarDocumentoNoticia(url);
    expect(enDisco(url)).toBe(false);
    await borrarDocumentoNoticia(url);
  });

  it("fotos del directorio (con o sin extensión en el nombre)", async () => {
    const url = await guardarFotoDirectorio(await imagenPng("retrato.png"));
    expect(url).toMatch(/^\/uploads\/directorio\/directorio-\d+\.png$/);
    expect(enDisco(url)).toBe(true);
    await borrarFotoDirectorio(url);
    expect(enDisco(url)).toBe(false);
    await borrarFotoDirectorio(url);
    await borrarFotoDirectorio(null);
    const sinExt = await guardarFotoDirectorio(new File([await img("png")], "foto.", { type: "image/png" }));
    expect(sinExt).toMatch(/\.jpg$/);
  });

  it("rechaza archivos que no son imágenes", async () => {
    await expect(guardarImagenFeria(archivo("x.svg", "image/svg+xml"))).rejects.toThrow();
  });
});

describe("resolverGaleria", () => {
  it("sin fotos que queden ni principal elegida, la primera nueva es la principal", () => {
    const r = resolverGaleria({ existentes: [], idsEliminar: [], cantidadNuevas: 2, principalExistenteId: null, principalNuevaIndex: null });
    expect(r.principal).toEqual({ tipo: "nueva", indice: 0 });
  });

  it("sin ninguna foto no hay principal", () => {
    const r = resolverGaleria({ existentes: [], idsEliminar: [], cantidadNuevas: 0, principalExistenteId: null, principalNuevaIndex: null });
    expect(r.principal).toBeNull();
  });
});

describe("verificarSesion", () => {
  it("un token alterado o firmado con otra clave no vale", async () => {
    ponerCookie("esto.no.es-un-jwt");
    expect(await verificarSesion()).toBeNull();
  });
});
