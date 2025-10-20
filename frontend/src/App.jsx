// App.jsx（缩放 0.3–1；全局捕获 wheel 阻止页面滚动；持久化城市/排序/视图/缩放/每页）
import React, {useEffect, useMemo, useRef, useState} from "react";
import Masonry from "react-masonry-css";

// [ADD] 引入抽取出的配置
import {
    SORTS, CITYS,
    COLUMN_MIN, COLUMN_MAX, COLUMN_STEP, DEFAULT_COLUMNS,
    PAGE_SIZES, DEFAULT_PAGE_SIZE, DEFAULT_CITY, DEFAULT_VIEW, DEFAULT_SORT, SOURCED, DEFAULT_SOURCED
} from "./config";

// —— 本地存储 key —— //
const LS_KEYS = {
    cityKey: "ph_cityKey",
    view: "ph_view",
    sortKey: "ph_sortKey",
    scale: "ph_scale",       // 这里的 scale 表示“列数”
    pageSize: "ph_pageSize",
    sourced: " ph_sourced",
};

// —— 请求封装：支持按城市拉取 —— //
async function fetchImages(page = 1, pageSize = DEFAULT_PAGE_SIZE, q = "", city = "上海", sourced = 'all') {
    const params = new URLSearchParams({page, pageSize, q, city, sourced});
    const res = await fetch(`/api/data/?${params.toString()}`);
    const json = await res.json();
    const items = (json.items || []).map((it) => {
        const createdMs = it.createtime ? Date.parse(it.createtime) : 0;
        return {
            id: it.id,
            title: it.title || "",
            tags: Array.isArray(it.tags) ? it.tags : [it.serverlist, it.place].filter(Boolean),
            thumb: it.src && it.src.length ? it.src[0] : it.thumb,
            sourced: it.sourced || '',
            src: it.src,
            place: it.place || "",
            createdAt: createdMs,
            createdAtRaw: it.createtime,
            city: it.city || "",
            price: it.price,
        };
    });

    const count = typeof json.count === "number" ? json.count : 0;
    return {items, hasMore: Boolean(json.hasMore), count};
}

