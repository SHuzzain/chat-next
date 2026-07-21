import { z } from "zod";

import { businessTypeSchema } from "@/mcptools/business-types/business-type.model";
import { centreTypeSchema } from "@/mcptools/centre-types/centre-type.model";
import { organisationSchema } from "@/mcptools/organisations/organisation.model";
import { userSchema } from "@/mcptools/users/user.model";
import { courseCentreSchema } from "./course-centre.model";

const populatedCreatorSchema = userSchema.omit({
  password: true,
  oldEmail: true,
  oldUsername: true,
  __v: true,
  unreadMessage: true,
});

/** Populated / aggregated course-centre list row for find_centres. */
export const getCourseCentresItemSchema = courseCentreSchema
  .omit({
    state: true,
    city: true,
    country: true,
  })
  .extend({
    creator: populatedCreatorSchema.optional(),
    organisation: organisationSchema.partial().loose().optional(),
    businessType: businessTypeSchema.partial().loose().optional(),
    centreType: centreTypeSchema.partial().loose().optional(),
    Creditpoints: z.string().optional().describe("get number as string"),
    stEngineeringPriority: z.number().optional(),
    demeritPointsData: z.number().optional(),
  });
