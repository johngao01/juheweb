// src/components/AuthGate.jsx
import React, { useState } from 'react';

const AUTH_KEY = "gallery_is_verified";

export default function AuthGate({ children }) {
    // 初始化：检查 sessionStorage 是否有标记
    // sessionStorage 的特性：刷新页面保留，关闭标签页清除
    const [isVerified, setIsVerified] = useState(() => {
        try {
            return sessionStorage.getItem(AUTH_KEY) === "true";
        } catch { return false; }
    });

    const [input, setInput] = useState("");
    const [error, setError] = useState("");

    // 如果已验证，直接渲染子组件（即 App 或 ItemDetail）
    if (isVerified) {
        return children;
    }

    // 验证逻辑
    const handleSubmit = (e) => {
        e.preventDefault();

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');

        const correctPwd = `${dd}${hh}${min}`;

        // 容错：允许上一分钟的密码
        const prevTime = new Date(now.getTime() - 60000);
        const minPrev = String(prevTime.getMinutes()).padStart(2, '0');
        const prevPwd = `${dd}${hh}${minPrev}`;

        // 只要匹配其中一个即可
        if (input === correctPwd || input === prevPwd) {
            sessionStorage.setItem(AUTH_KEY, "true");
            setIsVerified(true);
        } else {
            setError(`验证失败。`);
            setInput(input);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-slate-100">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
                    <h2 className="text-2xl font-bold text-slate-800">访问验证</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="tel"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="请输入密码"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-center text-lg tracking-widest font-mono text-slate-700"
                        autoFocus
                    />
                    {error && <div className="text-red-500 text-sm font-medium animate-pulse">{error}</div>}
                    <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all">解锁进入</button>
                </form>
            </div>
        </div>
    );
}