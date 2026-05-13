import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),

  provider: varchar("provider", {
    length: 50,
  }).notNull(),

  providerAccountId: varchar("provider_account_id", {
    length: 255,
  }).notNull(),
});
