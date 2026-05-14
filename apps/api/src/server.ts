import "dotenv/config";
import express from "express";
import cors from "cors";
import encryptRouter from "./routes/encrypt";
import resolveRouter from "./routes/resolve";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", encryptRouter);
app.use("/api", resolveRouter);

app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
