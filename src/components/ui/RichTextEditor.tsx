'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorToolbar } from './EditorToolbar';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Escribe aquí...', className = '' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        inline: true,
        // Tiene que coincidir con el allowlist de src/lib/html.ts, que no deja
        // pasar `data:`. Si acá fuera `true`, una imagen pegada se vería en el
        // editor, se guardaría en la base y desaparecería al publicar — sin
        // error y sin warning. Además una imagen en base64 se guarda entera en
        // la columna TEXT del post y se arrastra en cada render.
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none min-h-[150px] focus:outline-none p-4',
      },
    },
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

      {/* Bubble Menu: Estilo Notion / Flotante al seleccionar texto */}
      <BubbleMenu editor={editor} className="flex items-center gap-1 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg overflow-hidden">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('bold') ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-zinc-700 dark:text-zinc-300'}`}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('italic') ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-zinc-700 dark:text-zinc-300'}`}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-2 py-1 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('underline') ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-zinc-700 dark:text-zinc-300'}`}
        >
          Underline
        </button>
      </BubbleMenu>

      {/* Área de texto */}
      <div className="flex-1 overflow-y-auto cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
