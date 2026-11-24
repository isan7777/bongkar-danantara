import type { Metadata } from "next";
import {
  getPlatformStats,
  listArticles,
  listDocuments,
  listEntities,
  listRightOfReplies,
  listUnansweredQuestions,
} from "@/lib/db/queries";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Meja Redaksi & Dashboard Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const stats = getPlatformStats();
  // Privileged whistleblower reports & draft articles are NEVER embedded in unauthenticated HTML;
  // they are fetched client-side via authenticated /api/* endpoints after HMAC session login.
  const publicArticles = listArticles({ includeDrafts: false });
  const documents = listDocuments();
  const entities = listEntities();
  const replies = listRightOfReplies(false);
  const questions = listUnansweredQuestions();

  return (
    <AdminDashboardClient
      initialStats={stats}
      initialArticles={publicArticles}
      initialDocuments={documents}
      initialEntities={entities}
      initialReplies={replies}
      initialQuestions={questions}
    />
  );
}