export default function GalleryApp() {
    // —— 从 localStorage 读初始值 —— //
    const initialCityKey = (() => {
        try {
            return localStorage.getItem(LS_KEYS.cityKey) || "SH";
        } catch {
            return DEFAULT_CITY;
        }
    })();
    const initialView = (() => {
        try {
            return localStorage.getItem(LS_KEYS.view) === "list" ? "list" : "masonry";
        } catch {
            return DEFAULT_VIEW;
        }
    })();
    const initialSortKey = (() => {
        try {
            return localStorage.getItem(LS_KEYS.sortKey) || DEFAULT_SORT;
        } catch {
            return DEFAULT_SORT;
        }
    })();
    // [FIX] 列数读取：按 COLUMN_MIN/COLUMN_MAX 边界夹取；缺省用 DEFAULT_COLUMNS
    const initialScale = (() => {
        try {
            const n = parseInt(localStorage.getItem(LS_KEYS.scale), 10);
            const base = Number.isFinite(n) ? n : DEFAULT_COLUMNS;
            return Math.min(COLUMN_MAX, Math.max(COLUMN_MIN, base));
        } catch {
            return DEFAULT_COLUMNS;
        }
    })();
    // [FIX] 每页数量读取：不在 PAGE_SIZES 内则使用 DEFAULT_PAGE_SIZE
    const initialPageSize = (() => {
        try {
            const n = parseInt(localStorage.getItem(LS_KEYS.pageSize), 10);
            return PAGE_SIZES.includes(n) ? n : DEFAULT_PAGE_SIZE;
        } catch {
            return DEFAULT_PAGE_SIZE;
        }
    })();
    const initialSourced = (() => {
        try {
            return localStorage.getItem(LS_KEYS.sourced) || "all";
        } catch {
            return DEFAULT_SOURCED;
        }
    })();

    // —— 查询相关状态 —— //
    const [activeTags, setActiveTags] = useState([]);
    const [sortKey, setSortKey] = useState(initialSortKey);
    const [cityKey, setCityKey] = useState(initialCityKey);
    const [view, setView] = useState(initialView);

    // —— 列表、分页、加载状态 —— //
    const [page, setPage] = useState(1);
    const [images, setImages] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // —— 预览 —— //
    const [lbItemIdx, setLbItemIdx] = useState(-1);
    const [lbImgIdx, setLbImgIdx] = useState(0);
    const sentinelRef = useRef(null);

    // —— Masonry 列数（使用 scale 这个 state 表示“每列数量”） —— //
    const [scale, setScale] = useState(initialScale);
    const scaleBoxRef = useRef(null);
    const [scaleHover, setScaleHover] = useState(false);

    // —— 每页数量 —— //
    const [pageSize, setPageSize] = useState(initialPageSize);

    // —— 随机打乱视图 —— //
    const [randomMode, setRandomMode] = useState(false);
    const [randomNonce, setRandomNonce] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState("");
    // —— 城市名（传给后端） —— //
    const cityLabel = useMemo(() => {
        const m = CITYS.find((c) => c.key === cityKey);
        return m ? m.label : "上海";
    }, [cityKey]);

    const [sourced, setSourced] = useState(initialSourced);

    const inputRef = useRef(null);
    // —— 是否处于前端“筛选”状态 —— //
    const hasClientFilter = useMemo(() => activeTags.length > 0, [activeTags.length]);

    // [KEEP] 把当前已加载的 id 顺序 / 城市写到 sessionStorage（供详情页上一条/下一条用）
    useEffect(() => {
        try {
            const ids = images.map(it => it.id);
            sessionStorage.setItem('gallery:ids', JSON.stringify(ids));
            const cityLabel = CITYS.find(c => c.key === cityKey)?.label || "上海";
            sessionStorage.setItem('gallery:filters', JSON.stringify({city: cityLabel}));
        } catch {
        }
    }, [images, cityKey]);

    // —— 持久化 —— //
    useEffect(() => {
        try {
            localStorage.setItem(LS_KEYS.cityKey, cityKey);
        } catch {
        }
    }, [cityKey]);
    useEffect(() => {
        try {
            localStorage.setItem(LS_KEYS.view, view);
        } catch {
        }
    }, [view]);
    useEffect(() => {
        try {
            localStorage.setItem(LS_KEYS.sortKey, sortKey);
        } catch {
        }
    }, [sortKey]);
    useEffect(() => {
        try {
            localStorage.setItem(LS_KEYS.scale, String(scale));
        } catch {
        }
    }, [scale]);
    useEffect(() => {
        try {
            localStorage.setItem(LS_KEYS.pageSize, String(pageSize));
        } catch {
        }
    }, [pageSize]);
    useEffect(() => {
        try {
            localStorage.setItem(LS_KEYS.sourced, String(sourced));
        } catch {
        }
    }, [sourced]);

    // —— 动态标签 —— //
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

    // —— 拉取数据 —— //
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            const {items, hasMore, count} = await fetchImages(page, pageSize, searchKeyword, cityLabel, sourced);
            if (!mounted) return;
            setImages(prev => (page === 1 ? items : [...prev, ...items]));
            setHasMore(hasMore);
            if (typeof count === "number" && count >= 0) setTotalCount(count);
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [page, cityLabel, pageSize, searchKeyword, sourced]);

    // —— 无限滚动（选了标签就暂停） —— //
    useEffect(() => {
        if (!sentinelRef.current) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting && hasMore && !loading && activeTags.length === 0) {
                    setPage((p) => p + 1);
                }
            });
        });
        io.observe(sentinelRef.current);
        return () => io.disconnect();
    }, [hasMore, loading, activeTags.length]);

    // —— 本地过滤 + 排序/随机 —— //
    const filtered = useMemo(() => {
        let arr = images;

        if (activeTags.length > 0) {
            arr = arr.filter((it) => activeTags.every((t) => (it.tags || []).includes(t)));
        }

        if (randomMode) {
            const copy = arr.slice();
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(((Math.sin((i + 1) * (randomNonce + 1)) + 1) / 2) * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        }

        switch (sortKey) {
            case "new":
                arr = [...arr].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
            case "old":
                arr = [...arr].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                break;
            case "az":
                arr = [...arr].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
                break;
            case "za":
                arr = [...arr].sort((a, b) => (b.title || "").localeCompare(a.title || ""));
                break;
            default:
                break;
        }
        return arr;
    }, [images, activeTags, sortKey, randomMode, randomNonce]);

    // —— 城市/视图/排序 切换 —— //
    const onCityChange = (val) => {
        setCityKey(val);
        setImages([]);
        setPage(1);
        setHasMore(true);
        setRandomMode(false);
        window.scrollTo({top: 0, behavior: "smooth"});
    };

    const onSourcedChange = (val) => {
        setSourced(val);
        setImages([]);
        setPage(1);
        setHasMore(true);
        setRandomMode(false);
        window.scrollTo({top: 0, behavior: "smooth"});
    }

    const onSortChange = (val) => {
        setSortKey(val);
        setRandomMode(false);
    };

    // —— 标签 —— //
    const toggleTag = (tag) => {
        setActiveTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
    };

    // ===== Lightbox =====
    const openLightbox = (itemIdx, imageIdx = 0) => {
        setLbItemIdx(itemIdx);
        setLbImgIdx(imageIdx);
    };
    const closeLightbox = () => setLbItemIdx(-1);
    const getImagesOf = (item, start = 0) => {
        if (!item) return [];
        const arr = Array.isArray(item.src) && item.src.length > 0
            ? item.src
            : (item.thumb ? [item.thumb] : []);
        let s = Number.isFinite(start) ? Math.trunc(start) : 0;
        if (s < 0) s = arr.length + s;
        if (s < 0) s = 0;
        if (s > arr.length) s = arr.length;
        return arr.slice(s);
    };
    const showPrev = () => {
        if (lbItemIdx < 0 || filtered.length === 0) return;
        const currItem = filtered[lbItemIdx];
        const imgs = getImagesOf(currItem);
        if (lbImgIdx > 0) setLbImgIdx(lbImgIdx - 1);
        else {
            const prevItemIdx = (lbItemIdx - 1 + filtered.length) % filtered.length;
            const prevImgs = getImagesOf(filtered[prevItemIdx]);
            setLbItemIdx(prevItemIdx);
            setLbImgIdx(Math.max(0, prevImgs.length - 1));
        }
    };
    const showNext = () => {
        if (lbItemIdx < 0 || filtered.length === 0) return;
        const currItem = filtered[lbItemIdx];
        const imgs = getImagesOf(currItem);
        if (lbImgIdx < imgs.length - 1) setLbImgIdx(lbImgIdx + 1);
        else {
            const nextItemIdx = (lbItemIdx + 1) % filtered.length;
            setLbItemIdx(nextItemIdx);
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
    }, [lbItemIdx, lbImgIdx, filtered]);
    useEffect(() => {
        if (lbItemIdx >= 0 && lbItemIdx >= filtered.length) {
            setLbItemIdx(-1);
            setLbImgIdx(0);
        }
    }, [filtered.length, lbItemIdx]);

    // —— 全局滚轮调列数（仅在悬浮控制块时生效），步进 ±1，边界 [3, 10] —— //
    useEffect(() => {
        const onWheelGlobal = (e) => {
            if (!scaleHover) return;
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? COLUMN_STEP : -COLUMN_STEP;
            setScale((s) => Math.max(COLUMN_MIN, Math.min(s + delta, COLUMN_MAX)));
        };
        window.addEventListener("wheel", onWheelGlobal, {capture: true, passive: false});
        return () => window.removeEventListener("wheel", onWheelGlobal, true);
    }, [scaleHover]);
    const handleSearch = () => {
        const keyword = inputRef.current?.value.trim() || "";
        setPage(1);
        setImages([]);
        setHasMore(true);
        setRandomMode(false);
        // 这里直接把 keyword 存到一个状态
        setSearchKeyword(keyword);
    };

    const Toolbar = () => {
        const onPageSizeChange = (val) => {
            const n = parseInt(val, 10);
            const next = PAGE_SIZES.includes(n) ? n : DEFAULT_PAGE_SIZE;
            setPageSize(next);
            setImages([]);
            setPage(1);
            setHasMore(true);
            setRandomMode(false);
            window.scrollTo({top: 0, behavior: "smooth"});
        };

        const countText = hasClientFilter
            ? `${filtered.length}/${images.length} 个`
            : `${images.length}/${totalCount} 个`;

        return (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-base">
                {/* 左侧：标题 + 数量 */}
                <div className="flex items-center gap-3">
                    <span className="text-xl font-semibold">相册</span>
                    <span className="text-base text-gray-500">{countText}</span>
                </div>

                {/* 右侧：搜索 / 城市 / 排序 / 视图 / 列数 / 每页 / 打乱 */}
                <div className="flex flex-1 items-center gap-2 md:justify-end flex-wrap">
                    {/* 搜索（按你现有逻辑保留占位） */}
                    <div className="relative w-full md:w-80">
                        <input
                            ref={inputRef}
                            aria-label="搜索"
                            placeholder="搜索任意"
                            className="w-full rounded-2xl border border-gray-200 px-4 py-2 outline-none focus:ring focus:ring-gray-200 text-base"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSearch();   // 回车时触发搜索
                                }
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                        >
                            🔍
                        </button>
                    </div>


                    {/* 城市 */}
                    <select
                        className="rounded-2xl border border-gray-200 px-3 py-2 text-base"
                        value={cityKey}
                        onChange={(e) => onCityChange(e.target.value)}
                    >
                        {CITYS.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                    </select>

                    {/* 来源 */}
                    <select
                        className="rounded-2xl border border-gray-200 px-3 py-2 text-base"
                        value={sourced}
                        onChange={(e) => onSourcedChange(e.target.value)}
                    >
                        {SOURCED.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                    </select>

                    {/* 排序 */}
                    <select
                        className="rounded-2xl border border-gray-200 px-3 py-2 text-base"
                        value={sortKey}
                        onChange={(e) => onSortChange(e.target.value)}
                    >
                        {SORTS.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                    </select>

                    {/* 视图：瀑布流 / 列表 */}
                    <div className="flex rounded-2xl border border-gray-200 p-1">
                        {[
                            {key: "masonry", label: "瀑布流"},
                            {key: "list", label: "列表"},
                        ].map((v) => (
                            <button
                                key={v.key}
                                className={`px-3 py-1 rounded-2xl text-base ${view === v.key ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
                                onClick={() => setView(v.key)}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>

                    {/* 每列数量控制：滚轮 ±1，双击重置 */}
                    <div
                        ref={scaleBoxRef}
                        onMouseEnter={() => setScaleHover(true)}
                        onMouseLeave={() => setScaleHover(false)}
                        title={`滚轮调整每列数量（${COLUMN_MIN}–${COLUMN_MAX}，步进 ${COLUMN_STEP}），双击重置`}
                        tabIndex={0}
                        onDoubleClick={() => setScale(DEFAULT_COLUMNS)}
                        className="select-none cursor-ns-resize rounded-2xl border border-gray-200 px-3 py-2 overscroll-contain"
                        style={{overscrollBehavior: "contain"}}
                    >
                        每列展示 {scale} 个
                    </div>

                    {/* 每页数量 */}
                    <select
                        className="rounded-2xl border border-gray-200 px-3 py-2 text-base"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(e.target.value)}
                        title="每次请求的数据量"
                    >
                        {PAGE_SIZES.map((n) => (
                            <option key={n} value={n}>每页 {n}</option>
                        ))}
                    </select>

                    {/* 随机打乱（仅打乱项目，不请求） */}
                    <button
                        className="rounded-2xl border border-gray-200 px-3 py-2 hover:bg-gray-100"
                        onClick={() => {
                            setRandomMode(true);
                            setRandomNonce((k) => k + 1);
                        }}
                        title="随机打乱当前视图的项目顺序（不请求）"
                    >
                        随机打乱
                    </button>
                </div>
            </div>
        );
    };

    // —— 标签条 —— //
    const TagBar = () => (
        <div className="flex flex-wrap gap-2 text-base">
            {TAGS.map((t) => (
                <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1 rounded-2xl border ${activeTags.includes(t) ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 hover:bg-gray-100"}`}
                >
                    #{t}
                </button>
            ))}
            {activeTags.length > 0 && (
                <button onClick={() => setActiveTags([])}
                        className="px-3 py-1 rounded-2xl text-gray-600 hover:bg-gray-100">
                    清空筛选
                </button>
            )}
        </div>
    );

    // —— 两种展示视图 —— //
    const Gallery = () => {
        if (filtered.length === 0 && !loading) {
            return <div
                className="py-20 text-center text-gray-500 text-base">无结果，试试更少的筛选或更短的关键词。</div>;
        }

        // 列表
        if (view === "list") {
            return (
                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden bg白">
                    {filtered.map((it, idx) => (
                        <div key={`${it.id}-${idx}`} className="w-full flex items-start gap-4 p-3 hover:bg-gray-50">
                            {(it.src || []).map((url, i) => (
                                <img
                                    key={i}
                                    src={url}
                                    alt={`${it.title}-${i}`}
                                    loading="lazy"
                                    className="h-48 rounded-xl object-fill"
                                    onClick={() => openLightbox(idx, i)}
                                />
                            ))}
                            <div className="flex-1">
                                <a href={`/show/${it.id}`}
                                   className="font-bold text-base md:text-lg truncate hover:underline" title={it.title}>
                                    {it.title}
                                </a>
                                <div className="text-base md:text-lg text-gray-500 mt-1">
                                    {it.createdAt ? new Date(it.createdAt).toLocaleString() : ""}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(it.tags || []).map((tg) => (
                                        <button
                                            key={tg}
                                            onClick={() => toggleTag(tg)}
                                            className={`px-2 py-0.5 rounded-full border ${activeTags.includes(tg) ? "bg-gray-900 text白 border-gray-900" : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"}`}
                                            title={`筛选 #${tg}`}
                                        >
                                            #{tg}
                                        </button>
                                    ))}
                                </div>
                                {typeof it.price !== "undefined" && (
                                    <div className="text-base md:text-lg text-gray-500 mt-2">价格：{it.price}</div>
                                )}
                                {typeof it.sourced !== "undefined" && (
                                    <div className="text-base md:text-lg text-gray-500 mt-2">来源：{it.sourced}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // 瀑布流（列数由 scale 决定）
        const baseColumns = {default: 4, 1024: 3, 768: 2};
        const masonryCols = useMemo(() => {
            baseColumns.default = scale;
            return baseColumns;
        }, [scale]);

        return (
            <Masonry breakpointCols={masonryCols} className="flex gap-4" columnClassName="flex flex-col gap-4">
                {filtered.map((it, idx) => (
                    <figure key={`${it.id}-${idx}`} className="rounded-2xl">
                        <img key={`${it.id}-0`} src={it.thumb} alt={`${it.title}-0`} loading="lazy"
                             className="w-full h-auto rounded-2xl hover:opacity-95"
                             onClick={() => openLightbox(idx, 0)}
                        />
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {getImagesOf(it, 1).map((url, i) => (
                                <img key={`${it.id}-${i}`} src={url} alt={`${it.title}-${i}`}
                                     loading="lazy" className="h-24 rounded-lg object-cover cursor-zoom-in"
                                     onClick={() => openLightbox(idx, i)}
                                />
                            ))}
                        </div>
                        <figcaption className="mt-2 text-gray-600 flex items-center justify-between text-base">
                            <a href={`/show/${it.id}`}
                               className="truncate font-bold text-base md:text-lg hover:underline" title={it.title}>
                                {it.title}
                            </a>
                            {cityKey === "ALL" && (
                                <span className="text-base md:text-lg text-gray-400">{it.city || it.place || ""}</span>
                            )}
                        </figcaption>
                    </figure>
                ))}
            </Masonry>
        );
    };

    // —— 页面布局 —— //
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <main className="mx-auto max-w-full px-4 py-6 text-base">
                <div className="sticky top-0 z-10 bg-white">
                    <Toolbar/>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-10 gap-6 items-start">
                    <aside className="md:col-span-2">
                        <div className="md:sticky md:top-20">
                            <TagBar/>
                        </div>
                    </aside>

                    <section className="md:col-span-8">
                        <div className="mt-1">
                            <Gallery/>
                        </div>

                        {hasMore && activeTags.length === 0 && (
                            <div ref={sentinelRef} className="h-16 flex items-center justify-center text-gray-400">
                                {loading ? "加载中…" : "下拉加载更多"}
                            </div>
                        )}
                    </section>
                </div>

                {/* Lightbox */}
                {lbItemIdx >= 0 && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col"
                         onClick={closeLightbox}>
                        <div className="flex items-center justify之间 p-3 text-white">
                            <div className="text-base opacity-80">{filtered[lbItemIdx]?.title}</div>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    closeLightbox();
                                }}
                                        className="rounded-lg bg-white/10 px-3 py-1 text-base hover:bg-white/20">
                                    关闭 (Esc)
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center px-4 relative"
                             onClick={(e) => e.stopPropagation()}>
                            <button aria-label="上一张" onClick={showPrev}
                                    className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg白/10 hover:bg白/20 text白 px-3 py-2">←
                            </button>
                            {(() => {
                                const item = filtered[lbItemIdx];
                                const imgs = getImagesOf(item);
                                const url = imgs[lbImgIdx];
                                return (
                                    <img src={url} alt={item?.title}
                                         className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"/>
                                );
                            })()}
                            <button aria-label="下一张" onClick={showNext}
                                    className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg白/10 hover:bg白/20 text白 px-3 py-2">→
                            </button>
                        </div>

                        {(() => {
                            const item = filtered[lbItemIdx];
                            const total = getImagesOf(item).length;
                            return (
                                <div className="p-4 text-center text-gray-300 text-base">
                                    第 {lbItemIdx + 1} 个项目 — 第 {lbImgIdx + 1} / {total} 张
                                </div>
                            );
                        })()}
                    </div>
                )}
            </main>
        </div>
    );
}
