'use client';

import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useRef, useState } from 'react';

/**
 * Imagen redimensionable para el editor. Extiende la Image base de Tiptap y le
 * agrega un NodeView con un tirador en la esquina para cambiar el ancho
 * arrastrando.
 *
 * Clave: el tamaño se guarda en el atributo `width` (no en `style`). La Image
 * base ya lo renderiza como `<img width="...">` vía mergeAttributes, y el
 * sanitizador (src/lib/html.ts) permite `width`/`height` como atributos de img
 * pero NO `style`. Si guardáramos el tamaño en `style="width:..."`, se vería en
 * el editor pero desaparecería al publicar, sin error ni warning.
 */
function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  // Ancho "en vivo" mientras se arrastra; se confirma al soltar para no ensuciar
  // el historial de undo con una entrada por cada pixel.
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const savedWidth = (node.attrs.width as number | null) ?? undefined;
  const displayWidth = dragWidth ?? savedWidth;

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = imgRef.current?.offsetWidth ?? 0;
    let current = startWidth;

    const onMove = (ev: PointerEvent) => {
      current = Math.max(60, Math.round(startWidth + (ev.clientX - startX)));
      setDragWidth(current);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setDragWidth(null);
      updateAttributes({ width: current });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <NodeViewWrapper
      as="span"
      className="resizable-image"
      style={{ display: 'inline-block', position: 'relative', lineHeight: 0, maxWidth: '100%' }}
    >
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt ?? ''}
        title={node.attrs.title ?? undefined}
        width={displayWidth}
        draggable={false}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 2,
          outline: selected ? '2px solid #2563eb' : 'none',
        }}
      />
      {selected && (
        <span
          onPointerDown={startResize}
          title="Arrastrá para cambiar el tamaño"
          style={{
            position: 'absolute',
            right: -7,
            bottom: -7,
            width: 14,
            height: 14,
            background: '#2563eb',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
