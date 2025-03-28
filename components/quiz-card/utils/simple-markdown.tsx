import React from "react";

// Utility functions for handling markdown text

/**
 * Process markdown text to convert it to HTML
 */
export const processMarkdownText = (text: string): string => {
  // Type safety check to handle non-string inputs
  if (typeof text !== "string") {
    return String(text || ""); // Convert non-string to string or empty string if null/undefined
  }

  // Replace any triple backtick markdown code blocks
  let processedText = text.replace(
    /```(?:javascript|js)?\n([\s\S]*?)```/g,
    (match, code) => {
      return `<div class="my-2 rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e] p-4">
      <pre class="text-white font-mono text-sm" style="margin: 0">
        <code>${code.trim()}</code>
      </pre>
    </div>`;
    }
  );

  return (
    processedText
      // Convert markdown links: [text](url)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>'
      )
      // Convert bold: **text**
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // Convert italic: *text*
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // Handle inline code - only convert if it appears to be code
      .replace(/`([^`]+)`/g, (match, p1) => {
        const isLikelyCode =
          p1.includes(":") ||
          p1.includes("=") ||
          p1.includes("(") ||
          p1.includes(".") ||
          p1.includes("function") ||
          p1.includes("const");

        if (isLikelyCode) {
          return `<code class="bg-gray-800 text-gray-100 px-1 rounded text-sm font-mono">${p1}</code>`;
        } else {
          return `<code class="bg-gray-100 px-1 rounded text-sm font-mono">${p1}</code>`;
        }
      })
  );
};

/**
 * Simple markdown text renderer component
 */
const SimpleMarkdown: React.FC<{ children: string }> = ({ children }) => {
  // Add safety check for non-string children
  if (typeof children !== "string") {
    return <div>{String(children || "")}</div>;
  }

  // Check if text looks like it contains the triple backtick issue in explanations
  if (children.includes("```javascript") || children.includes("```js")) {
    // Process the markdown text directly without split/join
    const html = processMarkdownText(children);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // For text without code blocks or already fixed, process normally
  const html = processMarkdownText(children);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default SimpleMarkdown;
