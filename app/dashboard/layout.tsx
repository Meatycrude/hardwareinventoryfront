import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";



export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
   
         <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full min-h-screen bg-slate-50/50 p-6">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger />
            <h1 className="text-sm font-medium text-slate-500">
              Hardware Inventory
            </h1>
          </div>
          {children}
        </main>
      </SidebarProvider>
       </TooltipProvider>
      
    
  );
}
