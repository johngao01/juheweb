// ItemDetail.jsx
import React, {useEffect, useMemo, useState} from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
import Masonry from "react-masonry-css";

async function fetchItem(id) {
    const res = await fetch(`/api/show/${id}/`); // DRF 默认尾斜杠
    if (!res.ok) throw new Error(`加载失败: ${res.status}`);
    return await res.json();
}

export default function ItemDetail() {
    const {id} = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // ======= 从列表页缓存读取 ids 顺序（用于 上一条/下一条）=======
    const IDS_KEY = "gallery:ids";
    const FILTER_KEY = "gallery:filters";
    const [ids, setIds] = useState([]);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        try {
            const cacheIds = JSON.parse(sessionStorage.getItem(IDS_KEY) || "[]");
            if (Array.isArray(cacheIds)) setIds(cacheIds);
            const cacheFilters = JSON.parse(sessionStorage.getItem(FILTER_KEY) || "{}");
            if (cacheFilters && typeof cacheFilters === "object") setFilters(cacheFilters);
        } catch {
        }
    }, []);

    // 拉取当前 item
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
        return () => {
            alive = false;
        };
    }, [id]);

    // 本条图片数组（src 为数组；兼容 thumb）
    const images = useMemo(() => {
        if (!item) return [];
        if (Array.isArray(item.src) && item.src.length > 0) return item.src;
        if (item.thumb) return [item.thumb];
        return [];
    }, [item]);
    const masonryCols = {default: 4};
    // 上/下一条 id
    const idx = useMemo(() => ids.findIndex(x => String(x) === String(id)), [ids, id]);
    const prevId = idx > 0 ? ids[idx - 1] : null;
    const nextId = (idx >= 0 && idx < ids.length - 1) ? ids[idx + 1] : null;
    const goto = (targetId) => targetId && navigate(`/show/${targetId}`);

    // 键盘左右切换
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "ArrowLeft" && prevId) goto(prevId);
            if (e.key === "ArrowRight" && nextId) goto(nextId);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [prevId, nextId]);

    // 复制提示
    const [toast, setToast] = useState({open: false, text: ""});
    const showToast = (text) => {
        setToast({open: true, text});
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => setToast({open: false, text: ""}), 1200);
    };
    const copy = async (text, label = "") => {
        const v = (text ?? "").toString().trim();
        if (!v) return;
        try {
            await navigator.clipboard.writeText(v);
            showToast(`${label ? `${label}已复制：` : ""}${v}`);
        } catch {
            showToast("复制失败");
        }
    };

    const showVal = (v) => (v === null || v === undefined || v === "") ? "—" : v;
    const fmtTime = (v) => v ? new Date(v).toLocaleString() : "—";

    // ====== 详情页 Lightbox（默认实际大小 / 可切换适应屏幕）======
    const [lbOpen, setLbOpen] = useState(false);
    const [lbIdx, setLbIdx] = useState(0);
    const [fitToScreen, setFitToScreen] = useState(false);
    const openLightbox = (idx0 = 0) => {
        setLbIdx(idx0);
        setLbOpen(true);
    };
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                <main className="mx-auto max-w-7xl px-4 py-8">
                    <div className="text-gray-500 text-lg">详情加载中…</div>
                </main>
            </div>
        );
    }

    if (err || !item) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                <main className="mx-auto max-w-7xl px-4 py-8">
                    <div className="text-red-600 mb-4 text-lg">加载失败：{err || "未找到该条目"}</div>
                    <button onClick={() => navigate(-1)}
                            className="rounded-xl border px-4 py-2 hover:bg-gray-50 text-base">← 返回
                    </button>
                </main>
            </div>
        );
    }

    // 可点击复制的行
    const Row = ({label, value}) => (
        <button
            type="button"
            onClick={() => copy(value, label)}
            className="group w-full text-left rounded-lg px-2 py-2 hover:bg-gray-50 focus:bg-gray-50 transition"
            title="点击复制"
        >
            <span className="text-gray-500 mr-2 text-base">{label}</span>
            <span className="align-middle text-lg break-words">{showVal(value)}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <header className="border-b border-gray-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)}
                                className="rounded-xl border px-3 py-1 hover:bg-gray-50 text-base" title="返回">← 返回
                        </button>
                        <Link to="/" className="text-gray-600 hover:text-gray-900 text-base">首页</Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-xl border px-3 py-1 text-base disabled:opacity-40"
                            onClick={() => goto(prevId)} disabled={!prevId} title="上一条（←）">← 上一条
                        </button>
                        <button
                            className="rounded-xl border px-3 py-1 text-base disabled:opacity-40"
                            onClick={() => goto(nextId)} disabled={!nextId} title="下一条（→）">下一条 →
                        </button>
                        <div className="text-gray-400 text-sm">ID: {item?.id}</div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-full px-4 py-6 text-base">
                <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-start">
                    {/* 左侧：3 */}
                    <aside className="md:col-span-2">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 sticky top-4">
                            <h1
                                className="text-3xl md:text-4xl font-bold leading-snug break-words cursor-pointer"
                                title="点击复制标题"
                                onClick={() => copy(item.title || "", "标题")}
                            >
                                {showVal(item.title)}
                            </h1>

                            <div className="mt-4 grid grid-cols-1 gap-1.5">
                                <Row label="来源：" value={item.sourced}/>
                                <Row label="年龄：" value={item.age}/>
                                <Row label="颜值：" value={item.beauty}/>
                                <Row label="价格：" value={item.price}/>
                                <Row label="地址：" value={item.address}/>
                                <Row label="地点：" value={item.place}/>
                                <Row label="采集时间：" value={fmtTime(item.patime)}/>
                                <Row label="创建时间：" value={fmtTime(item.createtime)}/>
                                <Row label="QQ：" value={item.qq}/>
                                <Row label="微信：" value={item.wechat}/>
                                <Row label="电话：" value={item.phone}/>
                                <Row label="服务列表：" value={item.serverlist}/>
                            </div>

                            {(item.miaoshu || item.detail) && (
                                <div className="mt-6">
                                    <div className="text-gray-900 font-semibold mb-2 text-lg">详细描述</div>
                                    <div
                                        className="prose max-w-none whitespace-pre-wrap text-gray-700 text-lg leading-relaxed rounded-lg px-2 py-2 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => copy(item.miaoshu || item.detail || "", "详细描述")}
                                        title="点击复制"
                                    >
                                        {item.miaoshu || item.detail}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* 右侧：7 - 严格 1:1 原始像素展示 */}
                    <section className="md:col-span-8">
                        {images.length === 0 ? (
                            <div className="text-gray-500 text-lg">该条目暂无图片</div>
                        ) : (
                            <Masonry
                                breakpointCols={masonryCols}
                                className="flex gap-4"
                                columnClassName="flex flex-col gap-4"
                            >
                                {images.map((url, i) => (
                                    <figure key={`${item.id}-${i}`}
                                            className="rounded-2xl">
                                        <img
                                            src={url}
                                            alt={`${item.title || "图片"}-${i + 1}`}
                                            loading="lazy"
                                            className="w-full h-auto rounded-2xl hover:opacity-95"
                                            onClick={() => openLightbox(i)}
                                        />
                                        <figcaption className="px-3 py-2 text-gray-500 text-sm">第 {i + 1} 张
                                        </figcaption>
                                    </figure>
                                ))}
                            </Masonry>
                        )}
                    </section>
                </div>
            </main>

            {/* 复制提示 Toast */}
            <div
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/80 text-white text-sm transition
        ${toast.open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
            >
                {toast.text}
            </div>

            {/* Lightbox 大图预览 */}
            {lbOpen && images.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col" onClick={closeLightbox}>
                    <div className="flex items-center justify-between p-3 text-white">
                        <div className="text-base opacity-80 truncate">{item?.title}</div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFitToScreen(v => !v);
                                }}
                                className="rounded-lg bg-white/10 px-3 py-1 text-base hover:bg-white/20"
                                title={fitToScreen ? "切换到实际大小" : "切换到适应屏幕"}
                            >
                                {fitToScreen ? "适应屏幕" : "实际大小"}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeLightbox();
                                }}
                                className="rounded-lg bg-white/10 px-3 py-1 text-base hover:bg-white/20"
                            >
                                关闭 (Esc)
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center px-4 relative"
                         onClick={(e) => e.stopPropagation()}>
                        <button
                            aria-label="上一张" onClick={showPrevImg}
                            className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 py-2"
                        >←
                        </button>

                        <div className="w-full h-full flex items-center justify-center overflow-auto">
                            <img
                                src={images[lbIdx]}
                                alt={item?.title}
                                className={`rounded-xl shadow-2xl ${fitToScreen ? "max-h-[80vh] max-w-[90vw] object-contain" : ""}`}
                                style={fitToScreen ? {} : {maxWidth: "none", maxHeight: "none"}}
                            />
                        </div>

                        <button
                            aria-label="下一张" onClick={showNextImg}
                            className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 py-2"
                        >→
                        </button>
                    </div>

                    <div className="p-3 text-center text-white/80 text-sm">
                        {lbIdx + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
}
