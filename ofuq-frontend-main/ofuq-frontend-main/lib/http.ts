import axios from 'axios';
import { frontendAdapter } from './frontendAdapter';

// No network transport: all services use the persistent local data adapter.
export const http = axios.create({
  adapter: frontendAdapter,
  headers: { Accept: 'application/json' },
});
