import { QuestManager } from '../components/QuestManager';
import { ActiveQuest, QuestData, QuestType } from '../types/Quest';

/**
 * Quest UI
 * Visual overlay for quest tracking and management
 */
export class QuestUI {
  private questManager: QuestManager;
  private container: HTMLDivElement;
  private tracker: HTMLDivElement;
  private isOpen: boolean = false;
  private trackerVisible: boolean = true;

  constructor(questManager: QuestManager) {
    this.questManager = questManager;
    this.container = this.createUI();
    this.tracker = this.createTracker();
    document.body.appendChild(this.container);
    document.body.appendChild(this.tracker);

    // Bind quest manager callbacks
    this.questManager.onQuestStarted = () => this.refresh();
    this.questManager.onQuestCompleted = () => this.refresh();
    this.questManager.onQuestFailed = () => this.refresh();
    this.questManager.onQuestProgress = () => this.refreshTracker();

    // Initial render
    this.refresh();
    this.refreshTracker();
  }

  /**
   * Create main quest log UI
   */
  private createUI(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'quest-ui';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 700px;
      max-height: 650px;
      background: linear-gradient(135deg, rgba(30, 20, 40, 0.98), rgba(40, 30, 50, 0.98));
      border: 3px solid rgba(200, 150, 255, 0.5);
      border-radius: 10px;
      padding: 20px;
      color: white;
      font-family: 'Arial', sans-serif;
      display: none;
      z-index: 1000;
      box-shadow: 0 0 30px rgba(100, 50, 150, 0.8);
    `;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #C9F; font-size: 28px;">
          <span style="margin-right: 10px;">📜</span>Quest Log
        </h2>
        <button id="close-quests" style="
          background: rgba(200, 50, 50, 0.3);
          border: 2px solid rgba(255, 100, 100, 0.5);
          color: white;
          padding: 8px 16px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">✖ Close</button>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <button id="tab-active" class="quest-tab active" style="
          flex: 1;
          background: rgba(100, 200, 255, 0.3);
          border: 2px solid rgba(100, 200, 255, 0.5);
          color: white;
          padding: 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">📝 Active</button>
        <button id="tab-available" class="quest-tab" style="
          flex: 1;
          background: rgba(100, 100, 100, 0.2);
          border: 2px solid rgba(150, 150, 150, 0.3);
          color: #AAA;
          padding: 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">⭐ Available</button>
        <button id="tab-completed" class="quest-tab" style="
          flex: 1;
          background: rgba(100, 100, 100, 0.2);
          border: 2px solid rgba(150, 150, 150, 0.3);
          color: #AAA;
          padding: 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">✅ Completed</button>
      </div>

      <!-- Quest List -->
      <div id="quest-list" style="
        max-height: 500px;
        overflow-y: auto;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
      "></div>
    `;

    // Event listeners
    container.querySelector('#close-quests')?.addEventListener('click', () => this.toggle());
    container.querySelector('#tab-active')?.addEventListener('click', () => this.showTab('active'));
    container.querySelector('#tab-available')?.addEventListener('click', () => this.showTab('available'));
    container.querySelector('#tab-completed')?.addEventListener('click', () => this.showTab('completed'));

    return container;
  }

