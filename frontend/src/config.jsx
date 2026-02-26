// src/config.jsx
// ---- 排序选项 ----
export const SORTS = [
    { key: "new", label: "从新到旧" },
    { key: "old", label: "从旧到新" },
    { key: "az", label: "标题 A→Z" },
    { key: "za", label: "标题 Z→A" },
];

// ---- 城市选项 ----
export const CITYS = [
    { key: "310000", label: "上海" },
    { key: "330100", label: "杭州" },
    { key: "510100", label: "成都" },
    { key: "110000", label: "北京" },
    { key: "440300", label: "深圳" },
    { key: "440100", label: "广州" },
    { key: "320100", label: "南京" },
    { key: "360100", label: "南昌" },
    { key: "ALL", label: "全部" },
];

export const SOURCED = [
    { key: "all", label: "全部" },
    { key: "51fengliu", label: "51风流" },
    { key: "xiaohonglou", label: "小红楼" },
    { key: "loufenggong", label: "楼凤宫" },
    { key: "xunhuange", label: "寻欢阁" }
];

// ---- 本地存储 KEYS (统一管理) ----
export const LS_KEYS = {
    cityKey: "ph_cityKey",
    view: "ph_view",
    sortKey: "ph_sortKey",
    scale: "ph_scale",
    pageSize: "ph_pageSize",
    sourced: "ph_sourced",
    showSidebar: "ph_showSidebar", // 记住侧边栏状态
};

// ---- 瀑布流列数 ----
export const COLUMN_MIN = 3;
export const COLUMN_MAX = 10;
export const COLUMN_STEP = 1;
export const DEFAULT_COLUMNS = 4;
export const DEFAULT_SORT = 'new';
export const DEFAULT_CITY = 'SH';
export const DEFAULT_SOURCED = 'all';
export const DEFAULT_VIEW = "masonry";

// ---- 分页 ----
export const PAGE_SIZES = [5, 25, 50, 100, 200];
export const DEFAULT_PAGE_SIZE = 50;