import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { polls } from "./poll.schema";
import { users } from "./user.schema";

export const responses = pgTable("responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id")
    .references(() => polls.id, {
      onDelete: "cascade",
    })
    .notNull(),

  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),

  anonymousId: text("anonymous_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
