import { ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface JoinFormProps {
  isLight: boolean;
  code: string;
  onCodeChange: (value: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  errorMsg: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

// The room-code + name entry form that starts a join.
export default function JoinForm({ isLight, code, onCodeChange, name, onNameChange, errorMsg, onSubmit }: JoinFormProps) {
  return (
    <form onSubmit={onSubmit} className={cn(
      "border rounded-lg p-6 space-y-4 shadow-xl transition-all duration-300",
      isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-800"
    )}>
      <h2 className="text-center font-display text-base font-bold tracking-wider uppercase">Enter Game Room</h2>

      {errorMsg && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Room Code</label>
        <input
          type="text"
          placeholder="e.g. KVTQ"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase().slice(0, 4))}
          className={cn(
            "w-full text-center text-xl font-bold rounded-lg border py-2.5 focus:outline-none tracking-widest uppercase",
            isLight ? "bg-gray-50 border-gray-300 focus:border-clocktower-blood" : "bg-gray-900 border-gray-700 focus:border-clocktower-blood text-white"
          )}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Name</label>
        <input
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 focus:outline-none text-center font-semibold",
            isLight ? "bg-gray-50 border-gray-300 focus:border-clocktower-blood" : "bg-gray-900 border-gray-700 focus:border-clocktower-blood text-white"
          )}
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-clocktower-blood text-white rounded-lg py-3 font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-2 shadow-md shadow-clocktower-blood/20"
      >
        <span>Join Game Room</span>
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
