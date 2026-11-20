/**
 * FISH FRIEND INTERACTIVE TANK SIMULATION
 * Recreated in the charming aesthetic of "Fish food for my fish friend 🐟"
 * Features: expressive fish companions, click-to-drop food flakes, excited food dash,
 * mouth opening munching animation, bubble particles, floating emotes, and swaying plants.
 */

class FishFriendTank {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.foods = [];
    this.bubbles = [];
    this.emotes = [];
    this.plants = [];

    // Current companion selection
    this.companionType = 'clownfish'; // 'clownfish', 'koi', 'axolotl', 'puffer', 'jellyfish'

    // Fish Friend Actor
    this.fish = {
      x: 180,
      y: 180,
      vx: 1.2,
      vy: 0.2,
      size: 44,
      angle: 0,
      targetAngle: 0,
      speed: 1.6,
      tailPhase: 0,
      finPhase: 0,
      eyeLookX: 0,
      eyeLookY: 0,
      isEating: false,
      mouthOpen: 0,
      excited: false,
      excitedTimer: 0,
      happyHop: 0,
    };

    this.mouse = { x: 0, y: 0, active: false };
    this.destroyed = false;
    this.animId = null;
    this.initCanvas();
    this.initPlants();
    this.bindEvents();
    this.loop();
  }

  destroy() {
    this.destroyed = true;
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  initCanvas() {
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
      this.initPlants();
    });
  }

  resize() {
    this.width = this.canvas.width = this.canvas.parentElement.clientWidth || 360;
    this.height = this.canvas.height = this.canvas.parentElement.clientHeight || 280;
  }

  setCompanion(type) {
    this.companionType = type;
    this.triggerEmote('✨');
  }

  initPlants() {
    this.plants = [];
    const count = Math.max(4, Math.floor(this.width / 45));
    for (let i = 0; i < count; i++) {
      this.plants.push({
        x: 18 + i * 44 + (Math.random() - 0.5) * 15,
        height: 60 + Math.random() * 55,
        swaySpeed: 1.5 + Math.random() * 1.2,
        swayPhase: Math.random() * Math.PI * 2,
        segments: 4 + Math.floor(Math.random() * 3),
        color: i % 2 === 0 ? '#10b981' : '#059669',
      });
    }
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.dropFood(clickX, clickY);
    });

    // Touch support for secondary touchscreen
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;
        this.dropFood(touchX, touchY);
      }
    });
  }

  dropFood(x, y) {
    // Drop 3-5 colorful appetizing food flakes
    const flakeColors = ['#f59e0b', '#ef4444', '#10b981', '#fbbf24', '#f97316'];
    for (let i = 0; i < 4; i++) {
      this.foods.push({
        x: x + (Math.random() - 0.5) * 22,
        y: Math.max(10, y + (Math.random() - 0.5) * 15),
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.6 + Math.random() * 0.7,
        w: 5 + Math.random() * 4,
        h: 3 + Math.random() * 3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        color: flakeColors[Math.floor(Math.random() * flakeColors.length)],
        life: 500,
      });
    }

    // Fish notices food! Trigger cute emote
    this.fish.excited = true;
    this.fish.excitedTimer = 180;
    this.triggerEmote(Math.random() > 0.4 ? '♥' : '!');

    // Water surface ripples
    this.bubbles.push({
      x,
      y: Math.min(y, 25),
      r: 3 + Math.random() * 3,
      speed: 0.4,
      wobble: 0,
      life: 60,
    });
  }

  triggerEmote(text) {
    this.emotes.push({
      text,
      x: this.fish.x,
      y: this.fish.y - this.fish.size * 0.6,
      alpha: 1.0,
      vy: -0.6,
      scale: 0.5,
    });
  }

  update() {
    const f = this.fish;

    // 1. Food Seeking Physics
    if (this.foods.length > 0) {
      let closestFood = null;
      let minDistance = 9999;
      for (const food of this.foods) {
        const d = Math.hypot(food.x - f.x, food.y - f.y);
        if (d < minDistance) {
          minDistance = d;
          closestFood = food;
        }
      }

      if (closestFood) {
        // Look towards food
        const targetAngle = Math.atan2(closestFood.y - f.y, closestFood.x - f.x);
        f.targetAngle = targetAngle;
        f.angle += (targetAngle - f.angle) * 0.12;

        const dashSpeed = 2.8;
        f.vx = Math.cos(f.angle) * dashSpeed;
        f.vy = Math.sin(f.angle) * dashSpeed;

        // Eye tracking
        f.eyeLookX = Math.cos(targetAngle) * 3;
        f.eyeLookY = Math.sin(targetAngle) * 3;

        // Mouth opens when near food
        if (minDistance < f.size * 0.8) {
          f.mouthOpen = Math.min(1.0, f.mouthOpen + 0.2);
        } else {
          f.mouthOpen = Math.max(0.0, f.mouthOpen - 0.1);
        }

        // Eat the food!
        if (minDistance < f.size * 0.4) {
          const idx = this.foods.indexOf(closestFood);
          if (idx !== -1) {
            this.foods.splice(idx, 1);
            f.isEating = true;
            f.happyHop = 8;
            this.triggerEmote('Nom!');

            // Tiny munch bubbles
            for (let b = 0; b < 3; b++) {
              this.bubbles.push({
                x: f.x + Math.cos(f.angle) * (f.size * 0.5),
                y: f.y + Math.sin(f.angle) * (f.size * 0.5),
                r: 1.5 + Math.random() * 2.5,
                speed: 0.8 + Math.random() * 0.8,
                wobble: Math.random() * 6,
                life: 100,
              });
            }
          }
        }
      }
    } else {
      // Idle playful swimming
      f.mouthOpen = Math.max(0.0, f.mouthOpen - 0.08);

      if (this.mouse.active) {
        const dMouse = Math.hypot(this.mouse.x - f.x, this.mouse.y - f.y);
        if (dMouse < 180) {
          f.eyeLookX = ((this.mouse.x - f.x) / dMouse) * 3;
          f.eyeLookY = ((this.mouse.y - f.y) / dMouse) * 3;
        }
      }

      // Gentle natural wandering
      if (Math.random() < 0.02) {
        f.targetAngle = (Math.random() - 0.5) * 1.5 + (f.vx < 0 ? Math.PI : 0);
      }
      f.angle += (f.targetAngle - f.angle) * 0.04;
      f.vx = Math.cos(f.angle) * f.speed;
      f.vy = Math.sin(f.angle) * f.speed;
    }

    f.x += f.vx;
    f.y += f.vy;
    f.tailPhase += 0.2 + Math.abs(f.vx) * 0.08;
    f.finPhase += 0.15;

    // Boundaries bounce
    const pad = f.size * 0.6;
    if (f.x < pad) {
      f.x = pad;
      f.targetAngle = 0;
    } else if (f.x > this.width - pad) {
      f.x = this.width - pad;
      f.targetAngle = Math.PI;
    }

    if (f.y < pad + 20) {
      f.y = pad + 20;
      f.targetAngle = Math.PI * 0.5;
    } else if (f.y > this.height - pad - 25) {
      f.y = this.height - pad - 25;
      f.targetAngle = -Math.PI * 0.5;
    }

    // 2. Update Food Flakes
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const food = this.foods[i];
      food.x += food.vx;
      food.y += food.vy;
      food.rot += food.rotSpeed;
      food.life--;
      // Settle gently on gravel floor
      if (food.y >= this.height - 18) {
        food.vy = 0;
        food.vx = 0;
      }
      if (food.life <= 0) {
        this.foods.splice(i, 1);
      }
    }

    // 3. Update Ambient Bubbles
    if (Math.random() < 0.08) {
      this.bubbles.push({
        x: 20 + Math.random() * (this.width - 40),
        y: this.height - 15,
        r: 1.5 + Math.random() * 3.5,
        speed: 0.7 + Math.random() * 1.2,
        wobble: Math.random() * Math.PI * 2,
        life: 300,
      });
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y -= b.speed;
      b.wobble += 0.06;
      b.x += Math.sin(b.wobble) * 0.5;
      b.life--;
      if (b.y < 12 || b.life <= 0) {
        this.bubbles.splice(i, 1);
      }
    }

    // 4. Update Emotes
    for (let i = this.emotes.length - 1; i >= 0; i--) {
      const e = this.emotes[i];
      e.y += e.vy;
      e.scale = Math.min(1.2, e.scale + 0.05);
      e.alpha -= 0.015;
      if (e.alpha <= 0) {
        this.emotes.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Water Gradient Background (Soft Cyber Aquatic)
    const waterGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    waterGrad.addColorStop(0, '#0a1d37');
    waterGrad.addColorStop(0.6, '#08172c');
    waterGrad.addColorStop(1, '#050f1d');
    this.ctx.fillStyle = waterGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Water Surface Wave Highlights
    this.ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
    this.ctx.fillRect(0, 0, this.width, 14);

    // 2. Draw Swaying Aquatic Plants at Bottom
    this.drawPlants();

    // 3. Draw Bottom Gravel / Sand Bed
    this.drawGravelBed();

    // 4. Draw Rising Ambient Bubbles
    for (const b of this.bubbles) {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // 5. Draw Food Flakes
    for (const f of this.foods) {
      this.ctx.save();
      this.ctx.translate(f.x, f.y);
      this.ctx.rotate(f.rot);
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, f.w, f.h, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = f.color;
      this.ctx.shadowColor = f.color;
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.restore();
    }

    // 6. Draw the Fish Friend!
    this.drawFishFriend();

    // 7. Draw Floating Emotes (♥, !, Nom!)
    for (const e of this.emotes) {
      this.ctx.save();
      this.ctx.font = 'bold 16px "Inter", sans-serif';
      this.ctx.fillStyle = `rgba(255, 107, 129, ${e.alpha})`;
      this.ctx.shadowColor = 'rgba(255, 107, 129, 0.6)';
      this.ctx.shadowBlur = 8;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(e.text, e.x, e.y);
      this.ctx.restore();
    }
  }

  drawGravelBed() {
    const bedHeight = 22;
    const y = this.height - bedHeight;

    // Gravel Sand Gradient
    const sandGrad = this.ctx.createLinearGradient(0, y, 0, this.height);
    sandGrad.addColorStop(0, '#1e293b');
    sandGrad.addColorStop(1, '#0f172a');
    this.ctx.fillStyle = sandGrad;
    this.ctx.fillRect(0, y, this.width, bedHeight);

    // Decorative cute river pebbles
    const pebbleColors = ['#334155', '#475569', '#1e293b', '#64748b'];
    for (let i = 0; i < this.width; i += 28) {
      const px = i + 10;
      const py = y + 8 + ((i * 7) % 8);
      const pr = 6 + ((i * 3) % 4);
      this.ctx.beginPath();
      this.ctx.ellipse(px, py, pr * 1.3, pr * 0.7, 0.2, 0, Math.PI * 2);
      this.ctx.fillStyle = pebbleColors[i % pebbleColors.length];
      this.ctx.fill();
    }
  }

  drawPlants() {
    const time = performance.now() * 0.002;
    for (const p of this.plants) {
      const sway = Math.sin(time * p.swaySpeed + p.swayPhase) * 14;

      this.ctx.beginPath();
      this.ctx.moveTo(p.x, this.height - 18);
      this.ctx.quadraticCurveTo(
        p.x + sway * 0.6,
        this.height - 18 - p.height * 0.5,
        p.x + sway,
        this.height - 18 - p.height
      );
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = 6;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      // Cute leaves branching
      const midY = this.height - 18 - p.height * 0.45;
      this.ctx.beginPath();
      this.ctx.ellipse(p.x + sway * 0.4 + 7, midY, 8, 4, 0.5, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
    }
  }

  drawFishFriend() {
    const f = this.fish;
    this.ctx.save();
    this.ctx.translate(f.x, f.y);

    const facingLeft = Math.cos(f.angle) < 0;
    this.ctx.scale(facingLeft ? -1 : 1, 1);
    this.ctx.rotate(facingLeft ? Math.PI - f.angle : f.angle);

    const s = f.size;
    const tailWiggle = Math.sin(f.tailPhase) * (s * 0.3);

    if (this.companionType === 'clownfish') {
      this.drawClownfish(s, tailWiggle, f);
    } else if (this.companionType === 'koi') {
      this.drawKoi(s, tailWiggle, f);
    } else if (this.companionType === 'axolotl') {
      this.drawAxolotl(s, tailWiggle, f);
    } else {
      this.drawClownfish(s, tailWiggle, f);
    }

    this.ctx.restore();
  }

  drawClownfish(s, tailWiggle, f) {
    // 1. Back Caudal Fin
    this.ctx.beginPath();
    this.ctx.moveTo(-s * 0.7, 0);
    this.ctx.quadraticCurveTo(-s * 1.1, tailWiggle * 0.5, -s * 1.35, tailWiggle - s * 0.28);
    this.ctx.quadraticCurveTo(-s * 1.0, tailWiggle * 0.5, -s * 1.35, tailWiggle + s * 0.28);
    this.ctx.closePath();
    this.ctx.fillStyle = '#ff6b35';
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    // 2. Cute Orange Chubby Body
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, s * 0.75, s * 0.46, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ff6b35';
    this.ctx.fill();

    // 3. White Curved Clownfish Stripes with dark outlines
    this.ctx.beginPath();
    this.ctx.ellipse(s * 0.05, 0, s * 0.16, s * 0.44, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.ellipse(-s * 0.38, 0, s * 0.12, s * 0.34, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    this.ctx.stroke();

    // 4. Fluttering Pectoral Fin
    const finAngle = Math.sin(f.finPhase) * 0.35;
    this.ctx.save();
    this.ctx.translate(s * 0.05, s * 0.15);
    this.ctx.rotate(finAngle);
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, s * 0.24, s * 0.14, 0.4, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 120, 60, 0.85)';
    this.ctx.fill();
    this.ctx.restore();

    // 5. Big Expressive Anime Eye
    const eyeX = s * 0.42;
    const eyeY = -s * 0.14;
    this.ctx.beginPath();
    this.ctx.arc(eyeX, eyeY, s * 0.15, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Pupil looking at target
    this.ctx.beginPath();
    this.ctx.arc(eyeX + f.eyeLookX * 0.8, eyeY + f.eyeLookY * 0.8, s * 0.08, 0, Math.PI * 2);
    this.ctx.fillStyle = '#111827';
    this.ctx.fill();

    // Cute Eye Highlight sparkle
    this.ctx.beginPath();
    this.ctx.arc(eyeX + f.eyeLookX * 0.8 - 2, eyeY + f.eyeLookY * 0.8 - 2, 2.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();

    // 6. Cute Mouth (Opens when eating!)
    const mouthGap = f.mouthOpen * 6;
    this.ctx.beginPath();
    this.ctx.moveTo(s * 0.72, s * 0.05 - mouthGap);
    this.ctx.lineTo(s * 0.65, s * 0.08);
    this.ctx.lineTo(s * 0.72, s * 0.12 + mouthGap);
    this.ctx.strokeStyle = '#7c2d12';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  drawKoi(s, tailWiggle, f) {
    // Japanese Kohaku Koi (Pearl White with Bold Scarlet Patterns)
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, s * 0.85, s * 0.36, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();

    // Scarlet Kohaku spots
    this.ctx.beginPath();
    this.ctx.ellipse(-s * 0.1, -s * 0.05, s * 0.42, s * 0.22, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fill();

    // Tail
    this.ctx.beginPath();
    this.ctx.moveTo(-s * 0.75, 0);
    this.ctx.quadraticCurveTo(-s * 1.2, tailWiggle * 0.5, -s * 1.5, tailWiggle);
    this.ctx.lineTo(-s * 1.35, tailWiggle + s * 0.22);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    this.ctx.fill();

    // Eye
    this.ctx.beginPath();
    this.ctx.arc(s * 0.55, -s * 0.12, 4, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fill();
  }

  drawAxolotl(s, tailWiggle, f) {
    // Cute Pink Axolotl
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, s * 0.72, s * 0.42, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fbcfe8';
    this.ctx.fill();

    // 3 Feathery External Gills on top and bottom
    for (let g = -1; g <= 1; g++) {
      const gy = g * s * 0.25;
      this.ctx.beginPath();
      this.ctx.moveTo(s * 0.25, gy);
      this.ctx.lineTo(s * 0.65, gy - 8);
      this.ctx.strokeStyle = '#f43f5e';
      this.ctx.lineWidth = 3.5;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }

    // Smiling face
    this.ctx.beginPath();
    this.ctx.arc(s * 0.45, -s * 0.12, 3, 0, Math.PI * 2);
    this.ctx.arc(s * 0.45, s * 0.12, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(s * 0.6, 0, 4, 0, Math.PI);
    this.ctx.strokeStyle = '#e11d48';
    this.ctx.lineWidth = 1.8;
    this.ctx.stroke();
  }

  loop() {
    if (this.destroyed) return;
    this.update();
    this.draw();
    this.animId = requestAnimationFrame(() => this.loop());
  }
}
