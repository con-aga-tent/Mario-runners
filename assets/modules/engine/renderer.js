// modules/engine/renderer.js
// Responsibilities:
// - camera (follow x,y) with zoom
// - drawSprite(image, x,y,w,h, flipX)
// - parallax helper
// Exports: createRenderer(canvas), then renderer.setCamera, renderer.clear, renderer.drawSprite, renderer.drawText

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const renderer = {
    ctx,
    camera: { x: 0, y: 0, zoom: 1.5 },
    clear(color = "#6bb5ff") {
      ctx.setTransform(1,0,0,1,0,0);
      ctx.fillStyle = color;
      ctx.fillRect(0,0,canvas.width,canvas.height);
    },
    setCamera(x,y,zoom) {
      if (x !== undefined) this.camera.x = x;
      if (y !== undefined) this.camera.y = y;
      if (zoom !== undefined) this.camera.zoom = zoom;
    },
    worldToScreenX(x) { return (x - this.camera.x) * this.camera.zoom; },
    worldToScreenY(y) { return (y - this.camera.y) * this.camera.zoom; },

    drawSprite(img, x, y, w, h, flipX = false) {
      if (!img) return;
      ctx.save();
      ctx.translate(this.worldToScreenX(x), this.worldToScreenY(y));
      if (flipX) {
        ctx.scale(-1, 1);
        ctx.drawImage(img, -w * this.camera.zoom, 0, w * this.camera.zoom, h * this.camera.zoom);
      } else {
        ctx.drawImage(img, 0, 0, w * this.camera.zoom, h * this.camera.zoom);
      }
      ctx.restore();
    },

    drawParallax(img, offsetX = 0, y = 0, tileWidth = 600) {
      if (!img) return;
      // fill across screen with parallax offset
      const startWorldX = this.camera.x - (this.camera.x * 0.5) - tileWidth;
      for (let sx = startWorldX; sx < this.camera.x + (canvas.width / this.camera.zoom) + tileWidth; sx += tileWidth) {
        this.drawSprite(img, sx + offsetX, y, tileWidth, tileWidth * (img.height / img.width), false);
      }
    },

    drawText(text, sx, sy, size = 18, color = "#fff") {
      ctx.setTransform(1,0,0,1,0,0);
      ctx.fillStyle = color;
      ctx.font = `${size}px sans-serif`;
      ctx.fillText(text, sx, sy);
    }
  };
  return renderer;
}
