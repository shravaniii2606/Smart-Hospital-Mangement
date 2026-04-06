const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const pdfParse = require("pdf-parse");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

function isTextLikeFile(file) {
  const mime = (file.mimetype || "").toLowerCase();
  if (mime.startsWith("text/")) return true;
  if (mime === "application/json" || mime === "application/xml") return true;
  const ext = path.extname(file.originalname || "").toLowerCase();
  return [".txt", ".csv", ".md", ".json", ".xml", ".log"].includes(ext);
}

function isPdfFile(file) {
  const mime = (file.mimetype || "").toLowerCase();
  if (mime === "application/pdf") return true;
  const ext = path.extname(file.originalname || "").toLowerCase();
  return ext === ".pdf";
}

function extractTextFromFile(file, maxChars) {
  if (!file || !file.buffer) return "";
  try {
    const text = file.buffer.toString("utf-8");
    if (!text) return "";
    if (text.length > maxChars) {
      return text.slice(0, maxChars) + "\n...[truncated]";
    }
    return text;
  } catch (_err) {
    return "";
  }
}

async function extractTextFromPdf(file, maxChars) {
  if (!file || !file.buffer) return "";
  try {
    const data = await pdfParse(file.buffer);
    const text = (data && data.text ? data.text : "").trim();
    if (!text) return "";
    if (text.length > maxChars) {
      return text.slice(0, maxChars) + "\n...[truncated]";
    }
    return text;
  } catch (_err) {
    return "";
  }
}

async function buildMessages(message, files) {
  const base = [
    {
      role: "system",
      content:
        "You are HealthSphere AI. Be concise, supportive, and provide clear next steps."
    }
  ];

  let content = message || "";
  if (Array.isArray(files) && files.length) {
    const fileList = files
      .map((file) => `${file.originalname || "file"} (${file.mimetype || "unknown"})`)
      .join(", ");
    content = `${content}\n\nAttached files: ${fileList}`;

    const textChunks = [];
    const maxCharsPerFile = 12000;
    for (const file of files) {
      if (isTextLikeFile(file)) {
        const extracted = extractTextFromFile(file, maxCharsPerFile);
        if (extracted) {
          textChunks.push(
            `\n---\nFile: ${file.originalname || "file"}\nContent:\n${extracted}`
          );
        }
        continue;
      }

      if (isPdfFile(file)) {
        const extracted = await extractTextFromPdf(file, maxCharsPerFile);
        if (extracted) {
          textChunks.push(
            `\n---\nFile: ${file.originalname || "file"}\nPDF Content:\n${extracted}`
          );
        }
      }
    }
    if (textChunks.length) {
      content = `${content}\n\nExtracted file contents:${textChunks.join("")}`;
    }
  }

  base.push({ role: "user", content: content.trim() });
  return base;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res.send("HealthSphere patient backend is running. Use /health or POST /api/chat.");
});

app.post("/api/chat", upload.array("files", 5), async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENROUTER_API_KEY in environment variables."
      });
    }

    const message = (req.body && req.body.message) || "";
    const files = req.files || [];
    if (!message && (!files || !files.length)) {
      return res.status(400).json({ error: "Message or files required." });
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: await buildMessages(message, files),
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: "OpenRouter request failed.",
        details: errorText
      });
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "I could not generate a response right now.";

    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({
      error: "Server error while contacting OpenRouter.",
      details: err?.message || String(err)
    });
  }
});

app.listen(port, () => {
  console.log(`Patient backend listening on http://localhost:${port}`);
});
