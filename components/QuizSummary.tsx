import React from "react";

interface TopicPerformance {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

interface QuizSummaryProps {
  topicPerformance: Record<string, TopicPerformance>;
  totalScore: {
    correct: number;
    total: number;
    percentage: number;
  };
  passThreshold: number;
}

const QuizSummary: React.FC<QuizSummaryProps> = ({
  topicPerformance,
  totalScore,
  passThreshold = 80,
}) => {
  const passed = totalScore.percentage >= passThreshold;

  // Order topics to match certification order
  const orderedTopics = [
    "Products, Value, Environment Settings, and Implementation Strategies",
    "System Architecture",
    "Media Lifecycle Strategy and Emerging Trends",
    "Widgets, Out of Box Add-ons, Custom Integrations",
    "Upload and Migrate Assets",
    "Transformations",
    "Media Management",
    "User, Role, and Group Management and Access Controls",
  ];

  return (
    <div className="quiz-summary bg-white p-6 rounded-lg shadow-md">
      <div
        className={`result-header p-6 text-center text-white mb-6 ${
          passed ? "bg-green-600" : "bg-blue-900"
        }`}
      >
        <h2 className="text-2xl font-bold mb-2">
          {passed
            ? "Congratulations! You passed!"
            : "You didn't pass this time."}
        </h2>
        <p className="text-lg">
          {passed
            ? "You've successfully completed the Cloudinary certification quiz."
            : "Review your performance in each area below to help tailor your studying."}
        </p>
      </div>

      <div className="completion-info flex justify-between mb-8">
        <div>
          Completed: {new Date().toLocaleDateString()}{" "}
          {new Date().toLocaleTimeString()}
        </div>
        <div>Duration: {/* Add duration calculation */}</div>
      </div>

      <h3 className="text-2xl font-bold mb-4">Breakdown</h3>

      <div className="topic-breakdown">
        {orderedTopics.map((topic, index) => {
          const performance = topicPerformance[topic] || {
            correct: 0,
            total: 0,
            percentage: 0,
          };

          return (
            <div
              key={topic}
              className="topic-row flex items-center justify-between p-4 bg-gray-100 mb-2 rounded"
            >
              <div className="topic-name flex-grow">
                <span className="font-medium">
                  {index + 1}. {topic}
                </span>
              </div>
              <div className="score-info flex items-center">
                <span className="score mr-4">
                  {performance.correct} / {performance.total}
                </span>
                <span
                  className={`percentage rounded-full px-3 py-1 text-sm ${
                    performance.percentage >= passThreshold
                      ? "bg-green-200"
                      : "bg-red-200"
                  }`}
                >
                  {Math.round(performance.percentage)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="total-score mt-8 text-center">
        <div className="text-xl">
          Overall Score:{" "}
          <span className="font-bold">
            {totalScore.correct} / {totalScore.total} (
            {Math.round(totalScore.percentage)}%)
          </span>
        </div>
        <div className="mt-2 text-lg">
          {passed
            ? "You've passed! You'll receive your certification details via email."
            : "You need at least 80% to pass. Keep studying and try again!"}
        </div>
      </div>
    </div>
  );
};

export default QuizSummary;
