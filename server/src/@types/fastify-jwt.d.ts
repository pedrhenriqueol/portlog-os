import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub?: string;
      tenantId: string;
      role: string;
    };
    user: {
      sub: string;
      tenantId: string;
      role: string;
    };
  }
}
