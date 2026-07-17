'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { ResizableImage } from './ResizableImage';
import { EditorToolbar } from './EditorToolbar';
import { useEffect, useMemo } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Escribe aquí...', className = '' }: RichTextEditorProps) {
  // Memoizados a propósito: con `shouldRerenderOnTransaction` el componente se
  // re-renderiza en cada tecla/selección. Si estos fueran objetos nuevos en cada
  // render, el wrapper de @tiptap/react los vería distintos y llamaría a
  // `setOptions` (view.setProps/updateState) en cada transacción. Estables, ese
  // trabajo se saltea y solo se re-renderiza el toolbar para reflejar el estado.
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      // StarterKit v3 ya trae Link y Underline incluidos. Se configuran acá en
      // vez de agregar las extensiones por separado: hacerlo duplicaba los
      // nombres ('link', 'underline') y disparaba el warning de Tiptap.
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      },
    }),
    ResizableImage.configure({
      inline: true,
      // Tiene que coincidir con el allowlist de src/lib/html.ts, que no deja
      // pasar `data:`. Si acá fuera `true`, una imagen pegada se vería en el
      // editor, se guardaría en la base y desaparecería al publicar — sin
      // error y sin warning. Además una imagen en base64 se guarda entera en
      // la columna TEXT del post y se arrastra en cada render.
      allowBase64: false,
    }),
    Placeholder.configure({
      placeholder,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ], [placeholder]);

  const editorProps = useMemo(() => ({
    attributes: {
      // - Sin "sm:prose-base": esa escala (pensada para el artículo publicado)
      //   sube fuente y márgenes en pantallas ≥640px y se leía muy espaciado.
      // - `leading-[1.2]`: baja el interlineado que trae "prose-sm" (~1.71) al
      //   1.2 pedido; es lo que se veía como "demasiada separación entre líneas".
      // - `prose-p:my-1`: achica el margen entre párrafos (~16px por default),
      //   que se notaba como un salto grande al apretar Enter.
      // - `prose-headings:*`: las Hs traían mucho aire (h2/h3 con ~1.6em de
      //   margen arriba e interlineado 1.4-1.56); se ajustan igual que el texto.
      class: 'prose prose-sm prose-p:my-1 leading-[1.2] prose-headings:leading-[1.2] prose-headings:mt-3 prose-headings:mb-1 dark:prose-invert max-w-none min-h-[150px] focus:outline-none p-4',
    },
  }), []);

  const editor = useEditor({
    // El toolbar refleja el estado activo (negrita, alineación, etc.) via
    // `editor.isActive(...)`. Sin esto, @tiptap/react v3 no re-renderiza en cada
    // transacción y los botones nunca se prendían/apagaban — se sentían muertos.
    shouldRerenderOnTransaction: true,
    extensions,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps,
  });

  // Efecto para actualizar el contenido si cambia externamente (útil para forms)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const currentPos = editor.state.selection;
      editor.commands.setContent(value, { emitUpdate: false });
      // Intentar restaurar la selección si es posible, aunque es básico
      try {
          editor.commands.setTextSelection(currentPos);
      } catch (e) {
          // Ignorar si la posición ya no es válida
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 transition-colors ${className}`}>
      {/* Menú Clásico Fijo Arriba */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-t-lg">
        <EditorToolbar editor={editor} />
      </div>

      {/* Área de texto */}
      <div className="flex-1 overflow-y-auto cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
