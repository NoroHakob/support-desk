"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  GREETING_MAX_LENGTH,
  SOURCE_FILE_MAX_BYTES,
  sourceFileTypes,
  widgetColorHex,
  widgetSettingsInputSchema,
  type Source,
  type WidgetSettings as WidgetSettingsData,
  type WidgetSettingsInput,
} from "@marshaldesk/shared";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { useDashboardAccent } from "@/components/dashboard/accent-provider";
import { Dropzone } from "@/components/dashboard/dropzone";
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
import {
  SetupProgress,
  type SetupStep,
} from "@/components/widget-settings/setup-progress";
import { SourceRow } from "@/components/widget-settings/source-row";
import { WidgetPreview } from "@/components/widget-settings/widget-preview";
import { agentAvatarUri } from "@/lib/avatar";

const PREVIEW_FALLBACK_DOMAIN = "yourwebsite.com";

export function WidgetSettings({
  initialSettings,
  initialSources,
  avatarSeed,
  snippet,
}: {
  initialSettings: WidgetSettingsData;
  initialSources: Source[];
  avatarSeed: string;
  snippet: React.ReactNode;
}) {
  const accent = useDashboardAccent();
  const form = useForm<WidgetSettingsInput>({
    resolver: zodResolver(widgetSettingsInputSchema),
    mode: "onChange",
    defaultValues: {
      position: initialSettings.position,
      color: accent.color,
      agentName: initialSettings.agentName,
      greeting: initialSettings.greeting,
      allowedDomains: initialSettings.allowedDomains,
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

  const [sources, setSources] = useState(initialSources);
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    initialSettings.agentAvatarUrl,
  );

  useEffect(() => {
    return () => {
      if (customAvatarUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(customAvatarUrl);
      }
    };
  }, [customAvatarUrl]);

  const accentHex = widgetColorHex[color];
  const generatedAvatarUrl = useMemo(
    () => agentAvatarUri(avatarSeed, accentHex),
    [avatarSeed, accentHex],
  );
  const avatarUrl = customAvatarUrl ?? generatedAvatarUrl;
  const readySources = sources.filter((source) => source.status === "ready");
  const agentOn = readySources.length > 0;
  const previewName = agentName.trim() || initialSettings.agentName;

  const steps: SetupStep[] = [
    {
      id: "source",
      title: "Add a source",
      description: "Upload a file so the agent has something to answer from.",
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
      done: initialSettings.snippetInstalled,
    },
  ];

  function addFiles(files: File[]) {
    const now = new Date();
    setSources((current) => [
      ...files.map((file): Source => ({
        id: crypto.randomUUID(),
        kind: "file",
        name: file.name,
        mime: file.type || null,
        size: file.size,
        status: "uploaded",
        error: null,
        createdAt: now,
        updatedAt: now,
      })),
      ...current.filter(
        (source) => !files.some((file) => file.name === source.name),
      ),
    ]);
  }

  return (
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
                custom={customAvatarUrl !== null}
                onUpload={(file) =>
                  setCustomAvatarUrl(URL.createObjectURL(file))
                }
                onRemove={() => setCustomAvatarUrl(null)}
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
                  {initialSettings.suggestedQuestions.map((question) => (
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
                accept={sourceFileTypes}
                typeLabel="PDF, Markdown or text"
                maxBytes={SOURCE_FILE_MAX_BYTES}
                title="Drop files here, or click to choose"
                description="PDF, Markdown or text, up to 10 MB each."
                onFiles={addFiles}
              />
            </SettingsBlock>
            {sources.length > 0 ? (
              <ul className="divide-y">
                {sources.map((source) => (
                  <SourceRow
                    key={source.id}
                    source={source}
                    onDelete={() =>
                      setSources((current) =>
                        current.filter((item) => item.id !== source.id),
                      )
                    }
                  />
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
            greeting={greeting.trim() || initialSettings.greeting}
            suggestedQuestions={initialSettings.suggestedQuestions}
            agentOn={agentOn}
          />
        </aside>
      </div>
    </div>
  );
}
