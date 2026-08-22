const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function reviewCode(files) {

    const codeChanges = files
        .filter(file => file.patch)
        .map(file => `
FILE: ${file.filename}

STATUS: ${file.status}

DIFF:
${file.patch}
`)
        .join("\n\n");

    const prompt = `
You are a senior software engineer performing a GitHub Pull Request code review.

Analyze the following code changes carefully.

Look specifically for:

1. Bugs
2. Security vulnerabilities
3. Performance problems
4. Bad error handling
5. Code quality issues
6. Maintainability problems
7. Edge cases

IMPORTANT RULES:

- Only report genuine, actionable problems.
- Do not report harmless formatting or stylistic differences.
- Do not invent issues that are not supported by the diff.
- Base every finding on evidence from the changed code.
- If there are no meaningful issues, return an empty findings array.
- Keep explanations concise but useful.
- The line number should refer to the approximate changed line when possible.

For each issue provide:

- severity: HIGH, MEDIUM, or LOW
- category
- file
- line
- title
- explanation
- suggestion

Also provide an overall score from 0 to 100.

A higher score means the PR is safer and has better code quality.

CODE CHANGES:

${codeChanges}
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",

        contents: prompt,

        config: {
            responseMimeType: "application/json",

            responseSchema: {
                type: "object",

                properties: {
                    score: {
                        type: "integer",
                        description: "Overall code quality and safety score from 0 to 100."
                    },

                    risk: {
                        type: "string",
                        enum: ["LOW", "MEDIUM", "HIGH"],
                        description: "Overall risk level of the pull request."
                    },

                    summary: {
                        type: "string",
                        description: "Short overall summary of the code review."
                    },

                    findings: {
                        type: "array",

                        items: {
                            type: "object",

                            properties: {
                                severity: {
                                    type: "string",
                                    enum: ["HIGH", "MEDIUM", "LOW"]
                                },

                                category: {
                                    type: "string",
                                    description: "Bug, Security, Performance, Error Handling, Code Quality, Maintainability, or Edge Case."
                                },

                                file: {
                                    type: "string"
                                },

                                line: {
                                    type: "integer",
                                    description: "Approximate changed line number."
                                },

                                title: {
                                    type: "string"
                                },

                                explanation: {
                                    type: "string"
                                },

                                suggestion: {
                                    type: "string"
                                }
                            },

                            required: [
                                "severity",
                                "category",
                                "file",
                                "line",
                                "title",
                                "explanation",
                                "suggestion"
                            ]
                        }
                    }
                },

                required: [
                    "score",
                    "risk",
                    "summary",
                    "findings"
                ]
            }
        }
    });

    return JSON.parse(response.text);
}

module.exports = {
    reviewCode
};