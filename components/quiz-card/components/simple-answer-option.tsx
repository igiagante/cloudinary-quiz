import React from "react";
import CodeFormatter from "../utils/code-formatter";

interface SingleAnswerOptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  showExplanation: boolean;
  handleSelect: (option: string) => void;
}

const SingleAnswerOption: React.FC<SingleAnswerOptionProps> = ({
  option,
  index,
  isSelected,
  isCorrect,
  isIncorrect,
  showExplanation,
  handleSelect,
}) => {
  const getOptionClass = () => {
    if (!showExplanation) {
      return isSelected
        ? "border-2 border-blue-500 bg-blue-50"
        : "border hover:border-gray-300";
    }

    if (isCorrect) {
      return "border-2 border-green-500 bg-green-50"; // Correct answer
    }

    if (isIncorrect) {
      return "border-2 border-red-500 bg-red-50"; // Incorrect selection
    }

    return "border opacity-70"; // Unselected option
  };

  const getLetterClass = () => {
    if (!showExplanation) {
      return isSelected ? "bg-blue-500 text-white" : "border border-gray-300";
    }

    if (isCorrect) {
      return "bg-green-500 text-white border-0"; // Correct answer
    }

    if (isIncorrect) {
      return "bg-red-500 text-white border-0"; // Incorrect selection
    }

    return "border border-gray-300 opacity-70";
  };

  return (
    <div
      className={`p-3 rounded-md cursor-pointer transition-all quiz-option ${getOptionClass()}`}
      onClick={() => handleSelect(option)}
    >
      <div className="flex items-start w-full">
        <div className="flex items-start w-full">
          <div
            className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full mt-1 ${getLetterClass()}`}
          >
            {String.fromCharCode(65 + index)}
          </div>

          <div className="flex-1 min-w-0 ml-3">
            <CodeFormatter text={option} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleAnswerOption;
