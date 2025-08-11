// app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import routes from "./routes/index";
import errorHandler from "./error/error.global";
import logger from "./utils/logger";
import { logSuccess } from "./middlewares/logSuccess";

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging HTTP requests using morgan + winston
app.use(
  morgan("combined", {
    stream: {
      write: (message: any) => logger.http(message.trim()),
    },
  })
);

app.use(logSuccess);

// Routes
app.use("/", routes);

// Global Error Handler
app.use(errorHandler);

export default app;
