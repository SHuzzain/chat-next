import { z } from "zod";
import { jsonSchemaPropertySchema, inputSchemaSchema } from "@/schema/tools";

function propertyToZod(
  prop: z.infer<typeof jsonSchemaPropertySchema>,
  parentRequired?: z.infer<typeof inputSchemaSchema>["required"],
  key?: string,
) {
  let zType: z.ZodType;

  // ⭐ ENUM HANDLING (highest priority)
  if (prop.enum && prop.enum.length > 0) {
    zType = z.enum([...prop.enum] as [string, ...string[]]);
  } else {
    switch (prop.type) {
      case "string":
        zType = z.string();
        if (prop.minLength !== undefined)
          zType = (zType as z.ZodString).min(prop.minLength);
        if (prop.maxLength !== undefined)
          zType = (zType as z.ZodString).max(prop.maxLength);
        break;

      case "number":
        zType = z.number();
        if (prop.minimum !== undefined)
          zType = (zType as z.ZodNumber).min(prop.minimum);
        if (prop.maximum !== undefined)
          zType = (zType as z.ZodNumber).max(prop.maximum);
        break;

      case "boolean":
        zType = z.boolean();
        break;

      case "array":
        zType = z.array(prop.items ? propertyToZod(prop.items) : z.any());
        if (prop.minItems !== undefined)
          zType = (zType as z.ZodArray<z.ZodTypeAny>).min(prop.minItems);
        if (prop.maxItems !== undefined)
          zType = (zType as z.ZodArray<z.ZodTypeAny>).max(prop.maxItems);
        break;

      case "object":
        zType = z.object(
          prop.properties
            ? Object.fromEntries(
                Object.entries(prop.properties).map(([k, v]) => [
                  k,
                  propertyToZod(v, prop.required, k),
                ]),
              )
            : {},
        );
        break;

      default:
        zType = z.any();
    }
  }

  // IMPORTANT: attach description so the model understands requirements
  // (e.g. "must be a MongoId", "class intake ID", "search by fullName", etc.)
  if (prop.description) {
    zType = zType.describe(prop.description);
  }

  if (key && parentRequired && !parentRequired.includes(key)) {
    zType = zType.optional();
  }

  return zType;
}

export function jsonSchemaToZod(schema: z.infer<typeof inputSchemaSchema>) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    shape[key] = propertyToZod(prop, schema.required, key);
  }

  return z.object(shape);
}
