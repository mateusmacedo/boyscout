import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export const reqStore = new AsyncLocalStorage<{ cid: string }>();
export const getCid = () => reqStore.getStore()?.cid;
export const ensureCid = (incoming?: string | string[]) =>
  typeof incoming === 'string' && incoming.trim() ? incoming : randomUUID();
