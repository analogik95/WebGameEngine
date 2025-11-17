/**
 * The Gamer RPG - Game UI System
 * Renders HUD, status windows, menus, etc.
 */

import { PlayerStats } from '../systems/PlayerStats';
import { SkillSystem } from '../systems/SkillSystem';
import { ObserveData } from '../systems/GamerAbilities';

export class GameUI {
  private container: HTMLElement;
  private hudElement: HTMLElement;
  private statusWindow: HTMLElement | null = null;
  private playerStats: PlayerStats | null = null;
  private skillSystem: SkillSystem | null = null;

  constructor(containerId: string = 'game-ui') {
    // Create or get container
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }

    this.container = container;
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: 'Arial', sans-serif;
      z-index: 1000;
    `;

    // Create HUD
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'hud';
    this.container.appendChild(this.hudElement);

    this.initializeHUD();
  }

  // ========================================================================
  // HUD (Heads-Up Display)
  // ========================================================================

  private initializeHUD(): void {
    this.hudElement.innerHTML = `
      <style>
        #hud {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .hud-top-left {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid #ffaa00;
          border-radius: 10px;
          padding: 15px;
          color: white;
          min-width: 300px;
        }

        .player-name {
          font-size: 18px;
          font-weight: bold;
          color: #ffaa00;
          margin-bottom: 5px;
        }

        .player-level {
          font-size: 14px;
          color: #aaaaaa;
          margin-bottom: 10px;
        }

        .stat-bar {
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 12px;
          margin-bottom: 2px;
          display: flex;
          justify-content: space-between;
        }

        .bar-container {
          width: 100%;
          height: 20px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #666;
          border-radius: 3px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .hp-bar {
          background: linear-gradient(90deg, #ff0000, #ff6666);
        }

        .mp-bar {
          background: linear-gradient(90deg, #0066ff, #6699ff);
        }

        .exp-bar {
          background: linear-gradient(90deg, #ffaa00, #ffdd00);
        }

        .hud-top-right {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid #ffaa00;
          border-radius: 10px;
          padding: 10px;
          color: white;
          min-width: 200px;
        }

        .quest-title {
          font-size: 14px;
          font-weight: bold;
          color: #ffaa00;
          margin-bottom: 5px;
        }

        .quest-objective {
          font-size: 12px;
          color: #cccccc;
          margin-bottom: 3px;
        }

        .hud-bottom-center {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
        }

        .skill-slot {
          width: 50px;
          height: 50px;
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid #666;
          border-radius: 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          position: relative;
        }

        .skill-slot.active {
          border-color: #ffaa00;
        }

        .skill-slot.cooldown::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: var(--cooldown-percent);
          background: rgba(0, 0, 0, 0.7);
        }

        .skill-hotkey {
          font-size: 10px;
          color: #ffaa00;
        }

        .skill-name {
          font-size: 8px;
          color: #cccccc;
          text-align: center;
        }

        .damage-number {
          position: absolute;
          color: #ff0000;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 2px 2px 4px #000;
          animation: damage-float 1s ease-out forwards;
          pointer-events: none;
        }

        .damage-number.crit {
          color: #ffaa00;
          font-size: 32px;
        }

        .damage-number.heal {
          color: #00ff00;
        }

        @keyframes damage-float {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px);
          }
        }

        .notification {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.9);
          border: 3px solid #ffaa00;
          border-radius: 15px;
          padding: 30px 50px;
          color: #ffaa00;
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          animation: notification-show 2s ease-out forwards;
        }

        @keyframes notification-show {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      </style>

      <!-- Player Stats (Top Left) -->
      <div class="hud-top-left">
        <div class="player-name" id="player-name">Anatoly Petrauskas</div>
        <div class="player-level" id="player-level">Level 1</div>

        <!-- HP Bar -->
        <div class="stat-bar">
          <div class="stat-label">
            <span>HP</span>
            <span id="hp-text">90/90</span>
          </div>
          <div class="bar-container">
            <div class="bar-fill hp-bar" id="hp-bar" style="width: 100%;"></div>
          </div>
        </div>

        <!-- MP Bar -->
        <div class="stat-bar">
          <div class="stat-label">
            <span>MP</span>
            <span id="mp-text">140/140</span>
          </div>
          <div class="bar-container">
            <div class="bar-fill mp-bar" id="mp-bar" style="width: 100%;"></div>
          </div>
        </div>

        <!-- EXP Bar -->
        <div class="stat-bar">
          <div class="stat-label">
            <span>EXP</span>
            <span id="exp-text">0/100</span>
          </div>
          <div class="bar-container">
            <div class="bar-fill exp-bar" id="exp-bar" style="width: 0%;"></div>
          </div>
        </div>
      </div>

      <!-- Active Quest (Top Right) -->
      <div class="hud-top-right" id="quest-display" style="display: none;">
        <div class="quest-title">Active Quest</div>
        <div class="quest-objective" id="quest-objective-1"></div>
        <div class="quest-objective" id="quest-objective-2"></div>
        <div class="quest-objective" id="quest-objective-3"></div>
      </div>

      <!-- Skill Bar (Bottom Center) -->
      <div class="hud-bottom-center" id="skill-bar">
        <div class="skill-slot" id="skill-1">
          <div class="skill-hotkey">1</div>
          <div class="skill-name">-</div>
        </div>
        <div class="skill-slot" id="skill-2">
          <div class="skill-hotkey">2</div>
          <div class="skill-name">-</div>
        </div>
        <div class="skill-slot" id="skill-3">
          <div class="skill-hotkey">3</div>
          <div class="skill-name">-</div>
        </div>
        <div class="skill-slot" id="skill-4">
          <div class="skill-hotkey">4</div>
          <div class="skill-name">-</div>
        </div>
        <div class="skill-slot" id="skill-5">
          <div class="skill-hotkey">5</div>
          <div class="skill-name">-</div>
        </div>
        <div class="skill-slot" id="skill-6">
          <div class="skill-hotkey">6</div>
          <div class="skill-name">-</div>
        </div>
        <div class="skill-slot" id="skill-7">
          <div class="skill-hotkey">7</div>
          <div class="skill-name">-</div>
        </div>
        <div class="skill-slot" id="skill-8">
          <div class="skill-hotkey">8</div>
          <div class="skill-name">-</div>
        </div>
        <div class="skill-slot" id="skill-9">
          <div class="skill-hotkey">9</div>
          <div class="skill-name">-</div>
        </div>
      </div>
    `;
  }

  // ========================================================================
  // Update Methods
  // ========================================================================

  setPlayerStats(stats: PlayerStats): void {
    this.playerStats = stats;
  }

  setSkillSystem(skillSystem: SkillSystem): void {
    this.skillSystem = skillSystem;
  }

  update(): void {
    if (this.playerStats) {
      this.updatePlayerStats();
    }

    if (this.skillSystem) {
      this.updateSkillBar();
    }
  }

  private updatePlayerStats(): void {
    if (!this.playerStats) return;

    // Update player name and level
    const nameEl = document.getElementById('player-name');
    const levelEl = document.getElementById('player-level');

    if (nameEl) nameEl.textContent = this.playerStats.toJSON().name;
    if (levelEl) levelEl.textContent = `Level ${this.playerStats.level}`;

    // Update HP
    const hpText = document.getElementById('hp-text');
    const hpBar = document.getElementById('hp-bar');

    if (hpText) {
      hpText.textContent = `${Math.floor(this.playerStats.hp)}/${this.playerStats.maxHp}`;
    }

    if (hpBar) {
      hpBar.style.width = `${this.playerStats.hpPercentage}%`;
    }

    // Update MP
    const mpText = document.getElementById('mp-text');
    const mpBar = document.getElementById('mp-bar');

    if (mpText) {
      mpText.textContent = `${Math.floor(this.playerStats.mp)}/${this.playerStats.maxMp}`;
    }

    if (mpBar) {
      mpBar.style.width = `${this.playerStats.mpPercentage}%`;
    }

    // Update EXP
    const expText = document.getElementById('exp-text');
    const expBar = document.getElementById('exp-bar');

    if (expText) {
      expText.textContent = `${this.playerStats.exp}/${this.playerStats.expToNext}`;
    }

    if (expBar) {
      expBar.style.width = `${this.playerStats.expPercentage}%`;
    }
  }

  private updateSkillBar(): void {
    if (!this.skillSystem) return;

    for (let i = 1; i <= 9; i++) {
      const skill = this.skillSystem.getSkillByHotkey(i);
      const slotEl = document.getElementById(`skill-${i}`);

      if (slotEl && skill) {
        const definition = this.skillSystem.getSkillDefinition(skill.id);
        const nameEl = slotEl.querySelector('.skill-name');

        if (nameEl && definition) {
          nameEl.textContent = definition.name.substring(0, 10);
        }

        // Update cooldown
        const cooldown = this.skillSystem.getCooldownRemaining(skill.id);
        if (cooldown > 0) {
          slotEl.classList.add('cooldown');
          const cooldownPercent = (cooldown / (definition?.cooldown || 1)) * 100;
          slotEl.style.setProperty('--cooldown-percent', `${cooldownPercent}%`);
        } else {
          slotEl.classList.remove('cooldown');
        }
      }
    }
  }

  // ========================================================================
  // Floating Damage Numbers
  // ========================================================================

  showDamage(x: number, y: number, amount: number, isCrit: boolean = false): void {
    const damageEl = document.createElement('div');
    damageEl.className = `damage-number ${isCrit ? 'crit' : ''}`;
    damageEl.textContent = `-${amount}`;
    damageEl.style.left = `${x}px`;
    damageEl.style.top = `${y}px`;

    this.container.appendChild(damageEl);

    setTimeout(() => {
      damageEl.remove();
    }, 1000);
  }

  showHealing(x: number, y: number, amount: number): void {
    const healEl = document.createElement('div');
    healEl.className = 'damage-number heal';
    healEl.textContent = `+${amount}`;
    healEl.style.left = `${x}px`;
    healEl.style.top = `${y}px`;

    this.container.appendChild(healEl);

    setTimeout(() => {
      healEl.remove();
    }, 1000);
  }

  // ========================================================================
  // Notifications
  // ========================================================================

  showNotification(message: string, duration: number = 2000): void {
    const notifEl = document.createElement('div');
    notifEl.className = 'notification';
    notifEl.textContent = message;

    this.container.appendChild(notifEl);

    setTimeout(() => {
      notifEl.remove();
    }, duration);
  }

  showLevelUp(newLevel: number): void {
    this.showNotification(`⭐ LEVEL UP! ⭐\nNow Level ${newLevel}!`, 3000);
  }

  // ========================================================================
  // Status Window (Observe)
  // ========================================================================

  showObserveWindow(data: ObserveData): void {
    this.hideObserveWindow();

    const windowHTML = `
      <div id="observe-window" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        border: 3px solid #00aaff;
        border-radius: 10px;
        padding: 20px;
        color: white;
        min-width: 400px;
        pointer-events: auto;
      ">
        <h2 style="color: #00aaff; margin-top: 0;">${data.name}</h2>
        <p><strong>Level:</strong> ${data.level}</p>
        <p><strong>HP:</strong> ${data.hp} / ${data.maxHp}</p>
        ${data.mp !== undefined ? `<p><strong>MP:</strong> ${data.mp} / ${data.maxMp}</p>` : ''}
        <p><strong>Threat:</strong> <span style="color: ${this.getThreatColor(data.threat)}">${data.threat.toUpperCase()}</span></p>
        <p>${data.description}</p>
        ${data.weaknesses ? `<p><strong>Weaknesses:</strong> ${data.weaknesses.join(', ')}</p>` : ''}
        ${data.resistances ? `<p><strong>Resistances:</strong> ${data.resistances.join(', ')}</p>` : ''}
        ${data.drops ? `<p><strong>Drops:</strong> ${data.drops.join(', ')}</p>` : ''}
        <button onclick="document.getElementById('observe-window').remove()" style="
          margin-top: 10px;
          padding: 10px 20px;
          background: #00aaff;
          border: none;
          border-radius: 5px;
          color: white;
          cursor: pointer;
        ">Close</button>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', windowHTML);
  }

  hideObserveWindow(): void {
    const existing = document.getElementById('observe-window');
    if (existing) {
      existing.remove();
    }
  }

  private getThreatColor(threat: string): string {
    switch (threat) {
      case 'none': return '#888888';
      case 'low': return '#00ff00';
      case 'medium': return '#ffaa00';
      case 'high': return '#ff6600';
      case 'extreme': return '#ff0000';
      default: return '#ffffff';
    }
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  destroy(): void {
    this.container.remove();
  }
}
