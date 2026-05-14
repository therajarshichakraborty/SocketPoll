import { z } from "zod";

export const castVoteValidator = z.object({
  answers: z
    .record(z.string("Invalid question ID"), z.string("Invalid option ID"))
    .refine((val) => Object.keys(val).length >= 1, {
      message: "At least one answer required",
    }),
  anonymousId: z.string().min(1).max(100).optional(),
});
