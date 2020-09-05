import pino from 'pino';
import config from 'config';
export const Logger = pino({
  enabled: config.get('logger.enabled'),
  level: config.get('logger.level'),
});
