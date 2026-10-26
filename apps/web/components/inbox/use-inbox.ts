"use client";

import { summarizeConversation, type Conversation } from "@marshaldesk/shared";
import { ORPCError } from "@orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import * as z from "zod";

import { orpc } from "@/lib/orpc";

export type InboxActions = {
  reply: (id: string, body: string) => Promise<unknown>;
  takeOver: (id: string) => void;
  handBack: (id: string) => void;
  close: (id: string) => void;
};

function errorMessage(error: unknown) {
  return error instanceof ORPCError &&
    (error.code === "CONFLICT" || error.code === "NOT_FOUND")
    ? error.message
    : "Something went wrong. Try again.";
}

export function useInbox(openId: string | null) {
  const queryClient = useQueryClient();
  const listKey = orpc.inbox.list.queryKey();
  const validOpenId = z.uuid().safeParse(openId).success ? openId : null;

  const { data: conversations } = useSuspenseQuery({
    ...orpc.inbox.list.queryOptions(),
    refetchOnWindowFocus: "always",
  });
  const open = useQuery({
    ...orpc.inbox.conversation.queryOptions({
      input: { id: validOpenId ?? "" },
    }),
    enabled: validOpenId !== null,
    refetchOnWindowFocus: "always",
  });

  function save(conversation: Conversation) {
    queryClient.setQueryData(
      orpc.inbox.conversation.queryKey({ input: { id: conversation.id } }),
      conversation,
    );
    queryClient.setQueryData(listKey, (list) =>
      list?.map((item) =>
        item.id === conversation.id
          ? summarizeConversation(conversation)
          : item,
      ),
    );
  }

  // Clears when the next action starts or another conversation opens, so it
  // never sticks to a later success or another conversation.
  const [failure, setFailure] = useState<{
    id: string;
    message: string;
  } | null>(null);
  if (failure && failure.id !== validOpenId) {
    setFailure(null);
  }

  const options = {
    onMutate: () => setFailure(null),
    onSuccess: save,
    // A conflict means someone else moved the conversation: show what's true
    // now.
    onError: (error: unknown, { id }: { id: string }) => {
      setFailure({ id, message: errorMessage(error) });
      void queryClient.invalidateQueries({ queryKey: orpc.inbox.key() });
    },
  };
  const reply = useMutation(orpc.inbox.reply.mutationOptions(options));
  const takeOver = useMutation(orpc.inbox.takeOver.mutationOptions(options));
  const handBack = useMutation(orpc.inbox.handBack.mutationOptions(options));
  const close = useMutation(orpc.inbox.close.mutationOptions(options));
  const markRead = useMutation(
    orpc.inbox.markRead.mutationOptions({
      onMutate: ({ id }) => {
        queryClient.setQueryData(listKey, (list) =>
          list?.map((item) =>
            item.id === id ? { ...item, unread: false } : item,
          ),
        );
        queryClient.setQueryData(
          orpc.inbox.conversation.queryKey({ input: { id } }),
          (conversation) =>
            conversation ? { ...conversation, unread: false } : conversation,
        );
      },
    }),
  );

  const mutations = [reply, takeOver, handBack, close];

  const actions: InboxActions = {
    reply: (id, body) => reply.mutateAsync({ id, body }),
    takeOver: (id) => takeOver.mutate({ id }),
    handBack: (id) => handBack.mutate({ id }),
    close: (id) => close.mutate({ id }),
  };

  return {
    conversations,
    open: open.data ?? null,
    openLoading: validOpenId !== null && open.isPending,
    actions,
    markRead: (id: string) => markRead.mutate({ id }),
    busy: mutations.some((mutation) => mutation.isPending),
    error: failure?.message ?? null,
  };
}
