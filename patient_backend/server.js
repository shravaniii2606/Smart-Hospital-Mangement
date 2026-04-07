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
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://nfmzosvedtieicnfbmlh.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbXpvc3ZlZHRpZWljbmZibWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzk1MDgsImV4cCI6MjA5MDYxNTUwOH0.UWGk4L8AQu-5NfpknMKizvFmAcyX6QgUmqOGSr1G6Wc";

const conversationState = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

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

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.ip || "unknown";
}

function setConversationState(key, nextState) {
  conversationState.set(key, { ...nextState, updatedAt: Date.now() });
}

function getConversationState(key) {
  const entry = conversationState.get(key);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > STATE_TTL_MS) {
    conversationState.delete(key);
    return null;
  }
  return entry;
}

function isAffirmative(message) {
  const msg = normalizeText(message);
  return (
    msg === "yes" ||
    msg === "yeah" ||
    msg === "yep" ||
    msg === "sure" ||
    msg.startsWith("yes ") ||
    msg.startsWith("yeah ") ||
    msg.startsWith("yep ")
  );
}

function detectSpecialty(message) {
  const msg = normalizeText(message);
  if (!msg) return null;

  const cardioHints = [
    "chest pain",
    "pain in chest",
    "heart",
    "cardio",
    "cardiac",
    "palpitations"
  ];

  if (cardioHints.some((hint) => msg.includes(hint))) {
    return { specialty: "Cardiology", label: "cardiologist" };
  }

  return null;
}

function extractExplicitSpecialty(message) {
  const msg = normalizeText(message);
  if (msg.includes("cardio") || msg.includes("cardiologist") || msg.includes("cardiology")) {
    return { specialty: "Cardiology", label: "cardiologist" };
  }
  return null;
}

async function fetchDoctorsBySpecialty(specialty) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return [];
  }

  const query = new URLSearchParams({
    select: "doc_id,name,specialty,experience,availability,phone,email",
    specialty: `ilike.*${specialty}*`
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/doctor_profile?${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to load doctors.");
  }

  return (await response.json()) || [];
}

function formatDoctorList(doctors, label) {
  if (!doctors || !doctors.length) {
    return `I couldn't find any ${label}s in our directory yet. You can check the Find Doctors page for the latest updates.`;
  }

  const topDoctors = doctors.slice(0, 5);
  const list = topDoctors
    .map((doctor) => {
      const name = doctor.name || "Doctor";
      const specialty = doctor.specialty || label;
      const availability = doctor.availability ? ` | ${doctor.availability}` : "";
      const phone = doctor.phone ? ` | ${doctor.phone}` : "";
      return `${name} (${specialty}${availability}${phone})`;
    })
    .join(" · ");

  return `Here are ${label}s available right now: ${list}`;
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
    const message = (req.body && req.body.message) || "";
    const files = req.files || [];
    if (!message && (!files || !files.length)) {
      return res.status(400).json({ error: "Message or files required." });
    }

    const messageLower = normalizeText(message);
    const clientKey = getClientKey(req);
    const previousState = getConversationState(clientKey);
    const detectedSpecialty = detectSpecialty(message);
    const explicitSpecialty = extractExplicitSpecialty(message);

    if (detectedSpecialty) {
      setConversationState(clientKey, {
        specialty: detectedSpecialty.specialty,
        label: detectedSpecialty.label
      });
      return res.json({
        reply:
          "Chest pain can be serious. If it's severe, sudden, or with shortness of breath, please seek emergency care.\n" +
          `It would be best to visit a ${detectedSpecialty.label}. Would you like me to suggest some ${detectedSpecialty.label}s from our directory?`
      });
    }

    if (
      explicitSpecialty ||
      (previousState && isAffirmative(messageLower))
    ) {
      const chosenSpecialty = explicitSpecialty || previousState;
      const specialtyLabel = chosenSpecialty.label || "specialist";

      try {
        const doctors = await fetchDoctorsBySpecialty(chosenSpecialty.specialty);
        conversationState.delete(clientKey);
        return res.json({
          reply: formatDoctorList(doctors, specialtyLabel)
        });
      } catch (error) {
        return res.json({
          reply:
            "I had trouble loading doctors from the directory. Please try again or open the Find Doctors page."
        });
      }
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENROUTER_API_KEY in environment variables."
      });
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
