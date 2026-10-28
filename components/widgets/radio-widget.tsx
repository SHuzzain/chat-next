"use client";

import { useId, useState } from "react";
import { useAui } from "@assistant-ui/react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { selectionMessage, type WidgetOption } from "@/lib/widgets/present";

type RadioWidgetProps = {
  entity: string;
  options: WidgetOption[];
  totalItems?: number;
};

export function RadioWidget({ entity, options, totalItems }: RadioWidgetProps) {
  const aui = useAui();
  const radioName = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const count = totalItems ?? options.length;

  function submit() {
    const chosen = options.filter((option) => option.id === selectedId);
    if (chosen.length === 0) return;
    aui.thread.append(selectionMessage(entity, `${entity}s`, chosen));
    setSubmitted(true);
  }

  return (
    <FieldSet disabled={submitted}>
      <FieldLegend>Choose {entity.toLowerCase()}</FieldLegend>
      <FieldDescription>
        {count} match. Select one, then continue.
      </FieldDescription>
      <FieldGroup>
        <RadioGroup
          name={radioName}
          value={selectedId}
          disabled={submitted}
          onValueChange={setSelectedId}
        >
          {options.map((option) => (
            <FieldLabel key={option.id}>
              <Field orientation="horizontal" data-disabled={submitted || undefined}>
                <RadioGroupItem value={option.id} disabled={submitted} />
                <FieldContent>
                  <FieldTitle>{option.label}</FieldTitle>
                  {option.detail ? (
                    <FieldDescription>{option.detail}</FieldDescription>
                  ) : null}
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </FieldGroup>
      <Button disabled={submitted || !selectedId} onClick={submit}>
        Continue
      </Button>
    </FieldSet>
  );
}
