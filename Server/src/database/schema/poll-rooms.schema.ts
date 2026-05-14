import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { polls } from "./poll.schema";

export const pollRoomStatusEnum = pgEnum("poll_room_status", [
  "waiting",
  "active",
  "ended",
  "expired",
]);

export const pollRooms = pgTable("poll_rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id")
    .references(() => polls.id, {
      onDelete: "cascade",
    })
    .notNull(),

  roomCode: text("room_code")
    .notNull()
    .unique()
    .$defaultFn(() => nanoid(6).toUpperCase()),

  status: pollRoomStatusEnum("status").default("waiting").notNull(),
  startedAt: timestamp("started_at"),
  endsAt: timestamp("ends_at").notNull(),
  endedAt: timestamp("ended_at"),
  endedByCreator: boolean("ended_by_creator").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
