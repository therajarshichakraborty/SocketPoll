import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { pollRooms } from "./poll-rooms.schema";

export const roomParticipants = pgTable("room_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => pollRooms.id, {
    onDelete: "cascade",
  }),

  name: text("name").notNull(),
  socketId: text("socket_id"),
  hasVoted: boolean("has_voted").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});
