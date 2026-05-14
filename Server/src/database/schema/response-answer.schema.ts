import { pgTable, uuid } from "drizzle-orm/pg-core";
import { responses } from "./response.schema";
import { questions } from "./question.schema";
import { options } from "./option.schema";

export const responseAnswers = pgTable("response_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  responseId: uuid("response_id")
    .references(() => responses.id, {
      onDelete: "cascade",
    })
    .notNull(),

  questionId: uuid("question_id")
    .references(() => questions.id, {
      onDelete: "cascade",
    })
    .notNull(),
  optionId: uuid("option_id")
    .references(() => options.id, {
      onDelete: "cascade",
    })
    .notNull(),
});
