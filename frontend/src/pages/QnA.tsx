import { PageHeader } from "../components/ui";
import QnAFeed from "../components/QnAFeed";

export default function QnA() {
  return (
    <>
      <PageHeader title="Questions & Answers" subtitle="Ask a question and receive an answer with references from a verified scholar." />
      <div className="container-page max-w-3xl py-8">
        <QnAFeed />
      </div>
    </>
  );
}
