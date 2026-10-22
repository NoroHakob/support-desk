import { createRouterClient } from "@orpc/server";

import { router } from "@/server/orpc/router";

globalThis.$client = createRouterClient(router, { context: {} });
