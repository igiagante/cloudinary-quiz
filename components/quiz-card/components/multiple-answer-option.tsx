import React from "react";
import CodeFormatter from "../utils/code-formatter";

interface MultipleAnswerOptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  showExplanation: boolean;
  handleSelect: (option: string) => void;
}

const MultipleAnswerOption: React.FC<MultipleAnswerOptionProps> = ({
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

  return (
    <div
      className={`p-3 rounded-md cursor-pointer transition-all quiz-option ${getOptionClass()}`}
      onClick={() => handleSelect(option)}
    >
      <div className="flex items-start w-full">
        <div className="flex items-start w-full">
          {/* Checkbox UI for multiple answer questions */}
          <div className="flex-shrink-0 mt-1">
            <div
              className={`w-5 h-5 border ${
                isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
              } rounded flex items-center justify-center`}
            >
              {isSelected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Letter indicator */}
          <div className="flex-shrink-0 w-6 text-center ml-2">
            {String.fromCharCode(65 + index)})
          </div>

          {/* Option content */}
          <div className="flex-1 min-w-0 ml-2">
            <CodeFormatter text={option} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleAnswerOption;
