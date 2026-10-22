import { RPCJsonSerializer, type RPCJsonSerialization } from "@orpc/client";
import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from "@tanstack/react-query";

const serializer = new RPCJsonSerializer();

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        queryKeyHashFn: (queryKey) =>
          JSON.stringify(serializer.serialize(queryKey)),
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        serializeData: (data) => serializer.serialize(data),
      },
      hydrate: {
        deserializeData: (data: RPCJsonSerialization) =>
          serializer.deserialize(data),
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getBrowserQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
