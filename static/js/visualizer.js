/**
 * AUDIO VISUALIZER & SPECTRUM ENGINE
 * Responsive frequency equalizer bars with glowing gradients and ambient pulse.
 */

class AudioVisualizer {
  constructor(containerId, barCount = 28) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.barCount = barCount;
    this.bars = [];
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.isActive = false;
    this.phase = 0;

    this.initBars();
    this.startAmbient();
  }

  initBars() {
    this.container.innerHTML = '';
    this.bars = [];
    for (let i = 0; i < this.barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'visualizer-bar';
      this.container.appendChild(bar);
      this.bars.push(bar);
    }
  }

  startAmbient() {
    const render = () => {
      this.phase += 0.05;
      for (let i = 0; i < this.bars.length; i++) {
        // Multi-harmonic wave for natural organic audio pulse
        const v1 = Math.sin(this.phase * 1.5 + i * 0.35);
        const v2 = Math.cos(this.phase * 0.8 - i * 0.2);
        const v3 = Math.sin(this.phase * 2.2 + i * 0.15);
        const heightPct = Math.max(8, Math.min(100, (v1 + v2 + v3 + 2.5) * 18));
        this.bars[i].style.height = `${heightPct}%`;
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }
}
