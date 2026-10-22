import { PageHeader } from "@/components/dashboard/page-header";
import { PlaceholderPanel } from "@/components/dashboard/placeholder-panel";
import { WorkspaceName } from "@/components/dashboard/workspace-name";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Home"
        description={
          <>
            Everything for <WorkspaceName /> in one place.
          </>
        }
      />
      <PlaceholderPanel>
        Your widget settings and setup checklist will live here.
      </PlaceholderPanel>
    </>
  );
}
