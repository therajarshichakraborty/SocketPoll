import { pgTable, uuid, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core";

export const polls = pgTable("polls", {
  id: uuid("id").defaultRandom().primaryKey(),
  creatorId: uuid("creator_id").notNull(),

  title: varchar("title", {
    length: 255,
  }).notNull(),

  description: text("description"),
  allowAnonymous: boolean("allow_anonymous").default(true),
  requireAuth: boolean("require_auth").default(false),
  isPublished: boolean("is_published").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
