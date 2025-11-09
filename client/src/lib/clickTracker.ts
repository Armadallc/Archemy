/**
 * Click Tracking and Error Monitoring System
 * Tracks user interactions and catches errors for debugging
 */

interface ClickEvent {
  timestamp: string;
  element: string;
  elementType: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  page: string;
  userId?: string;
  userRole?: string;
  error?: string;
  stackTrace?: string;
}

class ClickTracker {
  private events: ClickEvent[] = [];
  private isEnabled = true;

  constructor() {
    this.setupGlobalErrorHandling();
    this.setupClickTracking();
  }

  private setupGlobalErrorHandling() {
    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError('Unhandled Error', event.error, event.filename, event.lineno);
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('Unhandled Promise Rejection', event.reason);
    });

    // Track React errors (if using React Error Boundary)
    window.addEventListener('react-error', (event: any) => {
      this.trackError('React Error', event.detail.error, event.detail.componentStack);
    });
  }

  private setupClickTracking() {
    document.addEventListener('click', (event) => {
      if (!this.isEnabled) return;

      const target = event.target as HTMLElement;
      const clickEvent = this.createClickEvent(target, event);
      this.events.push(clickEvent);
      
      // Log to console for immediate debugging
      console.log('🖱️ Click tracked:', {
        element: clickEvent.element,
        type: clickEvent.elementType,
        text: clickEvent.elementText,
        page: clickEvent.page,
        timestamp: clickEvent.timestamp
      });
    });
  }

  private createClickEvent(target: HTMLElement, event: MouseEvent): ClickEvent {
    const element = this.getElementSelector(target);
    const elementType = target.tagName.toLowerCase();
    const elementId = target.id || undefined;
    const elementClass = target.className || undefined;
    const elementText = this.getElementText(target);
    const page = window.location.pathname;
    
    // Try to get user info from localStorage or global state
    const userInfo = this.getUserInfo();

    return {
      timestamp: new Date().toISOString(),
      element,
      elementType,
      elementId,
      elementClass,
      elementText,
      page,
      userId: userInfo.userId,
      userRole: userInfo.userRole
    };
  }

  private getElementSelector(element: HTMLElement): string {
    // Create a more specific selector
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    // Fallback to tag name with position
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element);
      return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }

    return element.tagName.toLowerCase();
  }

  private getElementText(element: HTMLElement): string {
    const text = element.textContent?.trim();
    if (text && text.length > 50) {
      return text.substring(0, 50) + '...';
    }
    return text || '';
  }

  private getUserInfo() {
    try {
      // Try to get user info from various sources
      const authData = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (authData) {
        const user = JSON.parse(authData);
        return {
          userId: user.user_id || user.id,
          userRole: user.role
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return {};
  }

  public trackError(errorType: string, error: any, filename?: string, lineno?: number) {
    const errorEvent: ClickEvent = {
      timestamp: new Date().toISOString(),
      element: filename || 'Unknown',
      elementType: 'error',
      page: window.location.pathname,
      error: `${errorType}: ${error?.message || error}`,
      stackTrace: error?.stack || 'No stack trace available',
      ...this.getUserInfo()
    };

    this.events.push(errorEvent);
    
    console.error('🚨 Error tracked:', {
      type: errorType,
      message: error?.message || error,
      filename,
      lineno,
      page: errorEvent.page,
      timestamp: errorEvent.timestamp
    });
  }

  public trackCustomEvent(eventName: string, data: any) {
    const customEvent: ClickEvent = {
      timestamp: new Date().toISOString(),
      element: eventName,
      elementType: 'custom',
      page: window.location.pathname,
      ...this.getUserInfo()
    };

    this.events.push(customEvent);
    console.log('📊 Custom event tracked:', { eventName, data, timestamp: customEvent.timestamp });
  }

  public getEvents(): ClickEvent[] {
    return [...this.events];
  }

  public getRecentEvents(count: number = 10): ClickEvent[] {
    return this.events.slice(-count);
  }

  public getErrors(): ClickEvent[] {
    return this.events.filter(event => event.error);
  }

  public clearEvents() {
    this.events = [];
    console.log('🧹 Click tracking events cleared');
  }

  public exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  public enable() {
    this.isEnabled = true;
    console.log('✅ Click tracking enabled');
  }

  public disable() {
    this.isEnabled = false;
    console.log('❌ Click tracking disabled');
  }

  public getStats() {
    const totalClicks = this.events.length;
    const errors = this.getErrors().length;
    const pages = [...new Set(this.events.map(e => e.page))];
    const elementTypes = [...new Set(this.events.map(e => e.elementType))];

    return {
      totalClicks,
      errors,
      pages,
      elementTypes,
      lastEvent: this.events[this.events.length - 1]
    };
  }
}

// Create global instance
export const clickTracker = new ClickTracker();

// Make it available globally for debugging
(window as any).clickTracker = clickTracker;

// Export helper functions
export const trackClick = (element: string, data?: any) => {
  clickTracker.trackCustomEvent(`click:${element}`, data);
};

export const trackError = (error: any, context?: string) => {
  clickTracker.trackError('Manual Error', error, context);
};

export const getClickStats = () => {
  return clickTracker.getStats();
};

export const exportClickData = () => {
  return clickTracker.exportEvents();
};

// Console helpers for debugging
console.log('🖱️ Click tracking initialized. Use window.clickTracker for debugging.');
console.log('Available commands:');
console.log('- window.clickTracker.getEvents() - Get all events');
console.log('- window.clickTracker.getRecentEvents(20) - Get last 20 events');
console.log('- window.clickTracker.getErrors() - Get all errors');
console.log('- window.clickTracker.getStats() - Get statistics');
console.log('- window.clickTracker.exportEvents() - Export all data');
console.log('- window.clickTracker.clearEvents() - Clear all events');


