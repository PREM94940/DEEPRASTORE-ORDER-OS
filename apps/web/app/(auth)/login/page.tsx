import { login } from '@/app/(staff)/actions/auth'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#111] p-8 rounded-xl border border-white/10 max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Deeprastore OS</h1>
          <p className="text-white/60 text-sm">
            Staff Portal Login
          </p>
        </div>
        
        <form action={login} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white/80">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#059669]"
              placeholder="pilot@deeprastore.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-white/80">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#059669]"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-3 rounded-lg shadow-lg transition-colors mt-4"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
