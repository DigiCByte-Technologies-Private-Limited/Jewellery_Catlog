import * as THREE from 'three';

/**
 * Generates a dynamic high-resolution texture for laser engraving
 * on the inner circumference of the precious metal band.
 */
export function createEngravingTexture(
  text: string,
  fontStyle: 'roman' | 'script' = 'roman'
): THREE.CanvasTexture | null {
  if (!text || text.trim() === '') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Transparent base
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Elegant luxury typography
  const fontName = fontStyle === 'roman' ? 'Cinzel, serif' : 'Cormorant Garamond, serif';
  ctx.font = `600 52px ${fontName}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Laser-etched metallic gold effect with slight bevel
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  // Gold foil letterpress fill
  const gradient = ctx.createLinearGradient(0, 80, 0, 180);
  gradient.addColorStop(0, '#59441B');
  gradient.addColorStop(0.5, '#E2C37A');
  gradient.addColorStop(1, '#6E5320');
  ctx.fillStyle = gradient;

  // Draw engraved text centered along the band's circumference
  const cleanText = `✦  ${text.trim().toUpperCase()}  ✦`;
  ctx.fillText(cleanText, canvas.width / 2, canvas.height / 2);

  // Subtle metallic micro-stroke
  ctx.strokeStyle = 'rgba(255, 245, 214, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeText(cleanText, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
