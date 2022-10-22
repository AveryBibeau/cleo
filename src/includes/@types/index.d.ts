import { RenderRouteOptions, RenderFragmentOptions } from "cleo";

declare module "fastify" {
  interface FastifyReply {
    html: (content: string) => FastifyReply;
    render: <P, L>(options: RenderRouteOptions<P, L>) => FastifyReply;
    renderFragment: <P>(options: RenderFragmentOptions<P>) => FastifyReply;
    startTime: number;
  }
}
