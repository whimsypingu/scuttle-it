import { useAuth } from "@/store/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";


export const LoginScreen = () => {
    const [password, setPassword] = useState("");
    const queryClient = useQueryClient();

    const { loginSuccess, login, isLoggingIn } = useAuth();

    const handleSubmit = () => {
        if (!password.trim()) return;
        login(password);
    };

    return (
        <>
        <motion.div 
            className="w-full h-full flex flex-col p-4 overflow-hidden touch-none"
            animate={{}}
        >
            {/* LOGIN FIELDS */}
            <div className="w-full max-w-sm p-6 rounded-2xl bg-zing-900/50 border border-zinc-800/50 backdrop-blur-md shadow-2xl flex flex-col gap-6">
            
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-primary">
                        <span className="font-mono text-xl">🔑</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-mono font-semibold text-zinc-100">
                            Authentication
                        </h1>
                        <p className="text-xs text-zinc-400 font-sans">
                            Enter password to unlock session
                        </p>
                    </div>
                </div>

                <form 
                    className="flex flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }} 
                >
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                            Access Key
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60 transition-colors font-mono"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn || !password.trim()}
                        className="w-full py-3 px-4 rounded-xl bg-zinc-100 text-zinc-900 font-medium font-mono hover:bg-white active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {isLoggingIn ? "Unlocking..." : "Enter"}
                    </button>
                </form>
            </div>
        </motion.div>
        </>
    );
};
