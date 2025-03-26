"use client";

import React, { useState } from "react";
import Highlight from "react-highlight";
import "highlight.js/styles/vs2015.css"; // Dark theme

const CodeDisplay = () => {
  const [displayFormat, setDisplayFormat] = useState("extracted");

  // The exact sample from screenshot - adaptive streaming
  const sampleCode = `adaptiveStreaming: ['hls', 'dash']`;

  // Additional examples from the quiz
  const videoExamples = [
    {
      name: "adaptiveStreaming array",
      code: `adaptiveStreaming: ['hls', 'dash']`,
    },
    {
      name: "streaming boolean",
      code: `streaming: true`,
    },
    {
      name: "sourceTypes array",
      code: `sourceTypes: ['hls', 'dash']`,
    },
    {
      name: "adaptive boolean",
      code: `adaptive: true`,
    },
  ];

  return (
    <div className="code-container">
      <h2 className="text-2xl font-bold mb-4">Video Streaming Examples</h2>

      <div className="format-controls">
        <label className="block mb-2 font-medium">Display Format:</label>
        <div>
          <input
            type="radio"
            id="extracted"
            name="format"
            value="extracted"
            checked={displayFormat === "extracted"}
            onChange={() => setDisplayFormat("extracted")}
          />
          <label htmlFor="extracted" className="ml-2">
            Extracted Code
          </label>
        </div>
        <div className="mt-2">
          <input
            type="radio"
            id="raw"
            name="format"
            value="raw"
            checked={displayFormat === "raw"}
            onChange={() => setDisplayFormat("raw")}
          />
          <label htmlFor="raw" className="ml-2">
            Raw Text
          </label>
        </div>
      </div>

      {displayFormat === "extracted" ? (
        <div className="code-block mt-6">
          <h3 className="text-lg font-semibold mb-2">Option from Screenshot</h3>
          <div className="option-letter">A)</div>
          <Highlight className="javascript">{sampleCode}</Highlight>

          <h3 className="text-lg font-semibold mb-2 mt-8">
            All Video Streaming Options
          </h3>
          <div className="space-y-6">
            {videoExamples.map((example, index) => (
              <div key={index} className="border border-gray-700 rounded p-4">
                <div className="option-letter">
                  {String.fromCharCode(65 + index)})
                </div>
                <div className="mt-2">
                  <Highlight className="javascript">{example.code}</Highlight>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="raw-text mt-6">
          <h3 className="text-lg font-semibold mb-2">Raw Options</h3>
          <div className="option-letter">A)</div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm whitespace-pre-wrap break-words">
            {sampleCode}
          </pre>

          <h3 className="text-lg font-semibold mb-2 mt-8">All Raw Options</h3>
          <div className="space-y-4">
            {videoExamples.map((example, index) => (
              <div key={index} className="border border-gray-700 rounded p-4">
                <div className="option-letter">
                  {String.fromCharCode(65 + index)})
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm whitespace-pre-wrap break-words">
                  {example.code}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .code-container {
          max-width: 800px;
          margin: 0 auto;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          padding: 1rem;
        }

        .format-controls {
          margin: 20px 0;
        }

        .code-block,
        .raw-text {
          margin-top: 20px;
          border: 1px solid #333;
          border-radius: 8px;
          overflow: hidden;
          padding: 16px;
        }

        .option-letter {
          font-weight: bold;
          margin-bottom: 10px;
        }

        pre {
          white-space: pre-wrap;
          word-break: break-word;
          font-family: "Consolas", "Monaco", "Andale Mono", monospace;
        }

        input[type="radio"] {
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
};

export default CodeDisplay;
