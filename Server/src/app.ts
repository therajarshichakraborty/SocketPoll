import express,{Application,Request,Response,NextFunction,json,urlencoded} from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./common/auth/routes/auth.routes";
import logger from "./common/config/logger.config";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.set("trust proxy", 1);
  app.use(json({ limit: "10kb" }));
  app.use(urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use("/api/v1/auth", authRoutes);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", ts: Date.now(), name :"My name is Rajarshi Chakraborty" });
  });

  app.use((_req, res) => {
    res.status(404).json({ message: "Not found" });
  });
  
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error("[app] Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
  });


  return app;
}