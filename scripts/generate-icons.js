import fs from 'fs';
import { createCanvas } from 'canvas';

// Create a canvas for each size
const sizes = [16, 32, 64, 192, 512];
const canvases = sizes.map(size => createCanvas(size, size));

// Set up each canvas with the music symbol
canvases.forEach((canvas, index) => {
  const ctx = canvas.getContext('2d');
  const size = sizes[index];
  
  // Fill background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  
  // Draw music symbol
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.8}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎵', size/2, size/2);
});

// Save the files
canvases.forEach((canvas, index) => {
  const size = sizes[index];
  const buffer = canvas.toBuffer('image/png');
  const filename = size <= 64 ? 'favicon.ico' : `logo${size}.png`;
  fs.writeFileSync(`public/${filename}`, buffer);
}); 