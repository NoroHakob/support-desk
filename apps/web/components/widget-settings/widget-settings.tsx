"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  GREETING_MAX_LENGTH,
  SOURCE_FILE_MAX_BYTES,
  sourceFileTypes,
  widgetColorHex,
  widgetSettingsInputSchema,
  type WidgetSettingsInput,
} from "@marshaldesk/shared";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { useDashboardAccent } from "@/components/dashboard/accent-provider";
import { Dropzone } from "@/components/dashboard/dropzone";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  SettingsBlock,
  SettingsRow,
  SettingsSection,
} from "@/components/dashboard/settings-section";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AgentAvatarField } from "@/components/widget-settings/agent-avatar-field";
import { AllowedDomainsField } from "@/components/widget-settings/allowed-domains-field";
import { ColorPicker } from "@/components/widget-settings/color-picker";
import { PositionPicker } from "@/components/widget-settings/position-picker";
import { SaveStatus } from "@/components/widget-settings/save-status";
import {
  SetupProgress,
  type SetupStep,
} from "@/components/widget-settings/setup-progress";
import { SourceRow } from "@/components/widget-settings/source-row";
import { useAgentAvatar } from "@/components/widget-settings/use-agent-avatar";
import { useAutosave } from "@/components/widget-settings/use-autosave";
import { WidgetPreview } from "@/components/widget-settings/widget-preview";
import { agentAvatarUri } from "@/lib/avatar";
import { orpc } from "@/lib/orpc";

const PREVIEW_FALLBACK_DOMAIN = "yourwebsite.com";
const AUTOSAVE_DELAY_MS = 800;

