/**
 * AQUARIUM & TERRARIUM SIMULATION ENGINE
 * Multi-species interactive canvas simulation with realistic swimming physics,
 * click-to-feed interaction, water ripples, and bioluminescent effects.
 */

class AquariumEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.creatures = [];
    this.foods = [];
    this.bubbles = [];
    this.ripples = [];
    this.species = 'koi'; // 'koi', 'jellyfish', 'axolotl', 'neko', 'dragon'
    this.targetFps = 60;
    this.lastFrameTime = performance.now();
    this.activeTheme = 'ocean';

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Click to feed & create ripples
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.feed(x, y);
    });

    this.initCreatures(8);
    this.initBubbles(25);
    this.loop();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  setSpecies(species) {
    this.species = species;
    this.initCreatures(species === 'jellyfish' ? 6 : (species === 'koi' ? 8 : 4));
  }

  setFps(fps) {
    this.targetFps = Math.max(15, fps || 60);
  }

  initCreatures(count) {
    this.creatures = [];
    for (let i = 0; i < count; i++) {
      this.creatures.push(this.createCreature(i));
    }
  }

  createCreature(index) {
    const isKoi = this.species === 'koi';
    const isJelly = this.species === 'jellyfish';
    const isAxolotl = this.species === 'axolotl';

    return {
      id: index,
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 1.5,
      size: 24 + Math.random() * 18,
      angle: Math.random() * Math.PI * 2,
      speed: 1.2 + Math.random() * 1.5,
      tailPhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      color: this.getSpeciesColor(index),
      targetFood: null,
    };
  }

  getSpeciesColor(index) {
    if (this.species === 'koi') {
      const palettes = [
        { primary: '#ff3b30', secondary: '#ffffff', spot: '#1a1a1a' }, // Kohaku / Sanke
        { primary: '#ff9500', secondary: '#ffffff', spot: '#ffffff' }, // Yamabuki
        { primary: '#ff2d55', secondary: '#ffcc00', spot: '#1a1a1a' }, // Showa
        { primary: '#ffffff', secondary: '#ff3b30', spot: '#ff3b30' }, // Tancho
      ];
      return palettes[index % palettes.length];
    } else if (this.species === 'jellyfish') {
      const glows = ['#00f2fe', '#8a2be2', '#ec4899', '#10b981'];
      return { glow: glows[index % glows.length] };
    } else if (this.species === 'axolotl') {
      return { body: '#fbcfe8', gills: '#f43f5e' };
    } else {
      return { neon: '#00f2fe' };
    }
  }

  initBubbles(count) {
    this.bubbles = [];
    for (let i = 0; i < count; i++) {
      this.bubbles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: 1.5 + Math.random() * 3.5,
        speed: 0.6 + Math.random() * 1.4,
        wobble: Math.random() * Math.PI * 2,
      });
    }
  }

  feed(x, y) {
    // Drop 3-5 food pellets
    for (let i = 0; i < 4; i++) {
      this.foods.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vy: 0.8 + Math.random() * 0.8,
        r: 3 + Math.random() * 2,
        life: 400,
      });
    }

    // Ripple
    this.ripples.push({
      x,
      y,
      r: 5,
      maxR: 70 + Math.random() * 40,
      alpha: 0.8,
    });
  }

  update() {
    // Update Food
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      f.y += f.vy;
      f.life--;
      if (f.y > this.height || f.life <= 0) {
        this.foods.splice(i, 1);
      }
    }

    // Update Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.r += 1.8;
      rip.alpha -= 0.015;
      if (rip.alpha <= 0 || rip.r >= rip.maxR) {
        this.ripples.splice(i, 1);
      }
    }

    // Update Bubbles
    for (const b of this.bubbles) {
      b.y -= b.speed;
      b.wobble += 0.05;
      b.x += Math.sin(b.wobble) * 0.6;
      if (b.y < -10) {
        b.y = this.height + 10;
        b.x = Math.random() * this.width;
      }
    }

    // Update Creatures
    for (const c of this.creatures) {
      // Check if food exists nearby
      if (this.foods.length > 0) {
        let nearestFood = null;
        let minDist = 350;
        for (const f of this.foods) {
          const d = Math.hypot(f.x - c.x, f.y - c.y);
          if (d < minDist) {
            minDist = d;
            nearestFood = f;
          }
        }

        if (nearestFood) {
          const angleToFood = Math.atan2(nearestFood.y - c.y, nearestFood.x - c.x);
          c.angle += (angleToFood - c.angle) * 0.08;
          c.vx = Math.cos(c.angle) * (c.speed * 1.6);
          c.vy = Math.sin(c.angle) * (c.speed * 1.6);

          // Eat food if close
          if (minDist < c.size * 0.6) {
            const idx = this.foods.indexOf(nearestFood);
            if (idx !== -1) {
              this.foods.splice(idx, 1);
              // Mini splash ripple
              this.ripples.push({ x: c.x, y: c.y, r: 2, maxR: 25, alpha: 0.6 });
            }
          }
        } else {
          // Wander randomly
          c.angle += (Math.random() - 0.5) * 0.08;
          c.vx = Math.cos(c.angle) * c.speed;
          c.vy = Math.sin(c.angle) * c.speed;
        }
      } else {
        c.angle += (Math.random() - 0.5) * 0.06;
        c.vx = Math.cos(c.angle) * c.speed;
        c.vy = Math.sin(c.angle) * c.speed;
      }

      c.x += c.vx;
      c.y += c.vy;
      c.tailPhase += 0.15;
      c.pulsePhase += 0.04;

      // Wrap boundaries
      const pad = c.size * 2;
      if (c.x < -pad) c.x = this.width + pad;
      if (c.x > this.width + pad) c.x = -pad;
      if (c.y < -pad) c.y = this.height + pad;
      if (c.y > this.height + pad) c.y = -pad;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw Ripples
    for (const rip of this.ripples) {
      this.ctx.beginPath();
      this.ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(0, 242, 254, ${rip.alpha * 0.6})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Draw Bubbles
    for (const b of this.bubbles) {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      this.ctx.lineWidth = 0.8;
      this.ctx.stroke();
    }

    // Draw Food
    for (const f of this.foods) {
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.shadowColor = '#f59e0b';
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Draw Creatures
    for (const c of this.creatures) {
      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate(c.angle);

      if (this.species === 'koi') {
        this.drawKoi(c);
      } else if (this.species === 'jellyfish') {
        this.drawJellyfish(c);
      } else if (this.species === 'axolotl') {
        this.drawAxolotl(c);
      } else {
        this.drawCyberCompanion(c);
      }

      this.ctx.restore();
    }
  }

  drawKoi(c) {
    const s = c.size;
    const tailWiggle = Math.sin(c.tailPhase) * (s * 0.35);

    // Koi Body
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, s, s * 0.38, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = c.color.secondary;
    this.ctx.fill();

    // Red / Orange Markings
    this.ctx.beginPath();
    this.ctx.ellipse(-s * 0.1, 0, s * 0.55, s * 0.28, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = c.color.primary;
    this.ctx.fill();

    // Black Accent Spot
    this.ctx.beginPath();
    this.ctx.ellipse(s * 0.2, -s * 0.08, s * 0.2, s * 0.12, 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = c.color.spot;
    this.ctx.fill();

    // Pectoral Fins
    this.ctx.beginPath();
    this.ctx.ellipse(s * 0.2, -s * 0.38, s * 0.32, s * 0.14, -0.6, 0, Math.PI * 2);
    this.ctx.ellipse(s * 0.2, s * 0.38, s * 0.32, s * 0.14, 0.6, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    this.ctx.fill();

    // Flexible Tail
    this.ctx.beginPath();
    this.ctx.moveTo(-s * 0.8, 0);
    this.ctx.quadraticCurveTo(-s * 1.3, tailWiggle * 0.5, -s * 1.6, tailWiggle);
    this.ctx.lineTo(-s * 1.5, tailWiggle + s * 0.25);
    this.ctx.quadraticCurveTo(-s * 1.1, tailWiggle * 0.5, -s * 0.8, 0);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    this.ctx.fill();

    // Eyes
    this.ctx.beginPath();
    this.ctx.arc(s * 0.7, -s * 0.18, 2, 0, Math.PI * 2);
    this.ctx.arc(s * 0.7, s * 0.18, 2, 0, Math.PI * 2);
    this.ctx.fillStyle = '#111';
    this.ctx.fill();
  }

  drawJellyfish(c) {
    const s = c.size * 1.1;
    const pulse = 1 + Math.sin(c.pulsePhase) * 0.18;

    // Glowing Bell
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, s * pulse, (s * 0.7) / pulse, 0, Math.PI, 0);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.shadowColor = c.color.glow;
    this.ctx.shadowBlur = 18;
    this.ctx.fill();
    this.ctx.strokeStyle = c.color.glow;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Tentacles trailing
    for (let i = -3; i <= 3; i++) {
      const tx = (i * s * 0.22) * pulse;
      const tentacleWave = Math.sin(c.tailPhase + i) * 6;
      this.ctx.beginPath();
      this.ctx.moveTo(tx, 0);
      this.ctx.quadraticCurveTo(tx + tentacleWave, s * 0.8, tx - tentacleWave, s * 1.8);
      this.ctx.strokeStyle = c.color.glow;
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();
    }
  }

  drawAxolotl(c) {
    const s = c.size;
    const wiggle = Math.sin(c.tailPhase) * (s * 0.25);

    // Body
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, s * 0.9, s * 0.45, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = c.color.body;
    this.ctx.fill();

    // External Feathery Gills
    for (let i = -1; i <= 1; i++) {
      const gy = i * s * 0.22;
      this.ctx.beginPath();
      this.ctx.moveTo(s * 0.5, gy);
      this.ctx.lineTo(s * 0.95, gy - 6);
      this.ctx.strokeStyle = c.color.gills;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    // Tail fin
    this.ctx.beginPath();
    this.ctx.moveTo(-s * 0.7, 0);
    this.ctx.quadraticCurveTo(-s * 1.2, wiggle, -s * 1.5, wiggle);
    this.ctx.strokeStyle = c.color.gills;
    this.ctx.lineWidth = 6;
    this.ctx.stroke();

    // Eyes
    this.ctx.beginPath();
    this.ctx.arc(s * 0.6, -s * 0.2, 2.5, 0, Math.PI * 2);
    this.ctx.arc(s * 0.6, s * 0.2, 2.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fill();
  }

  drawCyberCompanion(c) {
    const s = c.size;
    // Cyber Neko / Dragon Glowing Sprite
    this.ctx.beginPath();
    this.ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
    this.ctx.shadowColor = '#00f2fe';
    this.ctx.shadowBlur = 15;
    this.ctx.fill();
    this.ctx.strokeStyle = '#00f2fe';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Cat ears
    this.ctx.beginPath();
    this.ctx.moveTo(s * 0.3, -s * 0.35);
    this.ctx.lineTo(s * 0.5, -s * 0.7);
    this.ctx.lineTo(s * 0.1, -s * 0.45);
    this.ctx.fillStyle = '#c084fc';
    this.ctx.fill();
  }

  loop() {
    const now = performance.now();
    const frameInterval = 1000 / this.targetFps;
    const elapsed = now - this.lastFrameTime;

    if (elapsed >= frameInterval) {
      this.lastFrameTime = now - (elapsed % frameInterval);
      this.update();
      this.draw();
    }

    requestAnimationFrame(() => this.loop());
  }
}
