"use client";

/**
 * Editor de texto con formato para noticias, ferias y sorteos: negrita,
 * cursiva, tamaño y tipo de letra, color, títulos, listas, alineación y
 * enlaces. Entrega HTML (el servidor lo limpia con lib/htmlSeguro antes de
 * guardarlo). Los textos antiguos en texto plano se abren con sus párrafos.
 */
import { useEffect, useRef } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, FontFamily, FontSize, Color } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extensions";
import {
  MdUndo,
  MdRedo,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdTextDecrease,
  MdTextIncrease,
  MdBorderColor,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdLink,
  MdLinkOff,
  MdFormatClear,
} from "react-icons/md";
import { textoAHtml } from "@/lib/textoRico";
import styles from "./EditorTexto.module.css";

const TAMANOS = [12, 14, 16, 18, 20, 24, 28, 32];

const FUENTES = [
  { nombre: "Arial", valor: "Arial, sans-serif" },
  { nombre: "Georgia", valor: "Georgia, serif" },
  { nombre: "Times New Roman", valor: '"Times New Roman", serif' },
  { nombre: "Verdana", valor: "Verdana, sans-serif" },
  { nombre: "Trebuchet MS", valor: '"Trebuchet MS", sans-serif' },
  { nombre: "Courier New", valor: '"Courier New", monospace' },
];

// Todos con contraste suficiente sobre fondo blanco.
const COLORES = [
  { nombre: "Azul SITECORPAC", valor: "#0b2a4a" },
  { nombre: "Azul", valor: "#1d4ed8" },
  { nombre: "Turquesa", valor: "#136a80" },
  { nombre: "Rojo", valor: "#a51c1c" },
  { nombre: "Verde", valor: "#166534" },
  { nombre: "Marrón", valor: "#8a5a00" },
  { nombre: "Gris", valor: "#40566d" },
];

