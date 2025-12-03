import React, { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import Masonry from "react-masonry-css";
import ImageWithFallback from "./components/ImageWithFallback";

import {
    SORTS, CITYS, SOURCED, LS_KEYS,
    COLUMN_MIN, COLUMN_MAX, COLUMN_STEP, DEFAULT_COLUMNS,
    PAGE_SIZES, DEFAULT_PAGE_SIZE, DEFAULT_CITY, DEFAULT_VIEW, DEFAULT_SORT, DEFAULT_SOURCED
} from "./config";

const SESSION_KEY = "gallery_session_state";

// API 请求函数 (无 fixImgUrl，直接使用后端数据)
async function fetchImages(page = 1, pageSize = DEFAULT_PAGE_SIZE, q = "", city = "310000", sourced = 'all') {
    const params = new URLSearchParams({ page, pageSize, q, city, sourced });
    const res = await fetch(`/api/data/?${params.toString()}&_t=${Date.now()}`);
    if (!res.ok) throw new Error("Network response was not ok");
    const json = await res.json();

    const items = (json.items || []).map((it) => {
        const createdMs = it.createtime ? Date.parse(it.createtime) : 0;
        const rawSrc = Array.isArray(it.src) ? it.src : [];
        let thumbUrl = rawSrc.length ? rawSrc[0] : (it.thumb || "");

        return {
            id: it.id,
            title: it.title || "无标题",
            tags: Array.isArray(it.tags) ? it.tags : [it.serverlist, it.place].filter(Boolean),
            thumb: thumbUrl,
            sourced: it.sourced || '',
            src: rawSrc,
            place: it.place || "",
            createdAt: createdMs,
            dateStr: it.createtime || "",
            city: it.city || "",
            price: it.price,
            full_name: it.full_name,
        };
    });

    const count = typeof json.count === "number" ? json.count : 0;
    return { items, hasMore: Boolean(json.hasMore), count };
}

// =================================================================
// 3. 主界面组件
// =================================================================
export default function GalleryApp() {
    const restoredState = useMemo(() => {
        try {
            const nav = performance.getEntriesByType("navigation")[0];
            if (nav && nav.type !== 'back_forward') return null;
            const data = sessionStorage.getItem(SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    }, []);

    // 初始化配置
    const initialCityKey = restoredState?.cityKey ?? (() => { try { return localStorage.getItem(LS_KEYS.cityKey) || DEFAULT_CITY; } catch { return DEFAULT_CITY; } })();
    const initialView = (() => { try { return localStorage.getItem(LS_KEYS.view) === "list" ? "list" : "masonry"; } catch { return DEFAULT_VIEW; } })();
    const initialSortKey = (() => { try { return localStorage.getItem(LS_KEYS.sortKey) || DEFAULT_SORT; } catch { return DEFAULT_SORT; } })();
    const initialScale = (() => { try { const n = parseInt(localStorage.getItem(LS_KEYS.scale), 10); return Math.min(COLUMN_MAX, Math.max(COLUMN_MIN, Number.isFinite(n) ? n : DEFAULT_COLUMNS)); } catch { return DEFAULT_COLUMNS; } })();
    const initialPageSize = restoredState?.pageSize ?? (() => { try { const n = parseInt(localStorage.getItem(LS_KEYS.pageSize), 10); return PAGE_SIZES.includes(n) ? n : DEFAULT_PAGE_SIZE; } catch { return DEFAULT_PAGE_SIZE; } })();
    const initialSourced = restoredState?.sourced ?? (() => { try { return localStorage.getItem(LS_KEYS.sourced) || "all"; } catch { return DEFAULT_SOURCED; } })();
    const initialShowSidebar = (() => { try { const v = localStorage.getItem(LS_KEYS.showSidebar); return v === null ? true : v === "true"; } catch { return true; } })();

    // State
    const [activeTags, setActiveTags] = useState(restoredState?.activeTags || []);
    const [sortKey, setSortKey] = useState(initialSortKey);
    const [view, setView] = useState(initialView);
    const [scale, setScale] = useState(initialScale);
    const [scaleHover, setScaleHover] = useState(false);
    const [randomMode, setRandomMode] = useState(false);
    const [randomNonce, setRandomNonce] = useState(0);
    const [showSidebar, setShowSidebar] = useState(initialShowSidebar);

    const [cityKey, setCityKey] = useState(initialCityKey);
    const [sourced, setSourced] = useState(initialSourced);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [searchKeyword, setSearchKeyword] = useState(restoredState?.searchKeyword || "");
    const [page, setPage] = useState(restoredState?.page || 1);

    const [images, setImages] = useState(restoredState?.images || []);
    const [hasMore, setHasMore] = useState(restoredState?.hasMore ?? true);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(restoredState?.totalCount || 0);

    const sentinelRef = useRef(null);
    const scaleBoxRef = useRef(null);
    const inputRef = useRef(null);
    const isFetching = useRef(false);
    const isRestored = useRef(!!restoredState);

    const [lbItemIdx, setLbItemIdx] = useState(-1);
    const [lbImgIdx, setLbImgIdx] = useState(0);

    const countText = hasClientFilter() ? `${filteredImages().length} / ${images.length} (筛选)` : `${images.length} / ${totalCount}`;

    function hasClientFilter() { return activeTags.length > 0; }

    // Effects & Logic
    useEffect(() => {
        const stateToSave = {
            images, page, hasMore, totalCount, cityKey, sourced, pageSize, searchKeyword, activeTags,
            scrollTop: window.scrollY
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(stateToSave));
    }, [images, page, hasMore, totalCount, cityKey, sourced, pageSize, searchKeyword, activeTags]);

    useLayoutEffect(() => {
        if (isRestored.current && restoredState?.scrollTop) {
            window.scrollTo(0, restoredState.scrollTop);
            setTimeout(() => { isRestored.current = false; }, 100);
        }
    }, []);

    useEffect(() => { try { localStorage.setItem(LS_KEYS.cityKey, cityKey); } catch { } }, [cityKey]);
    useEffect(() => { try { localStorage.setItem(LS_KEYS.view, view); } catch { } }, [view]);
    useEffect(() => { try { localStorage.setItem(LS_KEYS.sortKey, sortKey); } catch { } }, [sortKey]);
    useEffect(() => { try { localStorage.setItem(LS_KEYS.scale, String(scale)); } catch { } }, [scale]);
    useEffect(() => { try { localStorage.setItem(LS_KEYS.pageSize, String(pageSize)); } catch { } }, [pageSize]);
    useEffect(() => { try { localStorage.setItem(LS_KEYS.sourced, String(sourced)); } catch { } }, [sourced]);
    useEffect(() => { try { localStorage.setItem(LS_KEYS.showSidebar, String(showSidebar)); } catch { } }, [showSidebar]);
    useEffect(() => { try { const ids = images.map(it => it.id); sessionStorage.setItem('gallery:ids', JSON.stringify(ids)); } catch { } }, [images]);

    const TAGS = useMemo(() => {
        const freq = new Map();
        for (const it of images) {
            for (const t of it.tags || []) {
                const s = String(t || "").trim();
                if (!s) continue;
                freq.set(s, (freq.get(s) || 0) + 1);
            }
        }
        return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
    }, [images]);

    useEffect(() => {
        if (isRestored.current && images.length > 0) return;
        if (page > 1 && isFetching.current) return;

        let mounted = true;
        const loadData = async () => {
            isFetching.current = true;
            setLoading(true);
            try {
                const m = CITYS.find((c) => c.key === cityKey);
                const apiCity = m ? m.key : "310000";
                const { items, hasMore: apiHasMore, count } = await fetchImages(page, pageSize, searchKeyword, apiCity, sourced);
                if (!mounted) return;
                setImages(prev => {
                    if (page === 1) return items;
                    const exists = new Set(prev.map(p => p.id));
                    const newItems = items.filter(it => !exists.has(it.id));
                    return [...prev, ...newItems];
                });
                setHasMore(apiHasMore);
                if (typeof count === "number" && count >= 0) setTotalCount(count);
            } catch (e) {
                console.error("Fetch error:", e);
            } finally {
                if (mounted) {
                    setLoading(false);
                    setTimeout(() => { isFetching.current = false; }, 200);
                }
            }
        };
        loadData();
        return () => { mounted = false; };
    }, [page, cityKey, pageSize, searchKeyword, sourced]);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const io = new IntersectionObserver((entries) => {
            const e = entries[0];
            if (e.isIntersecting && hasMore && !loading && !isFetching.current && activeTags.length === 0) {
                setPage((p) => p + 1);
            }
        });
        io.observe(sentinelRef.current);
        return () => io.disconnect();
    }, [hasMore, loading, activeTags.length]);

    function filteredImages() {
        let arr = [...images];
        if (activeTags.length > 0) {
            arr = arr.filter((it) => activeTags.every((t) => (it.tags || []).includes(t)));
        }
        if (randomMode) {
            if (randomNonce > 0) arr.sort(() => 0.5 - Math.random());
        } else {
            switch (sortKey) {
                case "new": arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); break;
                case "old": arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); break;
                case "az": arr.sort((a, b) => (a.title || "").localeCompare(b.title || "")); break;
                case "za": arr.sort((a, b) => (b.title || "").localeCompare(a.title || "")); break;
                default: break;
            }
        }
        return arr;
    }
    const displayedImages = filteredImages();

    const resetAndFetch = () => {
        setImages([]); setPage(1); setHasMore(true); setRandomMode(false); setLbItemIdx(-1);
        isFetching.current = false; isRestored.current = false;
    };
    const handleHardReset = () => { sessionStorage.removeItem(SESSION_KEY); resetAndFetch(); };
    const onCityChange = (val) => { setCityKey(val); resetAndFetch(); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const onSourcedChange = (val) => { setSourced(val); resetAndFetch(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    const onPageSizeChange = (val) => { const n = parseInt(val, 10); setPageSize(PAGE_SIZES.includes(n) ? n : DEFAULT_PAGE_SIZE); resetAndFetch(); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const handleSearch = () => { const keyword = inputRef.current?.value.trim() || ""; setSearchKeyword(keyword); resetAndFetch(); };
    const onSortChange = (val) => { setSortKey(val); setRandomMode(false); };
    const toggleTag = (tag) => { setActiveTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag])); };

    useEffect(() => {
        const onWheelGlobal = (e) => {
            if (!scaleHover) return;
            e.preventDefault(); e.stopPropagation();
            const delta = e.deltaY < 0 ? COLUMN_STEP : -COLUMN_STEP;
            setScale((s) => Math.max(COLUMN_MIN, Math.min(s + delta, COLUMN_MAX)));
        };
        window.addEventListener("wheel", onWheelGlobal, { capture: true, passive: false });
        return () => window.removeEventListener("wheel", onWheelGlobal, true);
    }, [scaleHover]);

    const openLightbox = (itemIdx, imageIdx = 0) => { setLbItemIdx(itemIdx); setLbImgIdx(imageIdx); };
    const closeLightbox = () => setLbItemIdx(-1);
    const getImagesOf = useCallback((item, start = 0) => {
        if (!item) return [];
        const arr = Array.isArray(item.src) && item.src.length > 0 ? item.src : (item.thumb ? [item.thumb] : []);
        const s = Math.max(0, Math.min(Number.isFinite(start) ? Math.trunc(start) : 0, arr.length));
        return arr.slice(s);
    }, []);
    const showPrev = () => {
        if (lbItemIdx < 0 || displayedImages.length === 0) return;
        if (lbImgIdx > 0) setLbImgIdx(lbImgIdx - 1);
        else {
            const prevItemIdx = (lbItemIdx - 1 + displayedImages.length) % displayedImages.length;
            const prevImgs = getImagesOf(displayedImages[prevItemIdx]);
            setLbItemIdx(prevItemIdx);
            setLbImgIdx(Math.max(0, prevImgs.length - 1));
        }
    };
    const showNext = () => {
        if (lbItemIdx < 0 || displayedImages.length === 0) return;
        const imgs = getImagesOf(displayedImages[lbItemIdx]);
        if (lbImgIdx < imgs.length - 1) setLbImgIdx(lbImgIdx + 1);
        else {
            setLbItemIdx((lbItemIdx + 1) % displayedImages.length);
            setLbImgIdx(0);
        }
    };
    useEffect(() => {
        if (lbItemIdx < 0) return;
        const onKey = (e) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") showPrev();
            if (e.key === "ArrowRight") showNext();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lbItemIdx, lbImgIdx, displayedImages, getImagesOf]);
    useEffect(() => {
        if (lbItemIdx >= 0 && lbItemIdx >= displayedImages.length) { setLbItemIdx(-1); setLbImgIdx(0); }
    }, [displayedImages.length, lbItemIdx]);

    const masonryBreakpointCols = useMemo(() => {
        return { default: scale, 1024: Math.min(scale, 3), 768: 2 };
    }, [scale]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <main className="mx-auto max-w-full px-4 pt-0 pb-6 text-base">
                {/* 顶部工具栏 */}
                <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur py-3 shadow-sm -mx-4 px-4 mb-4 border-b border-slate-200/50">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                            <a href="/" onClick={(e) => { e.preventDefault(); handleHardReset(); }} className="text-xl font-bold tracking-tight text-slate-900 hover:text-blue-600 transition cursor-pointer">
                                聚合
                            </a>
                            <span className="text-sm text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-mono">{countText}</span>
                            <button className={`p-1.5 rounded-md transition-colors ${!showSidebar ? "text-slate-400 hover:bg-slate-100" : "text-blue-600 bg-blue-50"}`} onClick={() => setShowSidebar(v => !v)} title={showSidebar ? "隐藏筛选栏" : "显示筛选栏"}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                            </button>
                        </div>
                        <div className="flex-1 w-full md:max-w-2xl md:mx-auto order-last md:order-none">
                            <div className="relative group">
                                <input ref={inputRef} defaultValue={searchKeyword} aria-label="搜索" placeholder="搜索所有..." className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:shadow-md" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end shrink-0 flex-wrap md:flex-nowrap">
                            <select className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm cursor-pointer hover:border-blue-400 focus:outline-none" value={cityKey} onChange={(e) => onCityChange(e.target.value)}>
                                {CITYS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                            <select className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm cursor-pointer hover:border-blue-400 focus:outline-none" value={sourced} onChange={(e) => onSourcedChange(e.target.value)}>
                                {SOURCED.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                            <select className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm cursor-pointer hover:border-blue-400 focus:outline-none" value={sortKey} onChange={(e) => onSortChange(e.target.value)}>
                                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                            <div className="flex bg-white rounded-full border border-slate-200 p-0.5">
                                {[{ key: "masonry", label: "瀑布" }, { key: "list", label: "列表" }].map((v) => (
                                    <button key={v.key} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${view === v.key ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-900"}`} onClick={() => setView(v.key)}>
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                            <div ref={scaleBoxRef} onMouseEnter={() => setScaleHover(true)} onMouseLeave={() => setScaleHover(false)} onDoubleClick={() => setScale(DEFAULT_COLUMNS)} className="hidden md:flex items-center justify-center select-none cursor-ns-resize rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600">
                                {scale}列
                            </div>
                            <select className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm" value={pageSize} onChange={(e) => onPageSizeChange(e.target.value)}>
                                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}条</option>)}
                            </select>
                            <button className="rounded-full border border-slate-200 bg-white w-9 h-9 flex items-center justify-center text-lg hover:bg-slate-50 hover:scale-110 transition" onClick={() => { setRandomMode(true); setRandomNonce((k) => k + 1); }} title="随机打乱">🎲</button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-10 gap-6 items-start">
                    {showSidebar && (
                        <aside className="md:col-span-2">
                            <div className="md:sticky md:top-24">
                                <div className="flex flex-wrap gap-2 text-sm">
                                    {TAGS.map((t) => (
                                        <button key={t} onClick={() => toggleTag(t)} className={`px-3 py-1 rounded-full border transition-all ${activeTags.includes(t) ? "bg-slate-800 text-white border-slate-800 shadow-sm" : "border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 bg-white"}`}>#{t}</button>
                                    ))}
                                    {activeTags.length > 0 && <button onClick={() => setActiveTags([])} className="px-3 py-1 text-slate-400 hover:text-slate-800 text-sm">清除</button>}
                                </div>
                            </div>
                        </aside>
                    )}

                    <section className={showSidebar ? "md:col-span-8" : "md:col-span-10"}>
                        {displayedImages.length === 0 && !loading ? (
                            <div className="py-20 text-center text-gray-500 text-base">无结果，试试更少的筛选或更短的关键词。</div>
                        ) : view === "list" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {displayedImages.map((it, idx) => (
                                    <div key={it.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all flex flex-col relative">
                                        {/* [新增] 列表视图序号 (右上角) */}
                                        <div className="absolute top-0 right-0 bg-slate-100 text-slate-400 text-[20px] px-2 py-1 rounded-bl-xl rounded-tr-xl font-mono">
                                            #{idx + 1}
                                        </div>

                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <a href={`/show/${it.id}`} className="font-bold text-lg text-slate-900 truncate block hover:text-blue-600 transition-colors" title={it.title}>{it.title}</a>
                                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                    <span>{it.dateStr ? it.dateStr.replace('T', ' ') : "未知日期"}</span>
                                                    <span>{it.full_name} {it.place}</span>
                                                    {it.sourced && <span className="bg-slate-100 text-xs px-2 py-0.5 rounded">{it.sourced}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {(it.src || []).length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
                                                {(it.src || []).map((url, i) => (
                                                    <div key={i} className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden cursor-pointer bg-slate-100" onClick={() => openLightbox(displayedImages.indexOf(it), i)}>
                                                        <ImageWithFallback src={url} alt={`${it.title}-${i}`} className="w-full h-full object-cover hover:opacity-90" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {(it.tags || []).map((tg) => (
                                                <button key={tg} onClick={() => toggleTag(tg)} className={`px-2 py-0.5 rounded text-xs border ${activeTags.includes(tg) ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"}`}>#{tg}</button>
                                            ))}
                                        </div>
                                        {it.price && <div className="mt-2 pt-2 border-t border-slate-50"><span className="text-red-500 font-bold text-lg">¥{it.price}</span></div>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Masonry breakpointCols={masonryBreakpointCols} className="flex gap-4" columnClassName="flex flex-col gap-4">
                                {displayedImages.map((it, idx) => (
                                    <figure key={it.id} className="group relative rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                        <div className="relative aspect-[3/4] overflow-hidden cursor-pointer" onClick={() => openLightbox(displayedImages.indexOf(it), 0)}>
                                            <ImageWithFallback src={it.thumb} alt={it.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-white/90 backdrop-blur text-xs px-3 py-1 rounded-full shadow-lg font-medium">预览</div>
                                            </div>
                                            {it.sourced && <div className="absolute top-2 left-2 bg-black/50 backdrop-blur text-white text-[20px] px-2 py-0.5 rounded">{it.sourced}</div>}

                                            {/* [新增] 瀑布流视图序号 (图片右上角) */}
                                            <div className="absolute top-2 right-2 bg-black/60 text-white text-[20px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <a href={`/show/${it.id}`} className="block font-bold text-gray-800 text-sm truncate hover:text-blue-600 mb-1 flex-1" title={it.title}>{it.title}</a>
                                            </div>
                                            {getImagesOf(it, 1).length > 0 && (
                                                <div className="mt-2 grid grid-cols-4 gap-1">
                                                    {getImagesOf(it, 1).slice(0, 3).map((url, i) => (
                                                        <div key={i} className="aspect-square rounded overflow-hidden cursor-zoom-in" onClick={() => openLightbox(displayedImages.indexOf(it), i + 1)}>
                                                            <ImageWithFallback src={url} className="w-full h-full object-cover hover:opacity-80" />
                                                        </div>
                                                    ))}
                                                    {getImagesOf(it, 1).length > 3 && (
                                                        <div className="aspect-square rounded bg-gray-50 flex items-center justify-center text-xs text-gray-400">+{getImagesOf(it, 1).length - 3}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </figure>
                                ))}
                            </Masonry>
                        )}

                        {hasMore && activeTags.length === 0 && (
                            <div ref={sentinelRef} className="h-24 flex items-center justify-center text-slate-400 text-sm">
                                {loading ? "加载更多..." : "下滑加载"}
                            </div>
                        )}
                    </section>
                </div>

                {/* Lightbox */}
                {lbItemIdx >= 0 && (
                    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col" onClick={closeLightbox}>
                        <div className="absolute inset-y-0 left-0 w-[20%] z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); showPrev(); }} />
                        <div className="absolute inset-y-0 right-0 w-[20%] z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); showNext(); }} />
                        <div className="flex items-center justify-between p-4 text-white z-20 pointer-events-none">
                            <div className="text-sm font-medium opacity-90 truncate max-w-[70%]">
                                <span className="mr-2 opacity-60 text-xs">#{lbItemIdx + 1}</span>
                                {displayedImages[lbItemIdx]?.title}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="pointer-events-auto rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20 backdrop-blur">关闭</button>
                        </div>
                        <div className="flex-1 flex items-center justify-center px-4 relative z-0">
                            {(() => {
                                const item = displayedImages[lbItemIdx];
                                const imgs = getImagesOf(item);
                                const url = imgs[lbImgIdx];
                                return <img src={url} alt="preview" className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl transition-transform duration-300" />;
                            })()}
                        </div>
                        <div className="p-4 text-center text-white/50 text-xs z-20">{lbImgIdx + 1} / {getImagesOf(displayedImages[lbItemIdx]).length}</div>
                    </div>
                )}
            </main>
        </div>
    );
}