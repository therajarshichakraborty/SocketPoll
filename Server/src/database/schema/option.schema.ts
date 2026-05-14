import { pgTable, uuid, text, integer } from "drizzle-orm/pg-core";
import { questions } from "./question.schema";

export const options = pgTable("options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .references(() => questions.id, {
      onDelete: "cascade",
    })
    .notNull(),

  text: text("text").notNull(),
  votes: integer("votes").default(0).notNull(),
  order: integer("order").notNull(),
});