/** Las comillas y espacios varían según el navegador: se compara solo el primer nombre. */
const primeraFuente = (f: string | undefined) => (f ?? "").split(",")[0].replace(/["']/g, "").trim();

interface Props {
  /** id del área de edición (para pruebas y enlaces internos). */
  id: string;
  /** id del <label> que la nombra (lectores de pantalla). */
  etiquetaId: string;
  /** HTML del editor o texto plano antiguo. */
  valor: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function EditorTexto({ id, etiquetaId, valor, onChange, placeholder }: Readonly<Props>) {
  // Lo último que se entregó con onChange: si `valor` cambia desde fuera
  // (p. ej. al cargar la noticia a editar) se vuelve a cargar el editor.
  const ultimo = useRef(valor);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["mailto"] },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: textoAHtml(valor),
    editorProps: {
      attributes: {
        id,
        class: styles.area,
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": etiquetaId,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      ultimo.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor || valor === ultimo.current) return;
    ultimo.current = valor;
    editor.commands.setContent(textoAHtml(valor), { emitUpdate: false });
  }, [editor, valor]);

  return (
    <div className={styles.editor}>
      {editor && <BarraHerramientas editor={editor} controla={id} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Boton({
  etiqueta,
  activo,
  onClick,
  disabled,
  children,
}: Readonly<{ etiqueta: string; activo?: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      className={`${styles.boton} ${activo ? styles.activo : ""}`}
      aria-label={etiqueta}
      title={etiqueta}
      aria-pressed={activo === undefined ? undefined : activo}
      // No quitar el foco del texto al hacer clic (la selección se mantiene).
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function BarraHerramientas({ editor, controla }: Readonly<{ editor: Editor; controla: string }>) {
  const estado = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      negrita: e.isActive("bold"),
      cursiva: e.isActive("italic"),
      subrayado: e.isActive("underline"),
      tachado: e.isActive("strike"),
      resaltado: e.isActive("highlight"),
      vinetas: e.isActive("bulletList"),
      numerada: e.isActive("orderedList"),
      cita: e.isActive("blockquote"),
      enlace: e.isActive("link"),
      bloque: e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : "p",
      alineacion: (["center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "left",
      tamano: String(e.getAttributes("textStyle").fontSize ?? "").replace("px", ""),
      fuente: primeraFuente(e.getAttributes("textStyle").fontFamily),
      color: String(e.getAttributes("textStyle").color ?? ""),
      puedeDeshacer: e.can().undo(),
      puedeRehacer: e.can().redo(),
    }),
  });

  const cadena = () => editor.chain().focus();

  const cambiarTamano = (paso: 1 | -1) => {
    const actual = Number(estado.tamano) || 16;
    const siguiente = paso > 0 ? TAMANOS.find((t) => t > actual) : [...TAMANOS].reverse().find((t) => t < actual);
    if (siguiente) cadena().setFontSize(`${siguiente}px`).run();
  };

  const ponerEnlace = () => {
    const previo = (editor.getAttributes("link").href as string | undefined) ?? "https://";
    const url = window.prompt("Dirección del enlace (por ejemplo https://www.corpac.gob.pe):", previo);
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") {
      cadena().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = /^(https?:|mailto:)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    cadena().extendMarkRange("link").setLink({ href }).run();
  };

  const fuenteActual = FUENTES.find((f) => primeraFuente(f.valor) === estado.fuente)?.valor ?? "";
  const colorActual = COLORES.find((c) => c.valor.toLowerCase() === estado.color.toLowerCase())?.valor ?? "";

  return (
    <div className={styles.barra} role="toolbar" aria-label="Formato del texto" aria-controls={controla}>
      <div className={styles.grupo}>
        <Boton etiqueta="Deshacer" onClick={() => cadena().undo().run()} disabled={!estado.puedeDeshacer}>
          <MdUndo aria-hidden />
        </Boton>
        <Boton etiqueta="Rehacer" onClick={() => cadena().redo().run()} disabled={!estado.puedeRehacer}>
          <MdRedo aria-hidden />
        </Boton>
      </div>

      <div className={styles.grupo}>
        <select
          className={styles.lista}
          aria-label="Estilo del párrafo"
          title="Estilo del párrafo"
          value={estado.bloque}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") cadena().setParagraph().run();
            else cadena().setHeading({ level: v === "h2" ? 2 : 3 }).run();
          }}
        >
          <option value="p">Texto normal</option>
          <option value="h2">Título</option>
          <option value="h3">Subtítulo</option>
        </select>

        <select
          className={styles.lista}
          aria-label="Tipo de letra"
          title="Tipo de letra"
          value={fuenteActual}
          onChange={(e) =>
            e.target.value ? cadena().setFontFamily(e.target.value).run() : cadena().unsetFontFamily().run()
          }
        >
          <option value="">Letra del sitio</option>
          {FUENTES.map((f) => (
            <option key={f.nombre} value={f.valor} style={{ fontFamily: f.valor }}>
              {f.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.grupo}>
        <Boton etiqueta="Achicar letra" onClick={() => cambiarTamano(-1)}>
          <MdTextDecrease aria-hidden />
        </Boton>
        <select
          className={`${styles.lista} ${styles.tamano}`}
          aria-label="Tamaño de letra"
          title="Tamaño de letra"
          value={TAMANOS.includes(Number(estado.tamano)) ? estado.tamano : ""}
          onChange={(e) =>
            e.target.value ? cadena().setFontSize(`${e.target.value}px`).run() : cadena().unsetFontSize().run()
          }
        >
          <option value="">Normal</option>
          {TAMANOS.map((t) => (
            <option key={t} value={String(t)}>
              {t}
            </option>
          ))}
        </select>
        <Boton etiqueta="Agrandar letra" onClick={() => cambiarTamano(1)}>
          <MdTextIncrease aria-hidden />
        </Boton>
      </div>

      <div className={styles.grupo}>
        <Boton etiqueta="Negrita" activo={estado.negrita} onClick={() => cadena().toggleBold().run()}>
          <MdFormatBold aria-hidden />
        </Boton>
        <Boton etiqueta="Cursiva" activo={estado.cursiva} onClick={() => cadena().toggleItalic().run()}>
          <MdFormatItalic aria-hidden />
        </Boton>
        <Boton etiqueta="Subrayado" activo={estado.subrayado} onClick={() => cadena().toggleUnderline().run()}>
          <MdFormatUnderlined aria-hidden />
        </Boton>
        <Boton etiqueta="Tachado" activo={estado.tachado} onClick={() => cadena().toggleStrike().run()}>
          <MdStrikethroughS aria-hidden />
        </Boton>
        <Boton etiqueta="Resaltar en amarillo" activo={estado.resaltado} onClick={() => cadena().toggleHighlight().run()}>
          <MdBorderColor aria-hidden />
        </Boton>
      </div>

      <div className={styles.grupo}>
        <select
          className={styles.lista}
          aria-label="Color de letra"
          title="Color de letra"
          value={colorActual}
          style={colorActual ? { color: colorActual } : undefined}
          onChange={(e) => (e.target.value ? cadena().setColor(e.target.value).run() : cadena().unsetColor().run())}
        >
          <option value="" style={{ color: "#14263a" }}>
            Color normal
          </option>
          {COLORES.map((c) => (
            <option key={c.valor} value={c.valor} style={{ color: c.valor }}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.grupo}>
        <Boton etiqueta="Alinear a la izquierda" activo={estado.alineacion === "left"} onClick={() => cadena().setTextAlign("left").run()}>
          <MdFormatAlignLeft aria-hidden />
        </Boton>
        <Boton etiqueta="Centrar" activo={estado.alineacion === "center"} onClick={() => cadena().setTextAlign("center").run()}>
          <MdFormatAlignCenter aria-hidden />
        </Boton>
        <Boton etiqueta="Alinear a la derecha" activo={estado.alineacion === "right"} onClick={() => cadena().setTextAlign("right").run()}>
          <MdFormatAlignRight aria-hidden />
        </Boton>
        <Boton etiqueta="Justificar" activo={estado.alineacion === "justify"} onClick={() => cadena().setTextAlign("justify").run()}>
          <MdFormatAlignJustify aria-hidden />
        </Boton>
      </div>

      <div className={styles.grupo}>
        <Boton etiqueta="Lista con viñetas" activo={estado.vinetas} onClick={() => cadena().toggleBulletList().run()}>
          <MdFormatListBulleted aria-hidden />
        </Boton>
        <Boton etiqueta="Lista numerada" activo={estado.numerada} onClick={() => cadena().toggleOrderedList().run()}>
          <MdFormatListNumbered aria-hidden />
        </Boton>
        <Boton etiqueta="Cita" activo={estado.cita} onClick={() => cadena().toggleBlockquote().run()}>
          <MdFormatQuote aria-hidden />
        </Boton>
      </div>

      <div className={styles.grupo}>
        <Boton etiqueta={estado.enlace ? "Cambiar enlace" : "Poner enlace"} activo={estado.enlace} onClick={ponerEnlace}>
          <MdLink aria-hidden />
        </Boton>
        {estado.enlace && (
          <Boton etiqueta="Quitar enlace" onClick={() => cadena().extendMarkRange("link").unsetLink().run()}>
            <MdLinkOff aria-hidden />
          </Boton>
        )}
        <Boton etiqueta="Quitar formato" onClick={() => cadena().unsetAllMarks().clearNodes().unsetTextAlign().run()}>
          <MdFormatClear aria-hidden />
        </Boton>
      </div>
    </div>
  );
}
