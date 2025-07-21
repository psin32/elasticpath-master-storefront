import React, { useState } from "react";
import { Extensions } from "@elasticpath/js-sdk";
import { useCompletion } from "ai/react";

interface ChatMessage {
  question: string;
  answer?: string;
  isStreaming?: boolean;
}

export function SmartQuestionsBot({
  extensions,
  productDescription,
}: {
  extensions: Extensions;
  productDescription: string;
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");

  const { complete } = useCompletion({
    api: "/api/smartie",
    onFinish: (_, completion) => {
      setChatHistory((prev) => {
        const lastIndex = prev.length - 1;
        const updatedHistory = [...prev];
        updatedHistory[lastIndex] = {
          ...updatedHistory[lastIndex],
          answer: completion,
          isStreaming: false,
        };
        return updatedHistory;
      });
    },
  });

  const questionTemplate = extensions["products(product-questions-template)"];
  const questions = [
    questionTemplate?.["question-1"],
    questionTemplate?.["question-2"],
    questionTemplate?.["question-3"],
  ].filter(Boolean);

  const askQuestion = async (question: string) => {
    setChatHistory((prev) => [...prev, { question, isStreaming: true }]);
    setIsPopupOpen(true);

    try {
      await complete("", {
        body: {
          question,
          productContext: productDescription + " " + JSON.stringify(extensions),
        },
      });
    } catch (error) {
      console.error("Error asking question:", error);
      setChatHistory((prev) => {
        const lastIndex = prev.length - 1;
        const updatedHistory = [...prev];
        updatedHistory[lastIndex] = {
          ...updatedHistory[lastIndex],
          answer: "Sorry, I encountered an error. Please try again.",
          isStreaming: false,
        };
        return updatedHistory;
      });
    }
  };

  const handleQuestionClick = (question: string) => {
    askQuestion(question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    askQuestion(inputValue);
    setInputValue("");
  };

  return (
    <>
      <div className="my-8">
        <div className="flex flex-col gap-3">
          {questions.map((question: any, index) => (
            <button
              key={index}
              onClick={() => handleQuestionClick(question)}
              className="bg-sky-50 text-brand-primary p-4 rounded-3xl inline-block max-w-fit hover:bg-sky-100 text-left"
            >
              {question}
            </button>
          ))}
          <div className="text-right">
            <button
              onClick={() => setIsPopupOpen(true)}
              className="bg-brand-primary text-white px-6 py-3 rounded-full hover:bg-brand-highlight transition-colors"
            >
              ✧ Need help? Ask sMartie
            </button>
          </div>
        </div>
      </div>

      {/* Chat Popup */}
      {isPopupOpen && (
        <div className="fixed bottom-4 left-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-orange-500">✧</span>
              <h3 className="font-semibold">Ask sMartie</h3>
            </div>
            <button
              onClick={() => setIsPopupOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Chat Messages */}
          <div className="p-4 h-96 overflow-y-auto flex flex-col gap-3">
            {chatHistory.map((msg, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="bg-sky-50 text-brand-primary p-3 rounded-3xl self-end max-w-[80%]">
                  {msg.question}
                </div>
                {(msg.answer || msg.isStreaming) && (
                  <div className="bg-gray-100 p-3 rounded-3xl self-start max-w-[80%]">
                    {msg.answer || (
                      <div className="flex gap-1">
                        <div className="animate-bounce">.</div>
                        <div className="animate-bounce delay-100">.</div>
                        <div className="animate-bounce delay-200">.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask sMartie a question..."
                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                className="bg-brand-primary text-white px-4 py-2 rounded-full hover:bg-brand-primary/80"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
