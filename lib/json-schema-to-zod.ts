import { z } from "zod";
import { jsonSchemaPropertySchema, inputSchemaSchema } from "@/schema/tools";




function propertyToZod(
  prop: z.infer<typeof jsonSchemaPropertySchema>,
  parentRequired?: z.infer<typeof inputSchemaSchema>["required"],
  key?: string
) {
  let zType: z.ZodType;

  // ⭐ ENUM HANDLING (highest priority)
  if (prop.enum && prop.enum.length > 0) {
    zType = z.enum([...prop.enum] as [string, ...string[]]);
  } else {
    switch (prop.type) {
      case "string":
        zType = z.string();
        break;

      case "number":
        zType = z.number();
        break;

      case "boolean":
        zType = z.boolean();
        break;

      case "array":
        zType = z.array(prop.items ? propertyToZod(prop.items) : z.any());
        break;

      case "object":
        zType = z.object(
          prop.properties
            ? Object.fromEntries(
              Object.entries(prop.properties).map(([k, v]) => [
                k,
                propertyToZod(v, prop.required, k),
              ])
            )
            : {}
        );
        break;

      default:
        zType = z.any();
    }
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
