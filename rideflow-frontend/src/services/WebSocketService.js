import { Client } from '@stomp/stompjs';

const API_BASE = 'ws://localhost:8080/ws'; // Use ws:// for WebSockets

class WebSocketService {
    constructor() {
        this.client = null;
        this.subscriptions = new Map();
        this.pendingSubscriptions = []; // Queue for subscriptions before connection
    }

    connect(onConnected, onError) {
        if (this.client && this.client.active) {
            if (onConnected) onConnected();
            return;
        }

        this.client = new Client({
            brokerURL: API_BASE,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket');
                if (onConnected) onConnected();
                this._processPendingSubscriptions();
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                if (onError) onError(frame);
            },
            onWebSocketClose: () => {
                console.log('WebSocket connection closed');
            },
        });

        this.client.activate();
    }

    _processPendingSubscriptions() {
        if (!this.client || !this.client.connected) return;

        console.log(`Processing ${this.pendingSubscriptions.length} pending subscriptions...`);

        // Process queue
        const queue = [...this.pendingSubscriptions];
        this.pendingSubscriptions = []; // Clear queue

        queue.forEach(({ topic, callback, resolve }) => {
            const sub = this.subscribe(topic, callback);
            if (resolve) resolve(sub);
        });
    }

    subscribe(topic, callback) {
        if (!this.client || !this.client.connected) {
            console.log('Stomp client not connected. Queuing subscription for:', topic);
            // Queue the subscription
            this.pendingSubscriptions.push({ topic, callback });
            return {
                id: 'pending-' + Date.now(),
                unsubscribe: () => {
                    // Remove from pending queue if unsubscribed before connecting
                    this.pendingSubscriptions = this.pendingSubscriptions.filter(item => item.topic !== topic);
                }
            };
        }

        // If connected, subscribe immediately
        if (this.subscriptions.has(topic)) {
            return this.subscriptions.get(topic);
        }

        console.log('Subscribing to:', topic);
        const subscription = this.client.subscribe(topic, (message) => {
            try {
                const payload = JSON.parse(message.body);
                console.log('WebSocket received message on', topic, payload);
                callback(payload);
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        });

        this.subscriptions.set(topic, subscription);
        return subscription;
    }

    unsubscribe(topic) {
        // Check pending first
        this.pendingSubscriptions = this.pendingSubscriptions.filter(item => item.topic !== topic);

        // Check active
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(topic);
        }
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.subscriptions.clear();
            this.pendingSubscriptions = [];
        }
    }
}

const webSocketService = new WebSocketService();
export { webSocketService };
