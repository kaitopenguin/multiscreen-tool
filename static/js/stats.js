/**
 * REAL-TIME SYSTEM TELEMETRY & WEBSOCKET CLIENT
 * Connects to Rust backend /ws and animates gauges, charts, and hardware sensors.
 */

class TelemetryManager {
  constructor(options = {}) {
    this.onModelRotated = options.onModelRotated || (() => {});
    this.onWallpaperUpdated = options.onWallpaperUpdated || (() => {});
    this.ws = null;
    this.connectWs();
  }

  connectWs() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Telemetry WebSocket connected.');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'stats_update') {
          this.updateUi(msg.data);
        } else if (msg.type === 'model_rotated') {
          this.onModelRotated(msg);
        } else if (msg.type === 'wallpaper_updated') {
          this.onWallpaperUpdated(msg.config);
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connectWs(), 2000);
    };
  }

  updateUi(stats) {
    // CPU
    const cpuVal = document.getElementById('gauge-cpu-val');
    const cpuFill = document.getElementById('gauge-cpu-fill');
    const cpuSub = document.getElementById('cpu-sub');
    if (cpuVal) cpuVal.textContent = `${Math.round(stats.cpu.usage_percent)}%`;
    if (cpuFill) {
      const offset = 220 - (220 * Math.min(100, stats.cpu.usage_percent)) / 100;
      cpuFill.style.strokeDashoffset = offset;
    }
    if (cpuSub) cpuSub.textContent = `${stats.cpu.core_count} Cores · ${stats.cpu.frequency_mhz} MHz`;

    // Memory
    const memVal = document.getElementById('gauge-mem-val');
    const memFill = document.getElementById('gauge-mem-fill');
    const memSub = document.getElementById('mem-sub');
    if (memVal) memVal.textContent = `${Math.round(stats.memory.percent)}%`;
    if (memFill) {
      const offset = 220 - (220 * Math.min(100, stats.memory.percent)) / 100;
      memFill.style.strokeDashoffset = offset;
    }
    if (memSub) memSub.textContent = `${stats.memory.used_gb} / ${stats.memory.total_gb} GB`;

    // Network
    const netDl = document.getElementById('net-dl');
    const netUl = document.getElementById('net-ul');
    if (netDl) {
      netDl.textContent = stats.network.download_speed_kb >= 1024
        ? `${(stats.network.download_speed_kb / 1024).toFixed(1)} MB/s`
        : `${Math.round(stats.network.download_speed_kb)} KB/s`;
    }
    if (netUl) {
      netUl.textContent = stats.network.upload_speed_kb >= 1024
        ? `${(stats.network.upload_speed_kb / 1024).toFixed(1)} MB/s`
        : `${Math.round(stats.network.upload_speed_kb)} KB/s`;
    }

    // Disk
    const diskLabel = document.getElementById('disk-label');
    const diskFill = document.getElementById('disk-bar-fill');
    if (stats.disks && stats.disks.length > 0) {
      const d = stats.disks[0];
      if (diskLabel) diskLabel.textContent = `${d.mount_point} (${d.used_gb}/${d.total_gb} GB - ${d.percent}%)`;
      if (diskFill) diskFill.style.width = `${d.percent}%`;
    }
  }
}
