import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-config-prettier";

const TOOLING_DIRECTIVE = /^\s*(eslint|global|prettier|@ts-|@jsx|@vitest|c8|v8|istanbul|webpack)/;

/**
 * Local ESLint plugin enforcing the Mosaic documentation convention.
 *
 * Only JSDoc block comments are allowed. Line comments and plain block
 * comments are rejected, except for known tooling directives.
 */
const mosaic = {
  rules: {
    "no-non-jsdoc-comments": {
      meta: {
        type: "suggestion",
        docs: { description: "Disallow comments other than JSDoc blocks." },
        schema: [],
        messages: {
          line: "Line comments are not allowed; document with JSDoc (/** */).",
          block: "Only JSDoc (/** */) block comments are allowed.",
        },
      },
      create(context) {
        const sourceCode = context.sourceCode;
        return {
          Program() {
            for (const comment of sourceCode.getAllComments()) {
              if (TOOLING_DIRECTIVE.test(comment.value)) {
                continue;
              }
              if (comment.type === "Line") {
                context.report({ loc: comment.loc, messageId: "line" });
              } else if (comment.type === "Block" && !comment.value.startsWith("*")) {
                context.report({ loc: comment.loc, messageId: "block" });
              }
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { mosaic, jsdoc },
    rules: {
      "mosaic/no-non-jsdoc-comments": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
          contexts: [
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression",
          ],
        },
      ],
      "jsdoc/require-description": ["error", { descriptionStyle: "body" }],
      "jsdoc/require-param-description": "error",
      "jsdoc/require-returns-description": "error",
    },
  },
  prettier,
]);

export default eslintConfig;
