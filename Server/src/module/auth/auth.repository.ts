import { eq } from "drizzle-orm";
import { db } from "../../common/config/db.config";
import { users } from "../../database/schema/user.schema";

export async function findUserByEmailRepository(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function findUserByIdRepository(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { password: false },
  });
}

export async function createUserRepository(data: {
  name: string;
  email: string;
  password: string;
}) {
  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      password: data.password,
      isVerified: false,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    });

  return user;
}
