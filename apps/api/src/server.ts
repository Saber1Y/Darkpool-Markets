import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const envCandidates = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "apps/api/.env.local"),
  path.resolve(__dirname, "../.env.local")
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
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
  const hasResolverKey = Boolean(process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY);
  console.log(`API listening on :${port} (resolver key: ${hasResolverKey ? "loaded" : "missing"})`);
});
