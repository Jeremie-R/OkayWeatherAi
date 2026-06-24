import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TabBar } from "@/components/TabBar";
import { InstallHint } from "@/components/InstallHint";

export const Route = createFileRoute("/_tabs")({
  component: TabsLayout,
});

function TabsLayout() {
  return (
    <>
      <div className="pb-16">
        <Outlet />
        <InstallHint />
      </div>
      <TabBar />
    </>
  );
}