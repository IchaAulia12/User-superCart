import mqtt, { MqttClient } from 'mqtt';

class MQTTService {
  private client: MqttClient | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  connect(brokerUrl: string, options?: any) {
    return new Promise<void>((resolve, reject) => {
      try {
        // TODO: Ganti dengan URL broker MQTT Anda
        this.client = mqtt.connect(
        'wss://test.mosquitto.org:8081/mqtt',
        {
            clean: true,
            connectTimeout: 10000,
            reconnectPeriod: 2000,
            clientId: 'tablet_' + Math.random().toString(16).substr(2, 8),
        }
        );


        this.client.on('connect', () => {
          console.log('MQTT Connected');
          resolve();
        });

        this.client.on('error', (error) => {
          console.error('MQTT Error:', error);
          reject(error);
        });

        this.client.on('message', (topic, message) => {
          try {
            const data = JSON.parse(message.toString());
            const callbacks = this.subscribers.get(topic);
            if (callbacks) {
              callbacks.forEach(callback => callback(data));
            }
          } catch (error) {
            console.error('Error parsing MQTT message:', error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  subscribe(topic: string, callback: (data: any) => void) {
    if (!this.client) {
      console.error('MQTT client not connected');
      return;
    }

    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error('MQTT Subscribe error:', err);
        return;
      }
      console.log(`Subscribed to topic: ${topic}`);
    });

    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(callback);
  }

  unsubscribe(topic: string, callback?: (data: any) => void) {
    if (callback) {
      const callbacks = this.subscribers.get(topic);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(topic);
          this.client?.unsubscribe(topic);
        }
      }
    } else {
      this.subscribers.delete(topic);
      this.client?.unsubscribe(topic);
    }
  }

  publish(topic: string, message: any) {
    if (!this.client) {
      console.error('MQTT client not connected');
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.client.publish(topic, payload);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.subscribers.clear();
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export default new MQTTService();