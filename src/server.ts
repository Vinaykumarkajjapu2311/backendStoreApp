import { app } from './app.ts';
import { env } from './config/env.js';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API listening on port ${env.PORT}`);
});