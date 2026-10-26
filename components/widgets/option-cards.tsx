"use client";

import { useId, useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { selectionMessage, type WidgetOption } from "@/lib/widgets/present";

type OptionCardsProps = {
  entity: string;
  plural: string;
  totalItems: number;
  multiple: boolean;
  options: WidgetOption[];
};

export function OptionCards({ entity, plural, totalItems, multiple, options }: OptionCardsProps) {
  const aui = useAui();
  const radioName = useId();
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const noun = totalItems === 1 ? entity : plural;

  function toggle(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  }

  function submit(ids: string[]) {
    const chosen = options.filter((option) => ids.includes(option.id));
    if (chosen.length === 0) return;
    aui.thread.append(selectionMessage(entity, plural, chosen));
    setSubmitted(true);
  }

  const chosenIds = multiple ? selected : selectedId ? [selectedId] : [];

  const cards = options.map((option) => (
    <FieldLabel key={option.id}>
      <Field orientation="horizontal" data-disabled={submitted || undefined}>
        {multiple ? (
          <Checkbox
            checked={selected.includes(option.id)}
            disabled={submitted}
            onCheckedChange={(checked) => toggle(option.id, checked === true)}
          />
        ) : (
          <RadioGroupItem value={option.id} disabled={submitted} />
        )}
        <FieldContent>
          <FieldTitle>{option.label}</FieldTitle>
          {option.detail ? <FieldDescription>{option.detail}</FieldDescription> : null}
        </FieldContent>
      </Field>
    </FieldLabel>
  ));

  return (
    <FieldSet disabled={submitted}>
      <FieldLegend>Choose {noun.toLowerCase()}</FieldLegend>
      <FieldDescription>
        {totalItems} {noun.toLowerCase()} match. Select {multiple ? "one or more" : "one"}, then
        continue.
      </FieldDescription>
      <FieldGroup>
        {multiple ? (
          cards
        ) : (
          <RadioGroup
            name={radioName}
            value={selectedId}
            disabled={submitted}
            onValueChange={setSelectedId}
          >
            {cards}
          </RadioGroup>
        )}
      </FieldGroup>
      <Button disabled={submitted || chosenIds.length === 0} onClick={() => submit(chosenIds)}>
        Continue
      </Button>
    </FieldSet>
  );
}