export function WidgetSettings({
  description,
  avatarSeed,
  snippet,
}: {
  description: React.ReactNode;
  avatarSeed: string;
  snippet: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery(
    orpc.widgetSettings.get.queryOptions(),
  );
  const { data: sources } = useSuspenseQuery(
    orpc.knowledge.sources.queryOptions(),
  );
  const accent = useDashboardAccent();
  const form = useForm<WidgetSettingsInput>({
    resolver: zodResolver(widgetSettingsInputSchema),
    mode: "onChange",
    defaultValues: {
      position: settings.position,
      color: settings.color,
      agentName: settings.agentName,
      greeting: settings.greeting,
      allowedDomains: settings.allowedDomains,
    },
  });
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const [position, color, agentName, greeting, allowedDomains] = useWatch({
    control,
    name: ["position", "color", "agentName", "greeting", "allowedDomains"],
  });

  const { mutateAsync: saveSettings } = useMutation(
    orpc.widgetSettings.update.mutationOptions({
      onSuccess: (saved) =>
        queryClient.setQueryData(orpc.widgetSettings.get.queryKey(), saved),
    }),
  );
  const autosave = useAutosave({
    save: saveSettings,
    delay: AUTOSAVE_DELAY_MS,
  });
  const { schedule } = autosave;
  const [initialSnapshot] = useState(() =>
    JSON.stringify(widgetSettingsInputSchema.parse(form.getValues())),
  );
  const lastScheduledRef = useRef(initialSnapshot);

  useEffect(() => {
    // Invalid values stay in the form with their errors and aren't saved.
    const parsed = widgetSettingsInputSchema.safeParse({
      position,
      color,
      agentName,
      greeting,
      allowedDomains,
    });
    if (!parsed.success) return;
    const snapshot = JSON.stringify(parsed.data);
    if (snapshot === lastScheduledRef.current) return;
    lastScheduledRef.current = snapshot;
    schedule(parsed.data);
  }, [position, color, agentName, greeting, allowedDomains, schedule]);

  const avatar = useAgentAvatar();

  const accentHex = widgetColorHex[color];
  const generatedAvatarUrl = useMemo(
    () => agentAvatarUri(avatarSeed, accentHex),
    [avatarSeed, accentHex],
  );
  const avatarUrl = settings.agentAvatarUrl ?? generatedAvatarUrl;
  const readySources = sources.filter((source) => source.status === "ready");
  const agentOn = readySources.length > 0;
  const previewName = agentName.trim() || settings.agentName;

  const steps: SetupStep[] = [
    {
      id: "source",
      title: "Add a source",
      description: "Add a file so the agent has something to answer from.",
      href: "#knowledge-base",
      done: sources.length > 0,
    },
    {
      id: "domain",
      title: "Add an allowed domain",
      description: "Tell us which website your widget runs on.",
      href: "#allowed-domains",
      done: allowedDomains.length > 0,
    },
    {
      id: "install",
      title: "Install the snippet",
      description: "Paste one script tag into your site.",
      href: "#install",
      done: settings.snippetInstalled,
    },
  ];

  return (
    <>
      <PageHeader
        title="Home"
        description={description}
        actions={
          <SaveStatus status={autosave.status} onRetry={autosave.retry} />
        }
      />
      <div className="@container px-4 pb-12 lg:px-6">
        <div className="grid gap-10 @min-[50rem]:grid-cols-[minmax(0,1fr)_23rem] @min-[50rem]:items-start @min-[50rem]:gap-8">
          <form
            noValidate
            onSubmit={(event) => event.preventDefault()}
            className="flex min-w-0 flex-col gap-10"
          >
            <SetupProgress steps={steps} />

            <SettingsSection
              title="Appearance"
              description="How the widget looks and greets visitors."
            >
              <SettingsRow
                label="Position"
                description="Which corner of the page the widget opens in."
              >
                <Controller
                  control={control}
                  name="position"
                  render={({ field }) => (
                    <PositionPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </SettingsRow>
              <SettingsRow
                label="Accent color"
                description="Used for the launcher, buttons and links. Text on it stays white."
              >
                <Controller
                  control={control}
                  name="color"
                  render={({ field }) => (
                    <ColorPicker
                      value={field.value}
                      onChange={(next) => {
                        field.onChange(next);
                        accent.setColor(next);
                      }}
                    />
                  )}
                />
              </SettingsRow>
              <SettingsRow
                label="Agent name"
                description="Shown above every agent reply."
                htmlFor="agent-name"
              >
                <div className="flex flex-col gap-1.5">
                  <Input
                    id="agent-name"
                    className="h-9"
                    autoComplete="off"
                    aria-invalid={!!errors.agentName}
                    {...register("agentName")}
                  />
                  <FieldError errors={[errors.agentName]} />
                </div>
              </SettingsRow>
              <SettingsRow
                label="Agent avatar"
                description="Optional. Without one, we generate an avatar in your accent color."
              >
                <AgentAvatarField
                  avatarUrl={avatarUrl}
                  agentName={previewName}
                  custom={settings.agentAvatarUrl !== null}
                  uploading={avatar.uploading}
                  busy={avatar.busy}
                  error={avatar.error}
                  onUpload={avatar.upload}
                  onRemove={avatar.remove}
                />
              </SettingsRow>
              <SettingsRow
                label="Greeting"
                description="The first message every visitor sees, even when the agent is off."
                htmlFor="greeting"
              >
                <div className="flex flex-col gap-1.5">
                  <Textarea
                    id="greeting"
                    rows={3}
                    className="resize-none"
                    maxLength={GREETING_MAX_LENGTH}
                    aria-invalid={!!errors.greeting}
                    {...register("greeting")}
                  />
                  <div className="flex justify-between gap-4">
                    <FieldError errors={[errors.greeting]} />
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {greeting.length}/{GREETING_MAX_LENGTH}
                    </span>
                  </div>
                </div>
              </SettingsRow>
              <SettingsRow
                label="Suggested questions"
                description="Generated from your knowledge base, so you can't edit them."
              >
                {agentOn ? (
                  <ul className="flex flex-col gap-1.5 pt-1.5 text-sm">
                    {settings.suggestedQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="pt-1.5 text-sm text-muted-foreground">
                    They appear once a source is ready.
                  </p>
                )}
              </SettingsRow>
            </SettingsSection>

            <SettingsSection
              id="allowed-domains"
              title="Allowed domains"
              description="Your widget only loads on these websites. Add each subdomain you use, like www.example.com."
            >
              <SettingsBlock>
                <Controller
                  control={control}
                  name="allowedDomains"
                  render={({ field }) => (
                    <AllowedDomainsField
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </SettingsBlock>
            </SettingsSection>

            <SettingsSection
              id="knowledge-base"
              title="Knowledge base"
              description={
                agentOn
                  ? `The agent answers from ${readySources.length} ready ${readySources.length === 1 ? "source" : "sources"}.`
                  : "The agent is off until a source is ready. Until then, every conversation comes to you."
              }
            >
              <SettingsBlock>
                <Dropzone
                  multiple
                  disabled
                  accept={sourceFileTypes}
                  typeLabel="PDF, Markdown or text"
                  maxBytes={SOURCE_FILE_MAX_BYTES}
                  title="File uploads are coming soon"
                  description="PDF, Markdown or text, up to 10 MB each."
                  onFiles={() => undefined}
                />
              </SettingsBlock>
              {sources.length > 0 ? (
                <ul className="divide-y">
                  {sources.map((source) => (
                    <SourceRow key={source.id} source={source} />
                  ))}
                </ul>
              ) : null}
            </SettingsSection>

            <SettingsSection
              id="install"
              title="Install"
              description="Paste this snippet before the closing body tag on every page of your site."
            >
              <SettingsBlock>{snippet}</SettingsBlock>
            </SettingsSection>
          </form>

          <aside className="@min-[50rem]:sticky @min-[50rem]:top-6">
            <WidgetPreview
              domain={allowedDomains[0] ?? PREVIEW_FALLBACK_DOMAIN}
              position={position}
              agentName={previewName}
              agentAvatarUrl={avatarUrl}
              accentHex={accentHex}
              greeting={greeting.trim() || settings.greeting}
              suggestedQuestions={settings.suggestedQuestions}
              agentOn={agentOn}
            />
          </aside>
        </div>
      </div>
    </>
  );
}
