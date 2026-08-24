"use client";

import { Suspense, useState } from "react";
import StudyQuizSidebar, {
  useStudyParams,
  type CourseTier,
  type TopicItem,
  type SubtopicItem,
} from "@/components/StudyQuizSidebar";
import StudyQuizView from "@/components/StudyQuizView";

function StudySessionInner() {
  const { domainId } = useStudyParams();
  const [selectedCourse, setSelectedCourse] = useState<CourseTier | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<SubtopicItem | null>(
    null
  );
  const [subtopicQueue, setSubtopicQueue] = useState<SubtopicItem[]>([]);
  const [allTopicsDone, setAllTopicsDone] = useState(false);
  const [isSubmittingSubtopic, setIsSubmittingSubtopic] = useState(false);
  const [submitSubtopicError, setSubmitSubtopicError] = useState("");

  async function handleSubmitSubtopic() {
    if (!selectedSubtopic || isSubmittingSubtopic) return;

    setIsSubmittingSubtopic(true);
    setSubmitSubtopicError("");

    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/progress/subtopics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            subtopicId: selectedSubtopic.id,
            completed: true,
          }),
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to mark subtopic as complete."
        );
      }

      const currentIndex = subtopicQueue.findIndex(
        (s) => s.id === selectedSubtopic.id
      );
      const next = currentIndex >= 0 ? subtopicQueue[currentIndex + 1] : null;

      if (!next) {
        setSelectedSubtopic(null);
        setAllTopicsDone(true);
        return;
      }

      setAllTopicsDone(false);
      setSelectedTopic({
        id: next.topic_id,
        topic_name: next.topic_name,
        course_id: selectedCourse?.id ?? next.topic_id,
        course_name: selectedCourse?.course_name ?? "",
      });
      setSelectedSubtopic(next);
    } catch (error) {
      setSubmitSubtopicError(
        error instanceof Error
          ? error.message
          : "Unable to submit subtopic progress."
      );
    } finally {
      setIsSubmittingSubtopic(false);
    }
  }

  const currentQueueIndex = selectedSubtopic
    ? subtopicQueue.findIndex((s) => s.id === selectedSubtopic.id)
    : -1;
  const hasNextSubtopic =
    currentQueueIndex >= 0 && currentQueueIndex < subtopicQueue.length - 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F2F0E4] lg:flex-row">
      <StudyQuizSidebar
        domainId={domainId}
        selectedCourseId={selectedCourse?.id ?? null}
        onCourseChange={(course) => {
          setSelectedCourse(course);
          setSelectedTopic(null);
          setSelectedSubtopic(null);
          setSubtopicQueue([]);
          setAllTopicsDone(false);
        }}
        selectedTopicId={selectedTopic?.id || null}
        onTopicChange={(topic) => {
          if (!topic.id) {
            setSelectedTopic(null);
            setSelectedSubtopic(null);
            return;
          }
          setSelectedTopic(topic);
          setAllTopicsDone(false);
        }}
        selectedSubtopicId={selectedSubtopic?.id ?? null}
        onSubtopicChange={(sub) => {
          setSelectedSubtopic(sub);
          setAllTopicsDone(false);
        }}
        onSubtopicQueueChange={setSubtopicQueue}
        onAllSubtopicsComplete={setAllTopicsDone}
      />
      <StudyQuizView
        domainId={domainId}
        courseId={selectedCourse?.id ?? null}
        courseName={selectedCourse?.course_name ?? ""}
        topicId={selectedTopic?.id || null}
        topicName={selectedTopic?.topic_name || "Topic"}
        topicTag={(selectedTopic?.topic_name || "TOPIC").toUpperCase()}
        subtopicId={selectedSubtopic?.id ?? null}
        subtopicName={selectedSubtopic?.subtopic_name ?? null}
        hasNextSubtopic={hasNextSubtopic}
        allSubtopicsDone={allTopicsDone}
        isSubmittingSubtopic={isSubmittingSubtopic}
        submitSubtopicError={submitSubtopicError}
        onSubmitSubtopic={handleSubmitSubtopic}
      />
    </div>
  );
}

export default function StudySession() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 flex-col bg-[#F2F0E4] p-6">
          <p className="text-sm text-black/70">Loading quiz...</p>
        </div>
      }
    >
      <StudySessionInner />
    </Suspense>
  );
}
