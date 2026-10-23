"use client";

import { allowedDomainSchema } from "@marshaldesk/shared";
import { Globe, Plus, X } from "lucide-react";
import { useState } from "react";

import { IconButton } from "@/components/dashboard/icon-button";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function AllowedDomainsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    const result = allowedDomainSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid domain.");
      return;
    }
    if (value.includes(result.data)) {
      setError(`${result.data} is already on the list.`);
      return;
    }
    onChange([...value, result.data]);
    setDraft("");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <InputGroup className="h-9">
          <InputGroupAddon>
            <Globe />
          </InputGroupAddon>
          <InputGroupInput
            id="allowed-domain"
            placeholder="example.com"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            aria-invalid={!!error}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="sm" variant="secondary" onClick={add}>
              <Plus />
              Add
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldError>{error}</FieldError>
      </div>

      {value.length > 0 ? (
        <ul className="divide-y rounded-lg ring-1 ring-foreground/10">
          {value.map((domain) => (
            <li
              key={domain}
              className="flex h-11 items-center gap-2.5 pr-1.5 pl-3 text-sm"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0 flex-1 truncate">{domain}</span>
              <IconButton
                label={`Remove ${domain}`}
                onClick={() =>
                  onChange(value.filter((existing) => existing !== domain))
                }
              >
                <X />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No domains yet, so the widget won&apos;t load anywhere.
        </p>
      )}
    </div>
  );
}
