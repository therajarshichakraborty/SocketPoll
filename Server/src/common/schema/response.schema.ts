import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pollId: uuid("poll_id").notNull(),
    userId: uuid("user_id"),
    submittedAt: timestamp("submitted_at").defaultNow(),
  },

  (table) => ({
    pollIdx: index("responses_poll_idx").on(table.pollId),
    userIdx: index("responses_user_idx").on(table.userId),
  }),
);

export const responseAnswers = pgTable(
  "response_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    responseId: uuid("response_id").notNull(),
    questionId: uuid("question_id").notNull(),
    optionId: uuid("option_id").notNull(),
  },

  (table) => ({
    responseIdx: index("response_answers_response_idx").on(table.responseId),
    questionIdx: index("response_answers_question_idx").on(table.questionId),
    optionIdx: index("response_answers_option_idx").on(table.optionId),
  }),
);
