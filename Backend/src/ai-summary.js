const { GoogleGenAI } = require("@google/genai");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../../.env")
});

const rules = require("./rules.json");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});


const SYSTEM_INSTRUCTION = `
You are an AI analysis assistant for a Legal Metrology
packaged commodity inspection system.

Your role is ONLY to convert the deterministic Rule Engine
result into a clear, professional inspection report.

The Rule Engine is the authoritative source for compliance
status and configured rules.

IMPORTANT RULES:

1. NEVER make your own legal compliance decisions.

2. NEVER create, modify, infer, or assume legal rules.

3. NEVER change a Rule Engine status.

4. NEVER convert POTENTIAL_NON_COMPLIANCE into confirmed
   non-compliance.

5. NEVER convert NEEDS_REVIEW into PASS.

6. NEVER invent missing information.

7. ONLY use the information provided in the input.

8. Explain the evidence returned by the Rule Engine.

9. Clearly distinguish:
   - PASS
   - POTENTIAL_NON_COMPLIANCE
   - NEEDS_REVIEW

10. If a finding is ambiguous or questionable, clearly state
    that it requires verification by the inspecting officer.

11. The final legal decision remains with the authorized
    Legal Metrology inspector.

12. Do not provide legal advice.

13. Do not add legal requirements that are not present in
    the supplied rules.

Return only the requested structured JSON report.
`;


async function generateSummary(ruleEngineResult) {

  const category = ruleEngineResult.category;
  const subcategory = ruleEngineResult.subcategory;

  let applicableRules = null;

  if (
    rules.categories &&
    rules.categories[category] &&
    rules.categories[category].subcategories
  ) {
    applicableRules =
      rules.categories[category]
        .subcategories[subcategory] || null;
  }


  const prompt = `
Generate a professional inspection analysis from the
following deterministic Rule Engine result.

RULE ENGINE RESULT:

${JSON.stringify(ruleEngineResult, null, 2)}


APPLICABLE RULES FROM rules.json:

${JSON.stringify(applicableRules, null, 2)}


INSTRUCTIONS:

- The Rule Engine result is authoritative.
- Do not change any Rule Engine status.
- Do not invent rules.
- Do not invent evidence.
- Do not make a final legal determination.
- Explain the findings clearly.
- Explain potential issues.
- Identify items requiring officer verification.
- If evidence is ambiguous, explicitly say so.

Generate the report using the required JSON structure.
`;


  const response = await ai.models.generateContent({

    model: "gemini-3.6-flash",

    contents: prompt,

    config: {

      systemInstruction: SYSTEM_INSTRUCTION,

      thinkingConfig: {
        thinkingLevel: "low"
      },

      responseMimeType: "application/json",

      responseSchema: {
        type: "object",

        properties: {

          inspection_summary: {
            type: "string"
          },

          overall_assessment: {
            type: "string",
            enum: [
              "PASS",
              "POTENTIAL_NON_COMPLIANCE",
              "NEEDS_REVIEW"
            ]
          },

          key_findings: {
            type: "array",

            items: {
              type: "object",

              properties: {

                type: {
                  type: "string",
                  enum: [
                    "PASS",
                    "POTENTIAL_NON_COMPLIANCE",
                    "NEEDS_REVIEW"
                  ]
                },

                title: {
                  type: "string"
                },

                description: {
                  type: "string"
                }

              },

              required: [
                "type",
                "title",
                "description"
              ]
            }
          },

          officer_attention: {
            type: "array",

            items: {
              type: "string"
            }
          },

          limitations: {
            type: "array",

            items: {
              type: "string"
            }
          }

        },

        required: [
          "inspection_summary",
          "overall_assessment",
          "key_findings",
          "officer_attention",
          "limitations"
        ]
      }
    }
  });


  return JSON.parse(response.text);
}


module.exports = {
  generateSummary
};