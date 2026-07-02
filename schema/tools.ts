import { z } from "zod";

const jsonSchemaTypeSchema = z.enum([
    "string",
    "number",
    "boolean",
    "array",
    "object",
    "null",
]);

export type JsonSchemaType = z.infer<typeof jsonSchemaTypeSchema>;

export type JsonSchemaProperty = {
    type: JsonSchemaType | JsonSchemaType[];
    enum?: Array<string | number | boolean | null>;
    properties?: Record<string, JsonSchemaProperty>;
    items?: JsonSchemaProperty;
    required?: string[];
    description?: string;
    format?: string;
    // Common constraints (backend may send these)
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    minItems?: number;
    maxItems?: number;
};

export const jsonSchemaPropertySchema: z.ZodType<JsonSchemaProperty> =
    z.lazy(() =>
        z
            .object({
                type: z.union([
                    jsonSchemaTypeSchema,
                    z.array(jsonSchemaTypeSchema).min(1),
                ]),
                enum: z
                    .array(
                        z.union([
                            z.string(),
                            z.number(),
                            z.boolean(),
                            z.null(),
                        ])
                    )
                    .optional(),
                properties: z
                    .record(z.string(), jsonSchemaPropertySchema)
                    .optional(),
                items: jsonSchemaPropertySchema.optional(),
                required: z.array(z.string()).optional(),
                description: z.string().optional(),
                format: z.string().optional(),
                minimum: z.number().optional(),
                maximum: z.number().optional(),
                minLength: z.number().optional(),
                maxLength: z.number().optional(),
                minItems: z.number().optional(),
                maxItems: z.number().optional(),
            })
            .loose()
    );

export const inputSchemaSchema = z
    .object({
        type: z.literal("object"),
        properties: z.record(z.string(), jsonSchemaPropertySchema),
        required: z.array(z.string()).optional(),
    })
    .loose();

export const toolJsonSchema = z
    .object({
        name: z.string(),
        description: z.string(),
        endpoint: z.string(),
        method: z.string(),
        inputSchema: inputSchemaSchema,
        pathParams: z.array(z.string()).optional(),
        queryParams: z.array(z.string()).optional(),
        bodyParams: z.array(z.string()).optional(),
        responseDescription: z.string().optional(),
    })
    .loose();

export const mcpToolGroupSchema = z
    .object({
        name: z.string(),
        description: z.string().optional(),
        tools: z.array(toolJsonSchema),
    })
    .loose();

export const backendResponseSchema = z.object({
    baseUrl: z.string(),
    mcpTools: z.array(mcpToolGroupSchema),
});
