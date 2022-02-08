import * as t from 'io-ts';
import { PathReporter } from 'io-ts/PathReporter';
import * as fs from 'fs';
import * as toml from 'toml';
import * as path from 'path';

function loadTOML<T>(filePath: string): T {
  try {
    const fileData = fs.readFileSync(filePath);
    return toml.parse(fileData.toString());
  } catch (e) {
    console.error(e);
    throw new Error('Error reading config.toml');
  }
}

export const Config = t.type({
  pulsar: t.type({
    hostname: t.string,
    port: t.number,
    tenant: t.string,
    namespace: t.string,
    token: t.string,
  }),
});

function loadConfig<K extends t.TypeOf<typeof Config>>(): K {
  const cwd = process.cwd();
  const configPath = path.join(cwd, 'config.toml');

  const config = loadTOML(configPath);

  const res = Config.decode(config);
  PathReporter.report(res);

  return config as K;
}

const config = loadConfig();

export default config;
