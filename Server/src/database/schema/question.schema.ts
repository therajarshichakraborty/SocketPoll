import { pgTable, uuid, text, boolean, integer } from "drizzle-orm/pg-core";
import { polls } from "./poll.schema";

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id")
    .references(() => polls.id, {
      onDelete: "cascade",
    })
    .notNull(),

  question: text("question").notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
  order: integer("order").notNull(),
});
