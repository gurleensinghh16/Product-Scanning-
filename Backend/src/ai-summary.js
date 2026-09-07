const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const SYSTEM_INSTRUCTION = `
You are an AI assistant for a Legal Metrology packaged commodity
inspection system.

Your job is to convert the results produced by a deterministic
Rule Engine into a clear and professional inspection summary.         

IMPORTANT RULES:

1. Do NOT make your own legal compliance decisions.
2. Do NOT create, modify, or assume legal rules.
3. Do NOT invent missing information.
4. Do NOT override the Rule Engine result.
5. Only explain the findings provided by the Rule Engine.
6. Clearly distinguish between PASS, POTENTIAL_NON_COMPLIANCE,
   and NEEDS_REVIEW.
7. For failed or questionable checks, explain the evidence provided.
8. Keep the explanation professional and suitable for an
   official inspection report.
9. The final legal decision remains with the authorized
   Legal Metrology inspector.

Return only the inspection summary.
`;

async function generateSummary(ruleEngineResult) {
  const prompt = `
Generate a concise inspection summary from the following
Rule Engine result.

Rule Engine Result:
${JSON.stringify(ruleEngineResult, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: {
        thinkingLevel: "low"
      }
    }
  });

  return response.text;
}


// Temporary test
async function testAI() {
  try {
    const filePath = path.join(
      __dirname,
      "../test-data/test_rule_result.json"
    );

    const ruleEngineResult = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    );

    console.log("Sending Rule Engine result to Gemini...\n");

    const summary = await generateSummary(ruleEngineResult);

    console.log("========== AI SUMMARY ==========\n");
    console.log(summary);
    console.log("\n================================");
  } catch (error) {
    console.error("AI Summary Error:");
    console.error(error);
  }
}

testAI();

module.exports = {
  generateSummary
};