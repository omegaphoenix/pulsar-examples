import * as pulsar from 'pulsar-client';
import * as fs from 'mz/fs';
import { map, delay } from 'bluebird';

import config from './config';

function createPulsarClient(): pulsar.Client {
  const auth = new pulsar.AuthenticationToken({ token: config.pulsar.token });
  const serviceUrl = `pulsar+ssl://${config.pulsar.hostname}:${config.pulsar.port}`;
  console.warn(serviceUrl);

  console.warn('Creating new Pulsar client...');
  return new pulsar.Client({
    serviceUrl,
    authentication: auth,
    operationTimeoutSeconds: 30,
    tlsAllowInsecureConnection: true,
  });
}

// NOTE: re-create reader on message read timeout to avoid unexpected stall caused by offloading
const NEXT_MESSAGE_TIMEOUT_MILLIS = 30 * 1000;
async function readTopic(client: pulsar.Client, topic: string): Promise<void> {
  const fullTopic = `${config.pulsar.tenant}/${config.pulsar.namespace}/${topic}`;
  const fileName = `data/${topic}.jsonl`;

  try {
    fs.unlinkSync(fileName);
  } catch (err) {}

  const readerConfig = {
    topic: fullTopic,
    startMessageId: pulsar.MessageId.earliest(),
    readerName: `test-node-logger`,
  };
  let reader = await client.createReader(readerConfig);

  let hasNext = reader.hasNext();
  let count = 0;
  let prevMsg = '';
  while (hasNext) {
    try {
      const message = await reader.readNext(NEXT_MESSAGE_TIMEOUT_MILLIS).catch((err) => {
        console.error(`failed to read next message`, err);
        return undefined;
      });

      if (message === undefined) {
        await reader.close();
        reader = await client.createReader(readerConfig);
        console.warn(`Reconnecting at ${readerConfig.startMessageId}`);
        continue;
      }

      const msg = message.getData().toString();
      if (msg === prevMsg) {
        console.warn('Skipping repeated line');
        continue;
      }

      readerConfig.startMessageId = message.getMessageId();
      const frames = JSON.parse(msg);
      for (const frame of frames) {
        console.log(frame);
        await delay(1000);
        if (frame.startFrameIdx !== undefined) continue;
        await fs.appendFile(fileName, JSON.stringify(frame) + '\n');
      }
      hasNext = reader.hasNext();
      prevMsg = msg;
      count++;
      if (count % 10 === 0) console.log(count);
    } catch (e) {
      console.error(e);
      break;
    }
  }

  console.log('finished reading from pulsar', { topic, count });
  await reader.close();
  await client.close();
}

async function main(): Promise<void> {
  const topics = ['flex_cv_pose_023eb4ac-5858-4729-a2a8-99fb876fecb6'];
  const client = createPulsarClient();
  await map(
    topics,
    async (topic) => {
      try {
        await delay(Math.floor(Math.random() * 30000));
        await readTopic(client, topic);
      } catch (err) {
        console.log(`FAILED AT ${err}`);
      }
    },
    { concurrency: 50 },
  );
}

// eslint-disable-next-line
main();
