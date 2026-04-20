/**
 * Blendr — Moteur de dessin (Canvas)
 */

window.Blendr = window.Blendr || {};

(function () {
  const COLORS = [
    '#000000', '#FFFFFF', '#808080',
    '#FF0000', '#FF6B6B', '#FFA500', '#FFD93D',
    '#00CC00', '#00BFFF', '#0000FF', '#6C63FF', '#FF69B4',
  ];

  class CanvasDrawing {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.isDrawing = false;
      this.currentStroke = [];
      this.strokes = [];
      this.tool = 'pen';
      this.color = '#000000';
      this.size = 2;
      this.lastX = 0;
      this.lastY = 0;

      this.setupCanvas();
      this.bindEvents();
    }

    setupCanvas() {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = this.size;
    }

    bindEvents() {
      this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
      this.canvas.addEventListener('mousemove', (e) => this.draw(e));
      this.canvas.addEventListener('mouseup', () => this.stopDrawing());
      this.canvas.addEventListener('mouseout', () => this.stopDrawing());

      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.startDrawing(e.touches[0]);
      });
      this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        this.draw(e.touches[0]);
      });
      this.canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.stopDrawing();
      });
    }

    getCoords(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }

    startDrawing(e) {
      this.isDrawing = true;
      const coords = this.getCoords(e);
      this.lastX = coords.x;
      this.lastY = coords.y;
      this.currentStroke = {
        tool: this.tool,
        color: this.color,
        size: this.size,
        points: [coords],
      };
    }

    draw(e) {
      if (!this.isDrawing) return;

      const coords = this.getCoords(e);
      this.currentStroke.points.push(coords);

      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(coords.x, coords.y);

      if (this.tool === 'eraser') {
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 20;
      } else {
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.size;
      }

      this.ctx.stroke();
      this.lastX = coords.x;
      this.lastY = coords.y;
    }

    stopDrawing() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (this.currentStroke.points.length > 0) {
        this.strokes.push(this.currentStroke);
      }
      this.currentStroke = [];
    }

    setTool(tool) { this.tool = tool; }
    setColor(color) { this.color = color; this.tool = 'pen'; }
    setSize(size) { this.size = size; }

    undo() {
      if (this.strokes.length === 0) return;
      this.strokes.pop();
      this.redraw();
    }

    clear() {
      this.strokes = [];
      this.redraw();
    }

    redraw() {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.strokes.forEach((stroke) => {
        if (stroke.points.length < 2) return;
        this.ctx.beginPath();
        this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }

        if (stroke.tool === 'eraser') {
          this.ctx.strokeStyle = '#FFFFFF';
          this.ctx.lineWidth = 20;
        } else {
          this.ctx.strokeStyle = stroke.color;
          this.ctx.lineWidth = stroke.size;
        }

        this.ctx.stroke();
      });
    }

    isEmpty() {
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          return false;
        }
      }
      return true;
    }

    toDataURL() { return this.canvas.toDataURL('image/png'); }

    toJPEG(maxBytes = 480 * 1024) {
      let quality = 0.85;
      let data = this.canvas.toDataURL('image/jpeg', quality);
      while (data.length > maxBytes && quality > 0.3) {
        quality -= 0.15;
        data = this.canvas.toDataURL('image/jpeg', quality);
      }
      return data;
    }
  }

  window.Blendr.CanvasDrawing = CanvasDrawing;
  window.Blendr.CANVAS_COLORS = COLORS;
})();
