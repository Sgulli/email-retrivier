"use client";

import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-ui/v2/styles.css";
import { AuthGuard } from "@/components/auth-guard";
import { EmailToolRenderers } from "@/components/email-tool-renderers";
import { EmailFrontendTools } from "@/components/email-frontend-tools";
import { EmailUiProvider } from "@/components/email-ui-context";
import { EmailPreviewSidebarDetail } from "@/components/email-preview-sidebar";
import { SearchResultsPanel } from "@/components/search-results-panel";
import { DownloadReadyPanel } from "@/components/download-ready-panel";

export default function Home() {
  return (
    <AuthGuard>
      <CopilotKit runtimeUrl="/api/copilotkit" agent="emailAgent">
        <EmailUiProvider>
          <EmailFrontendTools />
          <EmailToolRenderers />
          <CopilotChat
            className="flex-1 w-full"
            labels={{
              modalHeaderTitle: "Email Agent",
              welcomeMessageText: "Hi! Ask me about your emails.",
            }}
          />
          <SearchResultsPanel />
          <EmailPreviewSidebarDetail />
          <DownloadReadyPanel />
        </EmailUiProvider>
      </CopilotKit>
    </AuthGuard>
  );
}
