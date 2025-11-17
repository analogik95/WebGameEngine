import { Component } from '../../core/Component';
import { CharacterStats } from '../components/CharacterStats';

/**
 * RPG HUD Component
 * Displays player stats, HP/MP bars, level, etc.
 * Renders as HTML overlay on top of WebGL canvas
 */
export class RPGHud extends Component {
  private hudElement: HTMLDivElement | null = null;
  private playerStats: CharacterStats | null = null;
  private updateInterval: number = 0.1; // Update every 0.1 seconds
  private timeSinceUpdate: number = 0;

  protected override awake(): void {
    this.createHudElement();
  }

  protected override start(): void {
    // Find player's CharacterStats component
    // In a full game, we'd have a way to reference the player
    console.log('[RPGHud] HUD initialized');
  }

  /**
   * Create HTML HUD overlay
   */
  private createHudElement(): void {
    // Create main HUD container
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'rpg-hud';
    this.hudElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: 'Segoe UI', Arial, sans-serif;
      z-index: 1000;
    `;

    // Add HUD HTML structure
    this.hudElement.innerHTML = `
      <style>
        .hud-panel {
          background: rgba(20, 20, 30, 0.8);
          border: 2px solid rgba(100, 150, 255, 0.5);
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }

        .stat-bar {
          width: 200px;
          height: 20px;
          background: rgba(40, 40, 50, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          margin: 5px 0;
        }

        .stat-bar-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 10px;
        }

        .hp-bar-fill {
          background: linear-gradient(90deg, #ff4444, #ff6666);
          box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
        }

        .mp-bar-fill {
          background: linear-gradient(90deg, #4444ff, #6666ff);
          box-shadow: 0 0 10px rgba(68, 68, 255, 0.5);
        }

        .exp-bar-fill {
          background: linear-gradient(90deg, #44ff44, #66ff66);
          box-shadow: 0 0 10px rgba(68, 255, 68, 0.5);
        }

        .stat-bar-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
          text-shadow: 1px 1px 2px black;
          pointer-events: none;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          margin-bottom: 3px;
        }

        .level-display {
          font-size: 24px;
          font-weight: bold;
          color: #ffd700;
          text-shadow: 2px 2px 4px black;
          margin-bottom: 10px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .stat-item {
          text-align: center;
          color: white;
          font-size: 12px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #4ef ff;
        }

        .notification {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 20px 40px;
          border-radius: 10px;
          font-size: 24px;
          font-weight: bold;
          animation: fadeInOut 2s ease;
          pointer-events: none;
        }

        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }
      </style>

      <!-- Top Left: Character Info -->
      <div style="position: absolute; top: 20px; left: 20px;">
        <div class="hud-panel">
          <div class="level-display" id="hud-level">Lv. 1</div>
          <div class="stat-label">HP</div>
          <div class="stat-bar">
            <div class="stat-bar-fill hp-bar-fill" id="hud-hp-bar" style="width: 100%;"></div>
            <div class="stat-bar-text" id="hud-hp-text">90 / 90</div>
          </div>
          <div class="stat-label">MP</div>
          <div class="stat-bar">
            <div class="stat-bar-fill mp-bar-fill" id="hud-mp-bar" style="width: 100%;"></div>
            <div class="stat-bar-text" id="hud-mp-text">140 / 140</div>
          </div>
          <div class="stat-label">EXP</div>
          <div class="stat-bar">
            <div class="stat-bar-fill exp-bar-fill" id="hud-exp-bar" style="width: 0%;"></div>
            <div class="stat-bar-text" id="hud-exp-text">0 / 100</div>
          </div>
        </div>
      </div>

      <!-- Top Right: Mini Stats -->
      <div style="position: absolute; top: 20px; right: 20px;">
        <div class="hud-panel">
          <div class="stats-grid">
            <div class="stat-item">
              <div style="color: #ff6666;">STR</div>
              <div class="stat-value" id="hud-str">8</div>
            </div>
            <div class="stat-item">
              <div style="color: #ff9966;">VIT</div>
              <div class="stat-value" id="hud-vit">9</div>
            </div>
            <div class="stat-item">
              <div style="color: #66ff66;">DEX</div>
              <div class="stat-value" id="hud-dex">11</div>
            </div>
            <div class="stat-item">
              <div style="color: #6666ff;">INT</div>
              <div class="stat-value" id="hud-int">14</div>
            </div>
            <div class="stat-item">
              <div style="color: #9966ff;">WIS</div>
              <div class="stat-value" id="hud-wis">10</div>
            </div>
            <div class="stat-item">
              <div style="color: #ffff66;">LUCK</div>
              <div class="stat-value" id="hud-luck">12</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Right: Money -->
      <div style="position: absolute; bottom: 20px; right: 20px;">
        <div class="hud-panel">
          <div style="color: #ffd700; font-size: 18px; font-weight: bold;">
            💰 <span id="hud-money">1000</span>
          </div>
        </div>
      </div>

      <!-- Notification Container -->
      <div id="hud-notifications"></div>
    `;

    document.body.appendChild(this.hudElement);
  }

  /**
   * Set the player stats to display
   */
  public setPlayerStats(stats: CharacterStats): void {
    this.playerStats = stats;

    // Set up event listeners
    stats.onLevelUp = (level) => this.onLevelUp(level);
    stats.onStatChange = (stat, value) => this.onStatChange(stat, value);

    // Initial update
    this.updateHud();
  }

  /**
   * Update HUD display
   */
  protected override update(deltaTime: number): void {
    this.timeSinceUpdate += deltaTime;

    if (this.timeSinceUpdate >= this.updateInterval && this.playerStats) {
      this.updateHud();
      this.timeSinceUpdate = 0;
    }
  }

  /**
   * Update all HUD elements
   */
  private updateHud(): void {
    if (!this.playerStats) return;

    const info = this.playerStats.getInfo();

    // Level
    this.setElementText('hud-level', `Lv. ${info.level}`);

    // HP Bar
    const hpPercent = (info.hp / info.maxHp) * 100;
    this.setBarWidth('hud-hp-bar', hpPercent);
    this.setElementText('hud-hp-text', `${Math.floor(info.hp)} / ${info.maxHp}`);

    // MP Bar
    const mpPercent = (info.mp / info.maxMp) * 100;
    this.setBarWidth('hud-mp-bar', mpPercent);
    this.setElementText('hud-mp-text', `${Math.floor(info.mp)} / ${info.maxMp}`);

    // EXP Bar
    const expPercent = (info.exp / info.expToNext) * 100;
    this.setBarWidth('hud-exp-bar', expPercent);
    this.setElementText('hud-exp-text', `${info.exp} / ${info.expToNext}`);

    // Stats
    this.setElementText('hud-str', info.stats.str);
    this.setElementText('hud-vit', info.stats.vit);
    this.setElementText('hud-dex', info.stats.dex);
    this.setElementText('hud-int', info.stats.int);
    this.setElementText('hud-wis', info.stats.wis);
    this.setElementText('hud-luck', info.stats.luck);

    // Money
    this.setElementText('hud-money', info.money);
  }

  /**
   * Show notification message
   */
  public showNotification(message: string, duration: number = 2000): void {
    const container = document.getElementById('hud-notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, duration);
  }

  /**
   * Handle level up event
   */
  private onLevelUp(level: number): void {
    this.showNotification(`🎉 LEVEL UP! You are now level ${level}! 🎉`, 3000);
  }

  /**
   * Handle stat change event
   */
  private onStatChange(stat: string, value: number): void {
    this.showNotification(`${stat.toUpperCase()} increased to ${value}!`, 2000);
  }

  /**
   * Helper: Set element text
   */
  private setElementText(id: string, text: string | number): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text.toString();
    }
  }

  /**
   * Helper: Set bar width
   */
  private setBarWidth(id: string, percent: number): void {
    const element = document.getElementById(id);
    if (element) {
      element.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }
  }

  /**
   * Show/Hide HUD
   */
  public setVisible(visible: boolean): void {
    if (this.hudElement) {
      this.hudElement.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Clean up on destroy
   */
  protected override onDestroy(): void {
    if (this.hudElement && this.hudElement.parentElement) {
      this.hudElement.parentElement.removeChild(this.hudElement);
    }
  }
}
