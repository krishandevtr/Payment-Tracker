import { Kafka, Producer } from 'kafkajs';
import { config } from '../config';

class KafkaProducer {
  private producer: Producer | null = null;
  private isConnected = false;

  async connect() {
    if (this.isConnected) return;
    try {
      const kafka = new Kafka({ brokers: config.kafkaBrokers });
      this.producer = kafka.producer();
      await this.producer.connect();
      this.isConnected = true;
    } catch (err) {
      console.warn('Kafka connect skipped or failed:', (err as Error).message);
    }
  }

  async disconnect() {
    if (this.producer && this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  async publish(topic: string, message: any) {
    try {
      await this.connect();
      if (!this.producer) return;
      await this.producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
    } catch (err) {
      console.warn('Kafka publish failed:', (err as Error).message);
    }
  }
}

export const kafkaProducer = new KafkaProducer();
