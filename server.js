import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (_req, res) => {
  res.json({ configured: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_MODEL || "gpt-5.5" });
});

app.post("/api/generate", async (req, res) => {
  const { idea, format = "long", niche = "عام", duration = "10", tone = "مشوّق", audience = "الجمهور العام" } = req.body || {};
  if (!idea || typeof idea !== "string" || idea.trim().length < 5) {
    return res.status(400).json({ error: "اكتب فكرة واضحة لا تقل عن 5 أحرف." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "مفتاح OpenAI غير مضبوط. أضفه في ملف .env ثم أعد تشغيل الموقع." });
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `اكتب سكريبت يوتيوب عربيًا بالعامية المصرية الطبيعية والسلسة.
الفكرة: ${idea.trim()}
نوع الفيديو: ${format === "short" ? "YouTube Shorts عمودي قصير" : "فيديو يوتيوب طويل"}
المجال: ${niche}
المدة المستهدفة بالدقائق: ${duration}
النبرة: ${tone}
الجمهور: ${audience}

المطلوب:
- عنوان جذاب غير مضلل.
- Hook قوي لأول 3-10 ثوانٍ.
- مقدمة قصيرة ووعد واضح للمشاهد.
- سكريبت كامل مقسم إلى مشاهد مرقمة، مع تقدير زمني لكل مشهد.
- اكتب نص التعليق الصوتي باللهجة المصرية، وأضف بين أقواس توجيهات الصورة والمونتاج والمؤثرات الصوتية عند الحاجة.
- انتقالات طبيعية بين الأفكار، ومعلومات دقيقة دون اختلاق حقائق أو إحصاءات أو اقتباسات. إذا كانت الفكرة تحتاج تحققًا، ضع [يحتاج تحقق].
- خاتمة وCTA طبيعي للتفاعل والاشتراك.
- بعد السكريبت: 5 عناوين بديلة، وصف يوتيوب، 10 كلمات مفتاحية، و5 هاشتاجات.
- لا تذكر أنك نموذج ذكاء اصطناعي. اجعل الناتج منظمًا بعناوين واضحة وقابلًا للنسخ والتسجيل.`;
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions: "أنت كاتب سكريبتات يوتيوب محترف ومحرر محتوى مصري. اكتب باللهجة المصرية الطبيعية، وتجنب الحشو والمبالغة والادعاءات غير الموثقة.",
      input: prompt
    });
    res.json({ script: response.output_text || "لم يصل نص من النموذج." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حصل خطأ أثناء توليد السكريبت. راجع إعدادات المفتاح أو جرّب مرة أخرى." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Script Studio يعمل على http://localhost:${port}`));