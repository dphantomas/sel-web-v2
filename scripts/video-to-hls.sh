#!/bin/bash

# Script simple para convertir videos MP4 a HLS (1080p, optimizado para web)
# Uso: ./video-to-hls.sh mi-video.mp4

if [ -z "$1" ]; then
  echo "Error: Debes proporcionar un archivo de video."
  echo "Uso: ./video-to-hls.sh ruta/al/video.mp4"
  exit 1
fi

INPUT_FILE="$1"
# Obtener el nombre del archivo sin extensión
BASENAME=$(basename "$INPUT_FILE" | cut -f 1 -d '.')
OUTPUT_DIR="${BASENAME}_hls"

# Crear directorio de salida
mkdir -p "$OUTPUT_DIR"

echo "Convirtiendo $INPUT_FILE a HLS en la carpeta '$OUTPUT_DIR'..."

# Ejecutar FFmpeg con configuración HLS óptima
ffmpeg -i "$INPUT_FILE" \
  -profile:v main -level 4.0 \
  -c:v libx264 -preset veryfast -crf 22 \
  -c:a aac -b:a 128k \
  -f hls \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename "$OUTPUT_DIR/segment_%03d.ts" \
  "$OUTPUT_DIR/index.m3u8"

echo ""
echo "✅ ¡Conversión exitosa!"
echo "Sube TODOS los archivos de la carpeta '$OUTPUT_DIR' a tu Cloudflare R2."
echo "En el panel de tu curso, pega la URL del archivo 'index.m3u8'."
