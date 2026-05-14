import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./common/config/env.config";
import logger from "./common/config/logger.config";
import { connectToDB } from "../src/common/config/db.config";
async function main(): Promise<void> {
  logger.info("Initializing server");

  await connectToDB();
  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`Server is listening on port http://localhost:${env.PORT}`);
  });
}

main()
  .then(() => {
    logger.info("Server started successfully");
  })
  .catch((error) => {
    logger.error({
      message: "Failed to start the server",
      error,
    });

    process.exit(1);
  });
