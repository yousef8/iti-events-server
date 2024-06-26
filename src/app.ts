import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import routes from "./routes";
import errorHandler from "./middlewares/errorHandler";
import options from "./utils/swagger";

dotenv.config();

const app = express();
const specs = swaggerJSDoc(options);
const corsOptions = {
    origin: "*",
    optionSuccessStatus: 200,
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(routes);
app.use(errorHandler);

// For debugging, remove in production
process.on("uncaughtException", (err) => {
    console.log("Uncaught exception occurred:\n", err);
});

const {
    PORT, DB_USERNAME, DB_PASSWORD, CLUSTER_URL, DB_NAME,
} = process.env;
const uri = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${CLUSTER_URL}/${DB_NAME}`;

mongoose
    .connect(uri)
    .then(() => {
        console.log("Connected to MongoDB Atlas");
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}/`);
        });
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB Atlas:", err);
    });
