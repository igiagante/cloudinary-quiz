import React from "react";
import SimpleMarkdown from "./simple-markdown";

interface FormatOptions {
  optionLetter: string;
  code: string;
}

/**
 * Extract option letter (A-D) if present at the beginning of the option text
 */
export const formatCodeForDisplay = (text: string): FormatOptions => {
  // If the option starts with A), B), C), etc., extract the letter
  // Check if text is a string before calling match
  if (typeof text !== "string") {
    return {
      optionLetter: "",
      code: String(text || ""), // Convert non-string to string or empty string if null/undefined
    };
  }

  // Now safely use match on the string
  const letterMatch = text.match(/^([A-D]\))\s*(.*)/);
  if (letterMatch) {
    return {
      optionLetter: letterMatch[1],
      code: letterMatch[2],
    };
  }
  return {
    optionLetter: "",
    code: text,
  };
};

/**
 * Highlight code syntax using custom HTML/CSS approach
 */
export const highlightSyntax = (code: string): string => {
  let highlightedCode = code
    .split("\n")
    .map((line) => line.trim()) // Trim each line
    .join("\n"); // Rejoin with single newlines

  // Replace strings with spans (must be done first to avoid conflicts)
  highlightedCode = highlightedCode
    .replace(/"([^"]*)"/g, '<span class="str">"$1"</span>')
    .replace(/'([^']*)'/g, "<span class=\"str\">'$1'</span>");

  // Replace specific keywords
  highlightedCode = highlightedCode
    .replace(/\bcloudinary\b/g, '<span class="cloudinary">cloudinary</span>')
    .replace(/\.url\b/g, '.<span class="url">url</span>')
    .replace(/\.effect\b/g, '.<span class="effect">effect</span>')
    .replace(/\.radius\b/g, '.<span class="radius">radius</span>')
    .replace(/\.border\b/g, '.<span class="border">border</span>')
    .replace(/\.image\b/g, '.<span class="border">image</span>')
    .replace(
      /\b(const|let|var|function|return|if|else)\b/g,
      '<span class="keyword">$1</span>'
    )
    .replace(/\b(\d+)\b/g, '<span class="num">$1</span>')
    .replace(
      /\b(transformation|effect|radius|border)\b:/g,
      '<span class="property">$1</span>:'
    );

  return highlightedCode;
};

/**
 * Format code option for display, with detection of code blocks
 */
const CodeFormatter = ({ text }: { text: string }) => {
  if (typeof text !== "string") {
    return <span>{String(text || "")}</span>;
  }

  const { optionLetter, code } = formatCodeForDisplay(text);

  // Clean up any markdown formatting decorators and normalize whitespace
  let cleanedCode = code
    .replace(/```(?:javascript|js|typescript|ts)?|```/g, "") // Remove markdown code block markers
    .replace(/^\s+|\s+$/gm, "") // Remove leading/trailing whitespace from each line
    .replace(/\n{2,}/g, "\n") // Replace multiple newlines with single newlines
    .replace(/[ \t]+$/gm, "") // Remove trailing spaces/tabs from each line
    .trim();

  // Check if this is the specific problematic format showing HTML tags
  const containsHtmlTags =
    cleanedCode.includes('"keyword">') ||
    cleanedCode.includes('"property">') ||
    cleanedCode.includes('"string">');

  if (containsHtmlTags) {
    const cleanText = cleanedCode
      .replace(/"keyword">/g, "")
      .replace(/"property">/g, "")
      .replace(/"string">/g, "")
      .replace(/"number">/g, "")
      .trim();

    return (
      <div className="w-full">
        <div className="rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e] code-block">
          <pre className="text-white font-mono text-sm whitespace-pre m-0 p-3">
            <code className="block">{cleanText}</code>
          </pre>
        </div>
      </div>
    );
  }

  // More precise detection for JavaScript code that needs displaying as code
  const isCodeSnippet =
    (cleanedCode.includes("cloudinary") ||
      cleanedCode.includes("cl_video_tag") ||
      cleanedCode.includes("cl.") ||
      cleanedCode.includes(".url(") ||
      cleanedCode.includes(".effect(") ||
      cleanedCode.includes(".radius(") ||
      cleanedCode.includes(".border(") ||
      cleanedCode.includes(".image(") ||
      (cleanedCode.includes("const") && cleanedCode.includes("=")) ||
      (cleanedCode.includes("transformation:") && cleanedCode.includes("[")) ||
      (cleanedCode.includes("quality:") && cleanedCode.includes("format:")) ||
      (cleanedCode.includes("fetch_format:") &&
        cleanedCode.includes("'auto'"))) &&
    cleanedCode.length > 10;

  if (!isCodeSnippet) {
    return <SimpleMarkdown>{text}</SimpleMarkdown>;
  }

  // Apply syntax highlighting
  return (
    <div className="w-full">
      <div className="rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e] code-block">
        <pre className="text-white font-mono text-sm whitespace-pre m-0 p-3">
          <code
            className="block"
            dangerouslySetInnerHTML={{ __html: highlightSyntax(cleanedCode) }}
          />
        </pre>
      </div>
    </div>
  );
};

export default CodeFormatter;
