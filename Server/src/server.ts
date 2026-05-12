import { createServer } from "node:http";
import app from "./app";
import { env } from "./common/config/env.config";
import logger from "./common/config/logger.config";
// import connectToDatabase from "./common/config/database";

const runServer = async (): Promise<void> => {
  const server = createServer(app);
  // await connectToDatabase();

  server.listen(env.PORT, () => {
    logger.info(`Server is listening to the port http://localhost:${env.PORT}`);
  });
};

runServer()
  .then(() => {
    logger.info("Server started successfully");
  })
  .catch((error) => {
    logger.error({
      message: "Failed to start server",
      error,
    });

    process.exit(1);
  });