  /**
   * Create quest tracker (always visible)
   */
  private createTracker(): HTMLDivElement {
    const tracker = document.createElement('div');
    tracker.id = 'quest-tracker';
    tracker.style.cssText = `
      position: fixed;
      top: 180px;
      right: 20px;
      width: 300px;
      max-height: 400px;
      background: rgba(20, 15, 30, 0.9);
      border: 2px solid rgba(150, 100, 200, 0.4);
      border-radius: 8px;
      padding: 15px;
      color: white;
      font-family: 'Arial', sans-serif;
      z-index: 100;
      overflow-y: auto;
    `;

    tracker.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; color: #C9F; font-size: 18px;">📜 Quests</h3>
        <button id="toggle-tracker" style="
          background: none;
          border: none;
          color: #C9F;
          cursor: pointer;
          font-size: 16px;
        ">−</button>
      </div>
      <div id="tracker-content"></div>
    `;

    tracker.querySelector('#toggle-tracker')?.addEventListener('click', () => {
      this.trackerVisible = !this.trackerVisible;
      const content = tracker.querySelector('#tracker-content') as HTMLDivElement;
      const button = tracker.querySelector('#toggle-tracker') as HTMLButtonElement;
      if (content) {
        content.style.display = this.trackerVisible ? 'block' : 'none';
        button.textContent = this.trackerVisible ? '−' : '+';
      }
    });

    return tracker;
  }

  /**
   * Toggle quest log open/closed
   */
  toggle(): void {
    this.isOpen = !this.isOpen;
    this.container.style.display = this.isOpen ? 'block' : 'none';
    if (this.isOpen) {
      this.refresh();
    }
  }

  /**
   * Show specific tab
   */
  private showTab(tab: 'active' | 'available' | 'completed'): void {
    // Update tab styles
    const tabs = this.container.querySelectorAll('.quest-tab');
    tabs.forEach((t) => {
      const el = t as HTMLButtonElement;
      if (el.id === `tab-${tab}`) {
        el.style.background = 'rgba(100, 200, 255, 0.3)';
        el.style.borderColor = 'rgba(100, 200, 255, 0.5)';
        el.style.color = 'white';
      } else {
        el.style.background = 'rgba(100, 100, 100, 0.2)';
        el.style.borderColor = 'rgba(150, 150, 150, 0.3)';
        el.style.color = '#AAA';
      }
    });

    // Show quest list for tab
    this.refreshTab(tab);
  }

  /**
   * Refresh all tabs
   */
  refresh(): void {
    this.showTab('active'); // Default to active tab
    this.refreshTracker();
  }

  /**
   * Refresh specific tab
   */
  private refreshTab(tab: 'active' | 'available' | 'completed'): void {
    const list = this.container.querySelector('#quest-list');
    if (!list) return;

    list.innerHTML = '';

    let quests: (ActiveQuest | QuestData)[] = [];

    switch (tab) {
      case 'active':
        quests = this.questManager.getActiveQuests();
        break;
      case 'available':
        quests = this.questManager.getAvailableQuests();
        break;
      case 'completed':
        const completedIds = this.questManager.getCompletedQuests();
        quests = completedIds.map(id => this.questManager.getQuest(id)).filter(q => q) as ActiveQuest[];
        break;
    }

    if (quests.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">No quests</div>';
      return;
    }

    quests.forEach((q) => {
      const quest = 'quest' in q ? q.quest : q;
      const activeQuest = 'quest' in q ? q : null;
      const card = this.createQuestCard(quest, activeQuest, tab);
      list.appendChild(card);
    });
  }

  /**
   * Create quest card
   */
  private createQuestCard(quest: QuestData, activeQuest: ActiveQuest | null, tab: string): HTMLDivElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(50, 40, 60, 0.8);
      border: 2px solid ${this.getQuestTypeColor(quest.type)};
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateX(5px)';
      card.style.boxShadow = `0 0 15px ${this.getQuestTypeColor(quest.type)}`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateX(0)';
      card.style.boxShadow = 'none';
    });

    let objectivesHTML = '';
    if (activeQuest) {
      objectivesHTML = '<div style="margin-top: 10px; font-size: 13px;">';
      activeQuest.objectives.forEach(obj => {
        const progress = obj.completed ? '✅' : '⏳';
        objectivesHTML += `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>${progress} ${obj.description}</span>
            <span style="color: ${obj.completed ? '#4F4' : '#FA4'};">${obj.current}/${obj.required}</span>
          </div>
        `;
      });
      objectivesHTML += '</div>';
    }

    let buttonsHTML = '';
    if (tab === 'available') {
      buttonsHTML = `
        <button style="
          background: rgba(100, 200, 100, 0.3);
          border: 2px solid rgba(100, 255, 100, 0.5);
          color: white;
          padding: 6px 12px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
        " onclick="document.dispatchEvent(new CustomEvent('startQuest', {detail: '${quest.id}'}))">
          ▶ Start Quest
        </button>
      `;
    } else if (tab === 'active') {
      buttonsHTML = `
        <button style="
          background: rgba(200, 100, 50, 0.3);
          border: 2px solid rgba(255, 150, 100, 0.5);
          color: white;
          padding: 6px 12px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
        " onclick="document.dispatchEvent(new CustomEvent('abandonQuest', {detail: '${quest.id}'}))">
          🚫 Abandon
        </button>
      `;
    }

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <div>
          <h3 style="margin: 0 0 5px 0; color: ${this.getQuestTypeColor(quest.type)}; font-size: 18px;">
            ${quest.name}
          </h3>
          <div style="color: ${this.getQuestTypeColor(quest.type)}; font-size: 12px; text-transform: uppercase;">
            ${quest.type} QUEST - Level ${quest.level}
          </div>
        </div>
        <div style="background: rgba(0, 0, 0, 0.5); padding: 5px 10px; border-radius: 5px; font-size: 12px;">
          ${this.getQuestTypeIcon(quest.type)}
        </div>
      </div>
      <p style="margin: 10px 0; color: #CCC; font-size: 14px;">
        ${quest.description}
      </p>
      ${objectivesHTML}
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 12px; color: #AAA;">
        <strong style="color: #FA4;">Rewards:</strong>
        ${quest.rewards.exp ? `💫 ${quest.rewards.exp} EXP ` : ''}
        ${quest.rewards.money ? `💰 ${quest.rewards.money}g ` : ''}
        ${quest.rewards.skillPoints ? `📚 ${quest.rewards.skillPoints} SP` : ''}
      </div>
      ${buttonsHTML}
    `;

    return card;
  }

