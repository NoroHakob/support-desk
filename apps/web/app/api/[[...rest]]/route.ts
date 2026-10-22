import { contract } from "@marshaldesk/shared";
import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { ZodToJsonSchemaConverter } from "@orpc/zod";

import { router } from "@/server/orpc/router";

const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
});

const handler = new OpenAPIHandler(router, {
  interceptors: [onError((error) => console.error(error))],
  plugins: [
    new OpenAPIReferenceHandlerPlugin({
      docsPath: "/docs",
      spec: () =>
        generator.generate(contract, {
          base: {
            info: { title: "SupportDesk API", version: "1.0.0" },
            servers: [{ url: "/api" }],
          },
        }),
    }),
  ],
});

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: "/api",
    context: {},
  });
  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
