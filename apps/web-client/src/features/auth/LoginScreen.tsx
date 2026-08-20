import { motion } from "framer-motion";

import { useState } from "react";
import { useAuth } from "@/store/hooks/useAuth";

import type { LoginPayload } from "@/store/hooks/hooks.types";


export const LoginScreen = () => {
    const [password, setPassword] = useState("");

    const { isAuth, isAuthLoading, login, isLoggingIn } = useAuth();

    //when not yet auth'ed show a loading screen
    if (isAuthLoading || isAuth) {
        return <div className="fixed inset-0 bg-background" />;
    }

    const handleSubmit = async () => {
        //construct payload and wait for login attempt to complete
        const payload: LoginPayload = {
            password,
        }
        login(payload);
    };

    return (
        <>
        <motion.div 
            className="w-full h-full flex items-center justify-center p-4 overflow-hidden touch-none"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            {/* LOGIN FIELDS */}
            <div className="w-full max-w-sm flex flex-col gap-6 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-md shadow-2xl">
                <div className="flex justify-center pt-2">
                    <img
                        src="/static/defaultMediaSessionLogo.png"
                        alt="Scuttle Logo"
                        className="w-28 h-28 rounded-2xl object-cover shadow-lg border border-zinc-800/50"
                    />
                </div>
            
                <form 
                    className="flex flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }} 
                >
                    <div className="flex flex-col gap-2">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoFocus
                            disabled={isLoggingIn}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60 transition-colors font-mono"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-3 px-4 rounded-xl bg-zinc-300 text-zinc-900 font-medium font-mono hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {(isLoggingIn) ? "Scuttling..." : "Scuttle"}
                    </button>
                </form>
            </div>
        </motion.div>
        </>
    );
};
