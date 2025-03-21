import React from "react";
import { TopicPerformance } from "@/types";

interface TopicBreakdownProps {
  topicPerformance: TopicPerformance[];
}

export default function TopicBreakdown({
  topicPerformance,
}: TopicBreakdownProps) {
  // Sort topics by performance (ascending)
  const sortedTopics = [...topicPerformance].sort(
    (a, b) => a.percentage - b.percentage
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium mb-4">Performance by Topic</h3>

      <div className="space-y-6">
        {sortedTopics.map((topic) => (
          <div key={topic.topic}>
            <div className="flex justify-between mb-1">
              <span className="font-medium">{topic.topic}</span>
              <span className="text-gray-600">
                {topic.correct} / {topic.total} ({topic.percentage.toFixed(0)}%)
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  topic.percentage >= 80
                    ? "bg-green-500"
                    : topic.percentage >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${topic.percentage}%` }}
              ></div>
            </div>

            {topic.percentage < 70 && (
              <p className="mt-1 text-sm text-red-600">
                This topic needs improvement.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
