import express from "express";
import cors from "cors";
import helmet from "helmet";
import { routes } from "./routes";
import { requestLogger } from "./common/middlewares/requestLogger";
import { errorHandler } from "./common/middlewares/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api", routes);

app.use(errorHandler);
