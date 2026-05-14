import { relations } from "drizzle-orm";
import { polls } from "./poll.schema";
import { questions } from "./question.schema";
import { options } from "./option.schema";
import { responses } from "./response.schema";
import { responseAnswers } from "./response-answer.schema";
import { users } from "./user.schema";

export const usersRelations = relations(users, ({ many }) => ({
  polls: many(polls),
  responses: many(responses),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  creator: one(users, { fields: [polls.creatorId], references: [users.id] }),
  questions: many(questions),
  responses: many(responses),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  poll: one(polls, { fields: [questions.pollId], references: [polls.id] }),
  options: many(options),
  responseAnswers: many(responseAnswers),
}));

export const optionsRelations = relations(options, ({ one, many }) => ({
  question: one(questions, { fields: [options.questionId], references: [questions.id] }),
  responseAnswers: many(responseAnswers),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  poll: one(polls, { fields: [responses.pollId], references: [polls.id] }),
  user: one(users, { fields: [responses.userId], references: [users.id] }),
  answers: many(responseAnswers),
}));

export const responseAnswersRelations = relations(responseAnswers, ({ one }) => ({
  response: one(responses, { fields: [responseAnswers.responseId], references: [responses.id] }),
  question: one(questions, { fields: [responseAnswers.questionId], references: [questions.id] }),
  option: one(options, { fields: [responseAnswers.optionId], references: [options.id] }),
}));
