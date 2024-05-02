"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import Markdown from "react-markdown";
export default function ChatContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading1, setIsLoading1] = useState(false);
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [repo, setRepo] = useState("");
  const handleSubmit1 = async (e: any) => {
    e.preventDefault();

    if (isLoading1) {
      return null;
    }

    setIsLoading1(true);

    try {
      const res = await fetch(`/api/build-e`, {
        method: "POST",
        body: JSON.stringify({
          repo,
        }),
      });

      if (!res.ok) {
        return null;
      }

      const result = await res.json();
      toast.success("Built!");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }

    setIsLoading1(false);
  };

  const addMessage = (content: string, type: "Human" | "AI") => {
    setHistory((history) => [...history, { content, type }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) {
      return null;
    }

    setQuestion("");
    addMessage(question, "Human");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/chat`, {
        method: "POST",
        body: JSON.stringify({
          question,
          history,
        }),
      });

      if (!res.ok) {
        return null;
      }

      const { result } = await res.json();

      addMessage(result, "AI");
    } catch (err) {}

    setIsLoading(false);
  };

  return (
    <main className="flex-1 container bg-white mx-auto max-w-3xl flex flex-col">
      <Toaster position="top-center" richColors />
      <div className="flex border border-gray-700 py-10 rounded-md shadow-xl px-10  flex-col gap-7 mb-52">
        <div className="max-w-4xl py-4 px-4 sm:px-6 lg:px-8 mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl ">
            RAG Code Chat
          </h1>
          <p className="mt-3 text-gray-600 ">
            Chatbot Based On RAG and Custom Code
          </p>
        </div>
        <div className="">
          <input
            type="text"
            value={repo}
            className="input input-bordered w-full bg-gray-100  rounded-md border border-gray-900 p-2"
            placeholder="Enter Repo URL"
            onChange={(e) => setRepo(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading1}
            onClick={handleSubmit1}
            className="w-full text-center bg-gray-800 rounded-md text-white p-2 my-2"
          >
            {isLoading1 ? "Building..." : "Build"}
          </button>
        </div>
        {history.map((message, index) => {
          return (
            <div
              key={index}
              className={
                message.type === "Human"
                  ? " bg-gray-800 text-white p-3 rounded-md"
                  : " bg-gray-100 text-gray-700 rounded-md p-3"
              }
            >
              <div className={""}>
                <Markdown>{message.content}</Markdown>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed left-0 bottom-0 w-full bg-neutral shadow-md bg-gray-900 border-t border-neutral-500">
        <form
          onSubmit={handleSubmit}
          className="container max-w-3xl mx-auto flex gap-3 pt-7 pb-10"
        >
          <input
            type="text"
            value={question}
            className="input input-bordered w-full bg-gray-100  rounded-md border border-gray-900 p-2"
            disabled={isLoading}
            placeholder="Type your question here..."
            onChange={(e) => setQuestion(e.target.value)}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex flex-shrink-0 justify-center items-center size-8 rounded-lg text-white bg-gray-800 hover:bg-gray-500 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isLoading ? (
              <span className="loading" />
            ) : (
              <svg
                className="flex-shrink-0 size-3.5"
                xmlns="http://www.w3.org/2000/svg"
                width={16}
                height={16}
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
