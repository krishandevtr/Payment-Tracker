import { app } from './app';
import { config } from './config';
import { kafkaProducer } from './events/kafka';

async function start() {
  await kafkaProducer.connect().catch(() => undefined);
  app.listen(config.port, () => {
    console.log(`Budget service listening on port ${config.port}`);
  });
}

start();
