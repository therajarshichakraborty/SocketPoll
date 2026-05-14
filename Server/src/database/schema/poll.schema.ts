import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const polls = pgTable("polls", {
  id: uuid("id").defaultRandom().primaryKey(),
  creatorId: uuid("creator_id")
    .references(() => users.id, {
      onDelete: "cascade",
    })
    .notNull(),

  title: text("title").notNull(),
  description: text("description"),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  requireAuth: boolean("require_auth").default(false).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  isClosed: boolean("is_closed").default(false).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
