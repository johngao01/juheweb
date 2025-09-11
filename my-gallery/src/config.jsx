// config.jsx
// ---- 排序选项 ----
export const SORTS = [
    {key: "new", label: "从新到旧"},
    {key: "old", label: "从旧到新"},
    {key: "az", label: "标题 A→Z"},
    {key: "za", label: "标题 Z→A"},
];

// ---- 城市选项 ----
export const CITYS = [
    {key: "SH", label: "上海"},
    {key: "HZ", label: "杭州"},
    {key: "CD", label: "成都"},
    {key: "BJ", label: "北京"},
    {key: "SZ", label: "深圳"},
    {key: "GZ", label: "广州"},
    {key: "NJ", label: "南京"},
    {key: "ALL", label: "全部"},
];

// ---- 瀑布流列数（“每列展示多少个”）----
// 约束：最少 3，最多 10，每次 +1 / -1
export const COLUMN_MIN = 3;
export const COLUMN_MAX = 10;
export const COLUMN_STEP = 1;
export const DEFAULT_COLUMNS = 4; // 双击重置为此默认值
export const DEFAULT_SORT = 'new'
export const DEFAULT_CITY = 'SH'
export const DEFAULT_VIEW = "masonry"

// ---- 请求分页尺寸 ----
export const PAGE_SIZES = [25, 50, 100, 200];
export const DEFAULT_PAGE_SIZE = 50;
