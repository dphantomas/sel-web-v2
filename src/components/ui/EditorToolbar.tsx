'use client';

import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { EmojiPopover } from './EmojiPopover';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Script from 'next/script';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [isUploading, setIsUploading] = useState(false);

  if (!editor) return null;

  const openCloudinaryWidget = async () => {
    try {
      setIsUploading(true);
      // 1. Obtener firma del backend
      const signRes = await fetch('/api/media/cloudinary-sign?folder=wysiwyg-uploads');
      if (!signRes.ok) throw new Error('Error al firmar en backend');
      const { signature, timestamp, folder, cloudName, apiKey } = await signRes.json();

      // 2. Abrir Widget
      const widget = (window as any).cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          apiKey: apiKey,
          uploadSignatureTimestamp: timestamp,
          uploadSignature: signature,
          folder: folder,
          sources: ['local', 'url', 'camera', 'google_drive'],
          multiple: false,
          clientAllowedFormats: ['image'],
          maxImageFileSize: 10000000,
          theme: 'minimal'
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            editor.chain().focus().setImage({ src: result.info.secure_url }).run();
          }
          if (error) {
             console.error("Cloudinary widget error:", error);
          }
        }
      );
      
      widget.open();
    } catch (e) {
      console.error(e);
      alert('Error iniciando subida');
    } finally {
      setIsUploading(false);
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ToolbarBtn = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: { 
    onClick: () => void, 
    isActive?: boolean, 
    disabled?: boolean, 
    children: React.ReactNode, 
    title: string 
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md flex items-center justify-center transition-colors
        ${isActive ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* Undo / Redo */}
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} title="Deshacer">
        <Undo className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} title="Rehacer">
        <Redo className="w-4 h-4" />
      </ToolbarBtn>

      <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-1" />

      {/* Formato de Texto */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Negrita">
        <Bold className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Cursiva">
        <Italic className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Subrayado">
        <Underline className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Tachado">
        <Strikethrough className="w-4 h-4" />
      </ToolbarBtn>

      <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-1" />

      {/* Encabezados */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Título 1">
        <Heading1 className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Título 2">
        <Heading2 className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Título 3">
        <Heading3 className="w-4 h-4" />
      </ToolbarBtn>

      <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-1" />

      {/* Listas y Citas */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Lista de viñetas">
        <List className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Lista numerada">
        <ListOrdered className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Cita">
        <Quote className="w-4 h-4" />
      </ToolbarBtn>

      <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-1" />

      {/* Medios y Enlaces */}
      <ToolbarBtn onClick={setLink} isActive={editor.isActive('link')} title="Enlace">
        <LinkIcon className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={openCloudinaryWidget} disabled={isUploading} title="Insertar Imagen">
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
      </ToolbarBtn>
      
      {/* Selector de Emojis */}
      <EmojiPopover onEmojiSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()} />

      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
    </div>
  );
}
