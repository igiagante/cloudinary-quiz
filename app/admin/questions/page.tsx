"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Question = {
  id: string;
  uuid: string;
  question: string;
  topic: string;
  difficulty: string;
  source: string;
  status: string;
  qualityScore: number;
  options: string[];
  correctAnswer: string;
};

export default function QuestionsManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("review");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    fetchQuestions();
    // Fetch available topics for filtering
    fetch("/api/admin/topics")
      .then((res) => res.json())
      .then((data) => setTopics(data.topics))
      .catch((err) => console.error("Error fetching topics:", err));
  }, [activeFilter, topicFilter, sourceFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (activeFilter) params.append("status", activeFilter);
      if (topicFilter) params.append("topic", topicFilter);
      if (sourceFilter) params.append("source", sourceFilter);

      // If viewing deleted questions, include them
      if (activeFilter === "deleted") params.append("includeDeleted", "true");

      const response = await fetch(`/api/questions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionStatus = async (uuid: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/questions/${uuid}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update question status");

      // Update local state
      setQuestions(
        questions.map((q) =>
          q.uuid === uuid ? { ...q, status: newStatus } : q
        )
      );
    } catch (err) {
      console.error("Error updating question status:", err);
      alert("Failed to update question status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "review":
        return "bg-yellow-500";
      case "deleted":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "manual":
        return "bg-blue-500";
      case "openai":
        return "bg-purple-500";
      case "claude":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Question Management</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          Back to Admin
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium">Status</label>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="review">Needs Review</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium">Topic</label>
            <Select
              value={topicFilter || ""}
              onValueChange={(val: string) => setTopicFilter(val || null)}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium">Source</label>
            <Select
              value={sourceFilter || ""}
              onValueChange={(val: string) => setSourceFilter(val || null)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {questions.length} Questions
            {loading && (
              <span className="ml-2 text-gray-500 text-sm">Loading...</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {questions.length === 0 && !loading ? (
            <div className="text-center py-6 text-gray-500">
              No questions found matching the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.uuid}>
                      <TableCell className="max-w-xs truncate">
                        {question.question}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {question.topic.split(",")[0]}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSourceColor(question.source)}>
                          {question.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(question.status)}>
                          {question.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={getQualityScoreColor(question.qualityScore)}
                      >
                        {(question.qualityScore * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {question.status !== "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuestionStatus(question.uuid, "active")
                              }
                            >
                              Approve
                            </Button>
                          )}
                          {question.status !== "review" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuestionStatus(question.uuid, "review")
                              }
                            >
                              Review
                            </Button>
                          )}
                          {question.status !== "deleted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500"
                              onClick={() =>
                                updateQuestionStatus(question.uuid, "deleted")
                              }
                            >
                              Delete
                            </Button>
                          )}
                          {question.status === "deleted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuestionStatus(question.uuid, "active")
                              }
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
