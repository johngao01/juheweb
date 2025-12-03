// src/ItemDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Masonry from "react-masonry-css";
import ImageWithFallback from "./components/ImageWithFallback";

async function fetchItem(id) {
    const res = await fetch(`/api/show/${id}/`);
    if (!res.ok) throw new Error(`加载失败: ${res.status}`);
    return await res.json();
}

export default function ItemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const IDS_KEY = "gallery:ids";
    const [ids, setIds] = useState([]);

    useEffect(() => {
        try {
            const cacheIds = JSON.parse(sessionStorage.getItem(IDS_KEY) || "[]");
            if (Array.isArray(cacheIds)) setIds(cacheIds);
        } catch { }
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const data = await fetchItem(id);
                if (!alive) return;
                setItem(data);
                setErr("");
            } catch (e) {
                setErr(e.message || "加载失败");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [id]);

    const images = useMemo(() => {
        if (!item) return [];
        if (Array.isArray(item.src) && item.src.length > 0) return item.src;
        if (item.thumb) return [item.thumb];
        return [];
    }, [item]);

    const masonryCols = { default: 4, 768: 2, 500: 1 };
    const idx = useMemo(() => ids.findIndex(x => String(x) === String(id)), [ids, id]);
    const prevId = idx > 0 ? ids[idx - 1] : null;
    const nextId = (idx >= 0 && idx < ids.length - 1) ? ids[idx + 1] : null;
    const goto = (targetId) => targetId && navigate(`/show/${targetId}`);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "ArrowLeft" && prevId) goto(prevId);
            if (e.key === "ArrowRight" && nextId) goto(nextId);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [prevId, nextId]);

    const [toast, setToast] = useState({ open: false, text: "" });
    const showToast = (text) => {
        setToast({ open: true, text });
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => setToast({ open: false, text: "" }), 1200);
    };
    const copy = async (text, label = "") => {
        const v = (text ?? "").toString().trim();
        if (!v) return;
        try {
            await navigator.clipboard.writeText(v);
            showToast(`${label ? `${label}已复制` : "已复制"}`);
        } catch { showToast("复制失败"); }
    };

    const showVal = (v) => (v === null || v === undefined || v === "") ? "—" : v;
    const fmtTime = (v) => v ? new Date(v).toLocaleString() : "—";

    const [lbOpen, setLbOpen] = useState(false);
    const [lbIdx, setLbIdx] = useState(0);
    const [fitToScreen, setFitToScreen] = useState(false);
    const openLightbox = (idx0 = 0) => { setLbIdx(idx0); setLbOpen(true); };
    const closeLightbox = () => setLbOpen(false);
    const showPrevImg = () => setLbIdx((i) => (i - 1 + images.length) % images.length);
    const showNextImg = () => setLbIdx((i) => (i + 1) % images.length);

    useEffect(() => {
        if (!lbOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") showPrevImg();
            if (e.key === "ArrowRight") showNextImg();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lbOpen, images.length]);

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">加载中...</div>;
    if (err || !item) return <div className="min-h-screen bg-slate-50 p-8 text-center text-red-500">加载失败：{err || "未找到该条目"}</div>;

    const Row = ({ label, value }) => (
        <button type="button" onClick={() => copy(value, label)} className="group w-full text-left rounded-lg px-3 py-2.5 hover:bg-slate-50 transition border border-transparent hover:border-slate-100 flex items-start justify-between">
            <span className="text-slate-500 text-sm whitespace-nowrap">{label}</span>
            <span className="text-slate-800 text-sm font-medium text-right break-all ml-4 select-text">{showVal(value)}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
            {/* [改进] 顶部工具栏：磨砂质感，两端对齐 */}
            <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md transition-all">
                <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
                    {/* 左侧：返回 */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full hover:bg-slate-100/80 transition active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        <span className="text-base font-semibold">返回</span>
                    </button>

                    {/* 右侧：导航 */}
                    <div className="flex items-center gap-3">
                        <button
                            className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition active:scale-95"
                            onClick={() => goto(prevId)}
                            disabled={!prevId}
                            title="上一条 (←)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <button
                            className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition active:scale-95"
                            onClick={() => goto(nextId)}
                            disabled={!nextId}
                            title="下一条 (→)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-full px-4 py-6 relative">
                {/* [改进] ID 显示：作为巨大的背景水印或右上角大标签 */}
                <div className="absolute bottom-4 right-4 -mt-2 opacity-10 pointer-events-none select-none">
                    <span className="text-[5rem] md:text-[8rem] font-black tracking-tighter text-slate-900 leading-none">
                        #{item?.id}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-10 gap-8 items-start mt-4">
                    {/* 信息栏 */}
                    <aside className="md:col-span-3 order-last md:order-first relative z-10">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:sticky md:top-24 overflow-hidden">
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <h1 className="text-xl md:text-2xl font-bold leading-tight cursor-pointer hover:text-blue-600 transition" onClick={() => copy(item.title || "", "标题")}>
                                    {showVal(item.title)}
                                </h1>
                                {/* 移动端 ID 显示补充 */}
                                <div className="md:hidden text-xs font-mono text-slate-300 bg-slate-50 px-2 py-1 rounded">#{item.id}</div>
                            </div>

                            <div className="space-y-1 divide-y divide-slate-50">
                                <Row label="城市" value={item.full_name} />
                                <Row label="地点" value={item.address} />
                                <Row label="价格" value={item.price} />
                                <Row label="来源" value={item.sourced} />
                                <Row label="采集时间" value={fmtTime(item.patime)} />
                                <Row label="服务" value={item.serverlist} />
                                <Row label="QQ" value={item.qq} />
                                <Row label="微信" value={item.wechat} />
                                <Row label="电话" value={item.phone} />
                            </div>

                            {(item.miaoshu || item.detail) && (
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">详细描述</h3>
                                    <div className="prose prose-sm text-slate-600 bg-slate-50 rounded-xl p-4 cursor-pointer hover:bg-blue-50/50 transition whitespace-pre-wrap" onClick={() => copy(item.miaoshu || item.detail, "描述")}>
                                        {item.miaoshu || item.detail}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* 图片区域 */}
                    <section className="md:col-span-7 relative z-10">
                        <Masonry breakpointCols={masonryCols} className="flex gap-4" columnClassName="flex flex-col gap-4">
                            {images.map((url, i) => (
                                <div key={i} className="group relative rounded-xl overflow-hidden cursor-zoom-in shadow-sm hover:shadow-md transition" onClick={() => openLightbox(i)}>
                                    <ImageWithFallback src={url} className="w-full h-auto bg-slate-200 transition duration-500 group-hover:scale-[1.02]" />
                                    <div className="absolute top-2 right-2 bg-black/40 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition">
                                        {i + 1}
                                    </div>
                                </div>
                            ))}
                        </Masonry>
                    </section>
                </div>
            </main>

            <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900/90 text-white text-sm shadow-xl transition-all z-50 ${toast.open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
                {toast.text}
            </div>

            {lbOpen && images.length > 0 && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur flex flex-col" onClick={closeLightbox}>
                    <div className="absolute inset-y-0 left-0 w-[20%] z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); showPrevImg(); }} />
                    <div className="absolute inset-y-0 right-0 w-[20%] z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); showNextImg(); }} />

                    <div className="flex items-center justify-between p-4 z-20 pointer-events-none">
                        <div className="flex gap-2 pointer-events-auto">
                            <button onClick={(e) => { e.stopPropagation(); setFitToScreen(v => !v); }} className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition">
                                {fitToScreen ? "适应屏幕" : "查看原图"}
                            </button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="pointer-events-auto rounded-full bg-white/10 w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 transition">✕</button>
                    </div>

                    <div className="flex-1 flex items-center justify-center overflow-auto z-0 p-2">
                        <img
                            src={images[lbIdx]}
                            className={`rounded shadow-2xl transition-all duration-300 ${fitToScreen ? "max-h-full max-w-full object-contain" : ""}`}
                            style={fitToScreen ? {} : { maxWidth: "none", maxHeight: "none" }}
                        />
                    </div>
                    <div className="p-4 text-center text-white/50 text-xs z-20">
                        {lbIdx + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
}