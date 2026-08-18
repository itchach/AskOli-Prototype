/* ============================================
   AskOli — Canvas Neural-Network Particles
   Subtle AI background animation
   ============================================ */

const Particles = (() => {
  let canvas, ctx;
  let particles = [];
  let animationId;
  let width, height;
  let mouse = { x: null, y: null };

  const CONFIG = {
    particleCount: 70,
    maxDistance: 150,
    particleSpeed: 0.3,
    particleMinSize: 1,
    particleMaxSize: 2.5,
    lineOpacity: 0.08,
    particleOpacity: 0.4,
    colors: {
      particle: [34, 211, 238],   // cyan
      line: [34, 211, 238],       // cyan
      particle2: [139, 92, 246],  // violet
      line2: [99, 102, 241],      // indigo
    },
    mouseRadius: 120,
    responsive: {
      768: { particleCount: 45 },
      480: { particleCount: 25 }
    }
  };

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * CONFIG.particleSpeed;
      this.vy = (Math.random() - 0.5) * CONFIG.particleSpeed;
      this.size = CONFIG.particleMinSize + Math.random() * (CONFIG.particleMaxSize - CONFIG.particleMinSize);
      // 80% cyan, 20% violet
      this.colorType = Math.random() < 0.8 ? 'primary' : 'secondary';
      this.opacity = 0.2 + Math.random() * (CONFIG.particleOpacity - 0.2);
      this.pulseSpeed = 0.005 + Math.random() * 0.015;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Keep within bounds
      this.x = Math.max(0, Math.min(width, this.x));
      this.y = Math.max(0, Math.min(height, this.y));

      // Pulse opacity
      this.pulsePhase += this.pulseSpeed;
      this.currentOpacity = this.opacity + Math.sin(this.pulsePhase) * 0.15;
    }

    draw() {
      const color = this.colorType === 'primary' ? CONFIG.colors.particle : CONFIG.colors.particle2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${this.currentOpacity})`;
      ctx.fill();

      // Subtle glow
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${this.currentOpacity * 0.1})`;
      ctx.fill();
    }
  }

  function _getParticleCount() {
    for (const [breakpoint, cfg] of Object.entries(CONFIG.responsive).sort((a, b) => a[0] - b[0])) {
      if (width <= parseInt(breakpoint)) {
        return cfg.particleCount;
      }
    }
    return CONFIG.particleCount;
  }

  function _initParticles() {
    particles = [];
    const count = _getParticleCount();
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function _drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.maxDistance) {
          const opacity = (1 - dist / CONFIG.maxDistance) * CONFIG.lineOpacity;
          const color = particles[i].colorType === 'secondary' || particles[j].colorType === 'secondary'
            ? CONFIG.colors.line2 : CONFIG.colors.line;

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function _animate() {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.update();
      p.draw();
    }

    _drawLines();

    animationId = requestAnimationFrame(_animate);
  }

  function _resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    _initParticles();
  }

  /**
   * Initialize the particle system.
   * @param {string} canvasId — ID of the canvas element
   */
  function init(canvasId = 'particles-canvas') {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    _resize();

    window.addEventListener('resize', () => {
      cancelAnimationFrame(animationId);
      _resize();
      _animate();
    });

    // Track mouse for interactive effects (optional)
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    _animate();
  }

  /**
   * Destroy the particle system.
   */
  function destroy() {
    cancelAnimationFrame(animationId);
    particles = [];
  }

  return { init, destroy };
})();
