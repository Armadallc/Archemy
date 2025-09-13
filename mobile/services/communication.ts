// Cost-effective communication services for driver app
// Includes WebSocket chat, click-to-call, and Zello PTT integration

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'location' | 'emergency' | 'system';
  metadata?: any;
}

interface ChatParticipant {
  id: string;
  name: string;
  role: 'driver' | 'dispatcher' | 'supervisor';
  isOnline: boolean;
}

// Real-time chat service using WebSocket (free with your own server)
class ChatService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers: ((message: Message) => void)[] = [];
  private statusHandlers: ((status: 'connected' | 'disconnected' | 'error') => void)[] = [];

  connect(driverId: string, organizationId: string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?driverId=${driverId}&orgId=${organizationId}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('Chat connected');
      this.reconnectAttempts = 0;
      this.notifyStatusHandlers('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);
        this.notifyMessageHandlers(message);
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Chat disconnected');
      this.notifyStatusHandlers('disconnected');
      this.attemptReconnect(driverId, organizationId);
    };

    this.ws.onerror = () => {
      this.notifyStatusHandlers('error');
    };
  }

  private attemptReconnect(driverId: string, organizationId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting chat... attempt ${this.reconnectAttempts}`);
        this.connect(driverId, organizationId);
      }, 2000 * this.reconnectAttempts);
    }
  }

  sendMessage(content: string, type: Message['type'] = 'text', metadata?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        content,
        type,
        metadata,
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendLocationMessage(latitude: number, longitude: number, address?: string) {
    this.sendMessage(address || `Location: ${latitude}, ${longitude}`, 'location', {
      latitude,
      longitude,
      address
    });
  }

  sendEmergencyMessage(description: string, location?: { latitude: number; longitude: number }) {
    this.sendMessage(description, 'emergency', { location });
  }

  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
  }

  onStatusChange(handler: (status: 'connected' | 'disconnected' | 'error') => void) {
    this.statusHandlers.push(handler);
  }

  private notifyMessageHandlers(message: Message) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyStatusHandlers(status: 'connected' | 'disconnected' | 'error') {
    this.statusHandlers.forEach(handler => handler(status));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Click-to-call service (uses device's native calling)
class CallService {
  makeCall(phoneNumber: string, contactName?: string) {
    if (!phoneNumber) return;
    
    // Clean phone number
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Use tel: protocol to trigger native calling
    const telUrl = `tel:${cleanNumber}`;
    
    if (contactName) {
      console.log(`Calling ${contactName} at ${phoneNumber}`);
    }
    
    window.location.href = telUrl;
  }

  callDispatch(organizationId: string) {
    // You would store emergency numbers per organization
    const dispatchNumbers: Record<string, string> = {
      'monarch_competency': '555-DISPATCH-1',
      'monarch_launch': '555-DISPATCH-2',
      'default': '555-DISPATCH'
    };
    
    const number = dispatchNumbers[organizationId] || dispatchNumbers.default;
    this.makeCall(number, 'Dispatch Center');
  }

  callEmergency() {
    this.makeCall('911', 'Emergency Services');
  }

  callSupervisor(organizationId: string) {
    const supervisorNumbers: Record<string, string> = {
      'monarch_competency': '555-SUPER-1',
      'monarch_launch': '555-SUPER-2',
      'default': '555-SUPERVISOR'
    };
    
    const number = supervisorNumbers[organizationId] || supervisorNumbers.default;
    this.makeCall(number, 'Supervisor');
  }
}

// Zello PTT Integration (free Zello Work account)
class ZelloPTTService {
  private zelloConfig = {
    network: 'zello.net', // Free Zello Work network
    username: '',
    password: '',
    channel: ''
  };

  configure(username: string, password: string, channel: string) {
    this.zelloConfig = {
      network: 'zello.net',
      username,
      password,
      channel
    };
  }

  // Launch Zello app with specific channel
  openZelloChannel(channelName: string) {
    // Deep link to Zello app
    const zelloUrl = `zello://conversation/${encodeURIComponent(channelName)}`;
    
    // Try to open Zello app
    window.location.href = zelloUrl;
    
    // Fallback: open in web browser after delay
    setTimeout(() => {
      const webUrl = `https://web.zello.com`;
      window.open(webUrl, '_blank');
    }, 1000);
  }

  // Pre-configured PTT channels
  openDispatchChannel(organizationId: string) {
    const channels: Record<string, string> = {
      'monarch_competency': 'Monarch-Dispatch-1',
      'monarch_launch': 'Monarch-Dispatch-2',
      'default': 'Monarch-Dispatch'
    };
    
    const channel = channels[organizationId] || channels.default;
    this.openZelloChannel(channel);
  }

  openDriverChannel(organizationId: string) {
    const channel = `Monarch-Drivers-${organizationId}`;
    this.openZelloChannel(channel);
  }

  openEmergencyChannel() {
    this.openZelloChannel('Monarch-Emergency');
  }
}

