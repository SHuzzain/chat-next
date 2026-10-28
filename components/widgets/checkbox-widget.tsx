"use client";

import { useState } from "react";
import { useAui } from "@assistant-ui/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { selectionMessage, type WidgetOption } from "@/lib/widgets/present";

type CheckboxWidgetProps = {
  entity: string;
  options: WidgetOption[];
  totalItems?: number;
};

export function CheckboxWidget({
  entity,
  options,
  totalItems,
}: CheckboxWidgetProps) {
  const aui = useAui();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const count = totalItems ?? options.length;

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  }

  function submit() {
    const chosen = options.filter((option) => selected.includes(option.id));
    if (chosen.length === 0) return;
    aui.thread.append(selectionMessage(entity, `${entity}s`, chosen));
    setSubmitted(true);
  }

  return (
    <FieldSet disabled={submitted}>
      <FieldLegend>Choose {entity.toLowerCase()}</FieldLegend>
      <FieldDescription>
        {count} match. Select one or more, then continue.
      </FieldDescription>
      <FieldGroup>
        {options.map((option) => (
          <FieldLabel key={option.id}>
            <Field orientation="horizontal" data-disabled={submitted || undefined}>
              <Checkbox
                checked={selected.includes(option.id)}
                disabled={submitted}
                onCheckedChange={(checked) => toggle(option.id, checked === true)}
              />
              <FieldContent>
                <FieldTitle>{option.label}</FieldTitle>
                {option.detail ? (
                  <FieldDescription>{option.detail}</FieldDescription>
                ) : null}
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </FieldGroup>
      <Button disabled={submitted || selected.length === 0} onClick={submit}>
        Continue
      </Button>
    </FieldSet>
  );
}
