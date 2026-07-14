'use client';

import { useState } from 'react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

export function ReviewContentEditor({ initialContent }: { initialContent?: string }) {
  const [content, setContent] = useState(initialContent || '');
  return (
    <>
      <input type="hidden" name="content" value={content} />
      <RichTextEditor 
        value={content} 
        onChange={setContent} 
        placeholder="Escribe el testimonio aquí..."
      />
    </>
  );
}
