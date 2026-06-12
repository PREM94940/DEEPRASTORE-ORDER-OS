import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
      <div className="w-full max-w-md p-4">
        <Card className="bg-white/5 border-white/10 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">
              DEEPRASTORE OS
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your credentials to access the operations portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input id="email" type="email" placeholder="admin@deeprastore.com" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <Link href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Forgot password?</Link>
              </div>
              <Input id="password" type="password" className="bg-black/50 border-white/10 text-white" />
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/theme" className="w-full">
              <Button className="w-full bg-white text-black hover:bg-zinc-200 transition-colors">
                Authenticate
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
