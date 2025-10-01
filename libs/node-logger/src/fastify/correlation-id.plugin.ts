import { ensureCid, reqStore } from '../context.js';

type FastifyPluginCallback = (
  fastify: {
    addHook: (
      event: string,
      handler: (
        req: { headers: Record<string, string | string[] | undefined> },
        reply: { header: (name: string, value: string) => void },
        done: () => void
      ) => void
    ) => void;
  },
  _opts: unknown,
  done: () => void
) => void;

export const correlationIdPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.addHook('onRequest', (req, reply, hookDone) => {
    const cid = ensureCid(req.headers['x-correlation-id']);
    reply.header('x-correlation-id', cid);
    reqStore.run({ cid }, () => hookDone());
  });
  done();
};
