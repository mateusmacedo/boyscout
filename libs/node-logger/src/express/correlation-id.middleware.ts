import { ensureCid, reqStore } from '../context.js';

export class CorrelationIdMiddleware {
  use(
    req: { headers: Record<string, string | string[] | undefined> },
    res: { setHeader: (name: string, value: string) => void },
    next: () => void
  ) {
    const cid = ensureCid(req.headers['x-correlation-id']);
    res.setHeader('x-correlation-id', cid);
    reqStore.run({ cid }, () => next());
  }
}