// Unified communication service
export class CommunicationService {
  private chat: ChatService;
  private call: CallService;
  private ptt: ZelloPTTService;

  constructor() {
    this.chat = new ChatService();
    this.call = new CallService();
    this.ptt = new ZelloPTTService();
  }

  // Chat methods
  connectChat(driverId: string, organizationId: string) {
    this.chat.connect(driverId, organizationId);
  }

  sendChatMessage(message: string) {
    this.chat.sendMessage(message);
  }

  sendLocationShare(latitude: number, longitude: number, address?: string) {
    this.chat.sendLocationMessage(latitude, longitude, address);
  }

  onChatMessage(handler: (message: Message) => void) {
    this.chat.onMessage(handler);
  }

  onChatStatus(handler: (status: 'connected' | 'disconnected' | 'error') => void) {
    this.chat.onStatusChange(handler);
  }

  // Call methods
  callDispatch(organizationId: string) {
    this.call.callDispatch(organizationId);
  }

  callEmergency() {
    this.call.callEmergency();
  }

  callSupervisor(organizationId: string) {
    this.call.callSupervisor(organizationId);
  }

  makeCall(phoneNumber: string, contactName?: string) {
    this.call.makeCall(phoneNumber, contactName);
  }

  // PTT methods
  configurePTT(username: string, password: string, channel: string) {
    this.ptt.configure(username, password, channel);
  }

  openDispatchPTT(organizationId: string) {
    this.ptt.openDispatchChannel(organizationId);
  }

  openDriverPTT(organizationId: string) {
    this.ptt.openDriverChannel(organizationId);
  }

  openEmergencyPTT() {
    this.ptt.openEmergencyChannel();
  }

  // Quick emergency communication
  triggerEmergencyCommunication(organizationId: string, location?: { latitude: number; longitude: number }) {
    // 1. Send emergency chat message
    this.chat.sendEmergencyMessage('EMERGENCY: Driver activated emergency communication', location);
    
    // 2. Open emergency PTT channel
    this.openEmergencyPTT();
    
    // 3. Prepare to call dispatch (user can confirm)
    setTimeout(() => {
      if (confirm('Open emergency call to dispatch?')) {
        this.callDispatch(organizationId);
      }
    }, 2000);
  }
}

export const communicationService = new CommunicationService();

// Communication UI helpers
export class CommunicationUI {
  static createQuickActionButtons(organizationId: string) {
    return [
      {
        id: 'chat',
        label: 'Chat Dispatch',
        icon: '💬',
        action: () => {
          // This would open chat interface
          console.log('Opening chat interface');
        }
      },
      {
        id: 'call',
        label: 'Call Dispatch',
        icon: '📞',
        action: () => communicationService.callDispatch(organizationId)
      },
      {
        id: 'ptt',
        label: 'PTT Radio',
        icon: '📻',
        action: () => communicationService.openDispatchPTT(organizationId)
      },
      {
        id: 'emergency',
        label: 'Emergency',
        icon: '🚨',
        action: () => communicationService.triggerEmergencyCommunication(organizationId),
        danger: true
      }
    ];
  }

  static formatPhoneNumber(number: string): string {
    const cleaned = number.replace(/[^\d]/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return number;
  }
}

// WebRTC for voice calls (experimental, free but complex)
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  async initializeVoiceCall(): Promise<boolean> {
    try {
      // Get microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      // Create peer connection (you'd need signaling server)
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' } // Free STUN server
        ]
      });

      return true;
    } catch (error) {
      console.error('Voice call initialization failed:', error);
      return false;
    }
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}