  /**
   * Refresh quest tracker
   */
  private refreshTracker(): void {
    const content = this.tracker.querySelector('#tracker-content');
    if (!content) return;

    const activeQuests = this.questManager.getActiveQuests();

    if (activeQuests.length === 0) {
      content.innerHTML = '<div style="color: #666; font-size: 13px; text-align: center;">No active quests</div>';
      return;
    }

    content.innerHTML = activeQuests.map(aq => {
      const quest = aq.quest;
      const incompleteObjectives = aq.objectives.filter(obj => !obj.completed);

      return `
        <div style="
          background: rgba(0, 0, 0, 0.4);
          border-left: 3px solid ${this.getQuestTypeColor(quest.type)};
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 4px;
        ">
          <div style="color: ${this.getQuestTypeColor(quest.type)}; font-size: 14px; font-weight: bold; margin-bottom: 5px;">
            ${quest.name}
          </div>
          ${incompleteObjectives.slice(0, 3).map(obj => `
            <div style="font-size: 12px; color: #CCC; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>• ${obj.description}</span>
              <span style="color: #FA4;">${obj.current}/${obj.required}</span>
            </div>
          `).join('')}
          ${incompleteObjectives.length > 3 ? `<div style="font-size: 11px; color: #666; text-align: center;">+${incompleteObjectives.length - 3} more</div>` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Get quest type color
   */
  private getQuestTypeColor(type: QuestType): string {
    const colors = {
      main: '#FA4',
      side: '#4AF',
      daily: '#4FA',
      repeatable: '#AAA'
    };
    return colors[type] || '#AAA';
  }

  /**
   * Get quest type icon
   */
  private getQuestTypeIcon(type: QuestType): string {
    const icons = {
      main: '⭐',
      side: '📌',
      daily: '📅',
      repeatable: '🔄'
    };
    return icons[type] || '📜';
  }

  /**
   * Destroy UI
   */
  destroy(): void {
    this.container.remove();
    this.tracker.remove();
  }
}

// Listen for quest events
document.addEventListener('startQuest', (e: any) => {
  console.log('Start quest:', e.detail);
  // Quest manager will handle this via game logic
});

document.addEventListener('abandonQuest', (e: any) => {
  console.log('Abandon quest:', e.detail);
  // Quest manager will handle this via game logic
});
