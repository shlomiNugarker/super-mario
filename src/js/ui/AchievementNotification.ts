/**
 * Achievement Notification UI
 *
 * Displays toast notifications when achievements are unlocked.
 */

import { AchievementNotification } from '../services/AchievementService';

export default class AchievementNotificationUI {
  private container: HTMLElement;
  private notifications: HTMLElement[] = [];
  private maxNotifications: number = 3;
  private animationDuration: number = 300; // ms
  private displayDuration: number = 5000; // ms
  private iconBasePath: string = '/img/icons/';

  /**
   * Constructor
   */
  constructor() {
    // Create container for notifications
    this.container = document.createElement('div');
    this.container.className = 'achievement-notifications';
    this.container.style.position = 'absolute';
    this.container.style.top = '20px';
    this.container.style.right = '20px';
    this.container.style.zIndex = '1000';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '10px';
    this.container.style.pointerEvents = 'none';

    document.body.appendChild(this.container);
  }

  /**
   * Show an achievement notification
   * @param notification Achievement notification data
   */
  public show(notification: AchievementNotification): void {
    const { achievement } = notification;

    // Create notification element
    const element = document.createElement('div');
    element.className = 'achievement-notification';
    element.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    element.style.color = 'white';
    element.style.borderRadius = '5px';
    element.style.padding = '10px';
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.maxWidth = '300px';
    element.style.transform = 'translateX(100%)';
    element.style.opacity = '0';
    element.style.transition = `transform ${this.animationDuration}ms ease-out, opacity ${this.animationDuration}ms ease-out`;
    element.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    element.style.border = '1px solid rgba(255, 255, 255, 0.2)';

    // Create icon if available
    const iconContainer = document.createElement('div');
    iconContainer.style.marginRight = '10px';
    iconContainer.style.width = '32px';
    iconContainer.style.height = '32px';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';

    try {
      const iconImage = document.createElement('img');
      iconImage.src = `${this.iconBasePath}${achievement.icon}.png`;
      iconImage.alt = achievement.title;
      iconImage.style.width = '100%';
      iconImage.style.height = '100%';
      iconImage.style.objectFit = 'contain';
      iconImage.onerror = () => {
        // Fallback to text icon if image fails to load
        iconContainer.textContent = '🏆';
        iconContainer.style.fontSize = '24px';
      };
      iconContainer.appendChild(iconImage);
    } catch {
      // Fallback if image creation fails
      iconContainer.textContent = '🏆';
      iconContainer.style.fontSize = '24px';
    }

    element.appendChild(iconContainer);

    // Create content
    const content = document.createElement('div');
    content.style.flex = '1';

    const title = document.createElement('div');
    title.textContent = achievement.title;
    title.style.fontWeight = 'bold';
    title.style.fontSize = '14px';
    title.style.marginBottom = '3px';
    content.appendChild(title);

    const description = document.createElement('div');
    description.textContent = achievement.description;
    description.style.fontSize = '12px';
    description.style.opacity = '0.8';
    content.appendChild(description);

    element.appendChild(content);

    // Add close button
    const closeButton = document.createElement('div');
    closeButton.textContent = '×';
    closeButton.style.fontSize = '16px';
    closeButton.style.marginLeft = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.pointerEvents = 'auto';
    closeButton.style.opacity = '0.6';
    closeButton.style.transition = 'opacity 200ms';
    closeButton.style.width = '20px';
    closeButton.style.height = '20px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.borderRadius = '50%';

    closeButton.addEventListener('mouseover', () => {
      closeButton.style.opacity = '1';
    });

    closeButton.addEventListener('mouseout', () => {
      closeButton.style.opacity = '0.6';
    });

    closeButton.addEventListener('click', () => {
      this.dismiss(element);
    });

    element.appendChild(closeButton);

    // Add to container
    this.container.appendChild(element);
    this.notifications.push(element);

    // Animate in
    setTimeout(() => {
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    }, 10);

    // Remove after delay
    setTimeout(() => {
      if (element.parentNode === this.container) {
        this.dismiss(element);
      }
    }, this.displayDuration);

    // Limit number of notifications
    this.pruneNotifications();
  }

  /**
   * Dismiss a notification
   * @param element Notification element to dismiss
   */
  private dismiss(element: HTMLElement): void {
    element.style.transform = 'translateX(100%)';
    element.style.opacity = '0';

    setTimeout(() => {
      if (element.parentNode === this.container) {
        this.container.removeChild(element);
      }

      const index = this.notifications.indexOf(element);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    }, this.animationDuration);
  }

  /**
   * Remove oldest notifications if over the limit
   */
  private pruneNotifications(): void {
    while (this.notifications.length > this.maxNotifications) {
      const oldestNotification = this.notifications[0];
      this.dismiss(oldestNotification);
    }
  }

  /**
   * Show a batch of notifications in sequence
   * @param notifications Array of notifications to show
   * @param delay Delay between notifications in ms
   */
  public showBatch(notifications: AchievementNotification[], delay: number = 800): void {
    if (notifications.length === 0) {
      return;
    }

    let index = 0;

    const showNext = () => {
      if (index < notifications.length) {
        this.show(notifications[index]);
        index++;
        setTimeout(showNext, delay);
      }
    };

    showNext();
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    for (const notification of [...this.notifications]) {
      this.dismiss(notification);
    }
  }
}
