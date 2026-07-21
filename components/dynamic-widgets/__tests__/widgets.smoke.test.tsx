import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ConfirmationWidget } from "@/components/dynamic-widgets/choice-widgets";
import { DatePickerWidget } from "@/components/dynamic-widgets/date-widgets";
import { OptionCardsWidget } from "@/components/dynamic-widgets/choice-widgets";
import { RadioGroupWidget } from "@/components/dynamic-widgets/choice-widgets";
import { AsyncSelectWidget } from "@/components/dynamic-widgets/async-select-widget";
import { AsyncMultiSelectWidget } from "@/components/dynamic-widgets/choice-widgets";
import { CheckboxGroupWidget } from "@/components/dynamic-widgets/choice-widgets";
import { AsyncTableWidget } from "@/components/dynamic-widgets/async-table-widget";
import { DateRangeWidget } from "@/components/dynamic-widgets/date-widgets";
import { DynamicFormWidget } from "@/components/dynamic-widgets/dynamic-form-widget";
import { WidgetAuthProvider } from "@/components/dynamic-widgets/widget-auth-context";
import { WidgetDependencyProvider } from "@/components/dynamic-widgets/widget-dependency-store";

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <WidgetAuthProvider
        value={{ token: "test-token", origin: "https://lms.example.com" }}
      >
        <WidgetDependencyProvider>{ui}</WidgetDependencyProvider>
      </WidgetAuthProvider>
    </QueryClientProvider>,
  );
}

describe("widget smoke", () => {
  it("confirmation submits", () => {
    const onSubmit = vi.fn();
    wrap(
      <ConfirmationWidget
        widget={{
          id: "c1",
          type: "confirmation",
          title: "Confirm",
          message: "Are you sure?",
        }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ widgetId: "c1", action: "submit" }),
    );
  });

  it("option-cards static options", () => {
    const onSubmit = vi.fn();
    wrap(
      <OptionCardsWidget
        widget={{
          id: "o1",
          type: "option-cards",
          title: "Pick one",
          required: true,
          dataSource: {
            source: "static",
            options: [
              { value: "a", label: "Alpha" },
              { value: "b", label: "Beta" },
            ],
          },
        }}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /alpha/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "submit",
        value: expect.objectContaining({ id: "a" }),
      }),
    );
  });

  it("radio-group static", () => {
    wrap(
      <RadioGroupWidget
        widget={{
          id: "r1",
          type: "radio-group",
          title: "Radio",
          required: true,
          dataSource: {
            source: "static",
            options: [{ value: "1", label: "One" }],
          },
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("One")).toBeInTheDocument();
  });

  it("date-picker renders", () => {
    wrap(
      <DatePickerWidget
        widget={{
          id: "d1",
          type: "date-picker",
          title: "Pick date",
          required: true,
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  it("date-range renders", () => {
    wrap(
      <DateRangeWidget
        widget={{
          id: "dr1",
          type: "date-range",
          title: "Range",
          required: true,
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/start/i)).toBeInTheDocument();
  });

  it("dynamic-form renders fields", () => {
    wrap(
      <DynamicFormWidget
        widget={{
          id: "f1",
          type: "dynamic-form",
          title: "Form",
          fields: [
            {
              name: "notes",
              label: "Notes",
              type: "text",
              required: true,
            },
          ],
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("Notes *")).toBeInTheDocument();
  });

  it("async-select static options", () => {
    wrap(
      <AsyncSelectWidget
        widget={{
          id: "s1",
          type: "async-select",
          title: "Select",
          searchable: false,
          required: true,
          dataSource: {
            source: "static",
            options: [{ value: "u1", label: "User One" }],
          },
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("Select")).toBeInTheDocument();
  });

  it("async-multi-select / checkbox-group static", () => {
    wrap(
      <AsyncMultiSelectWidget
        widget={{
          id: "m1",
          type: "async-multi-select",
          title: "Multi",
          searchable: false,
          required: true,
          dataSource: {
            source: "static",
            options: [{ value: "a", label: "A" }],
          },
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();

    wrap(
      <CheckboxGroupWidget
        widget={{
          id: "cg1",
          type: "checkbox-group",
          title: "Checks",
          required: true,
          dataSource: {
            source: "static",
            options: [{ value: "b", label: "B" }],
          },
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("async-table shows empty without fetch when blocked", async () => {
    // Mock fetch to avoid network
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ _id: "1", name: "Row" }],
          pagination: {
            page: 1,
            pageSize: 20,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }),
      }),
    );

    wrap(
      <AsyncTableWidget
        widget={{
          id: "t1",
          type: "async-table",
          title: "Table",
          searchable: true,
          exportable: false,
          selectionMode: "none",
          columns: [{ key: "name", label: "Name" }],
          dataSource: {
            source: "remote",
            resource: "users",
            params: {},
          },
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(await screen.findByText("Row")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
