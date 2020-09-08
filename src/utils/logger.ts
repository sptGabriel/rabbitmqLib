import pino from 'pino';
import config from 'config';
export const Logger = pino({
  enabled: true,
  level: 'info',
});
