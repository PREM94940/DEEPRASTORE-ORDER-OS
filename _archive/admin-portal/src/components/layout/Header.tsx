import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="h-16 border-b border-white/10 bg-zinc-950/50 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-medium text-white tracking-wide">Storefront Editor</h2>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <Bell className="w-5 h-5" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
