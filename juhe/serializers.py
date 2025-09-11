import os
import re
import json
from django.conf import settings
from rest_framework import serializers
from .models import DataView


# =========================
# 共用工具（去重）
# =========================
class MediaURLMixin:
    """把本地文件路径转换为可访问的 /media/ URL（绝对 URL）"""

    # [MOVE+REUSE] 从两个 Serializer 中抽出，避免重复
    def _path_to_media_url(self, path: str) -> str | None:
        if not path:
            return None
        if isinstance(path, str) and (path.startswith('http://') or path.startswith('https://')):
            return path

        norm = os.path.normpath(path)
        try:
            rel = os.path.relpath(norm, settings.MEDIA_ROOT)
            rel = rel.replace(os.sep, '/')
            media_url = settings.MEDIA_URL.rstrip('/') + '/' + rel.lstrip('/')
        except Exception:
            rel = norm.replace('\\', '/')
            if rel.startswith('data/'):
                rel = rel[len('data/'):]
            media_url = settings.MEDIA_URL.rstrip('/') + '/' + rel.lstrip('/')

        request = getattr(self, 'context', {}).get('request')
        return request.build_absolute_uri(media_url) if request else media_url

    # [ADD] 更健壮地解析 pic_info
    def _parse_pic_info(self, raw):
        """raw 可能是 JSON 字符串 / dict / None；异常时返回 None"""
        if not raw:
            return None
        try:
            if isinstance(raw, str):
                raw = raw.strip()
                if not raw:
                    return None
                return json.loads(raw)
            if isinstance(raw, dict):
                return raw
        except Exception:
            return None
        return None

    # [ADD] 根据 pic_info 构建 src 列表（list[str]）
    def _build_src_from_pic_info(self, obj) -> list[str]:
        info = self._parse_pic_info(getattr(obj, 'pic_info', None))
        if not info or not info.get('total'):
            return []

        try:
            save = info['pic_save_info']  # {platform, city, create_date}
            files = info.get('files') or []
        except Exception:
            return []

        urls = []
        for fname in files:
            full_path = os.path.join(settings.MEDIA_ROOT, save.get('platform', ''), save.get('city', ''),
                                     save.get('create_date', ''), fname)
            u = self._path_to_media_url(full_path)
            if u:
                urls.append(u)
        return urls

    # [REUSE] 提取 tags
    def _extract_tags(self, serverlist: str) -> list[str]:
        s = (serverlist or '')
        s = re.sub(r"[，；。：、！？,.!?:;\"'“”‘’()\[\]{}<>|/\\]", " ", s)
        parts = re.sub(r"\s+", " ", s).strip().split(" ") if s else []
        seen, tags = set(), []
        for p in parts:
            if p and p not in seen:
                seen.add(p)
                tags.append(p)
        return tags


# =========================
# 列表 Serializer
# =========================
class DataViewSerializer(MediaURLMixin, serializers.ModelSerializer):
    id = serializers.IntegerField(source='index')  # index -> id
    tags = serializers.SerializerMethodField()
    src = serializers.SerializerMethodField()

    class Meta:
        model = DataView
        fields = ['id', 'tags', 'src', 'address', 'age', 'beauty', 'city', 'place',
                  'createtime', 'title', 'price']

    def get_tags(self, obj):
        return self._extract_tags(getattr(obj, 'serverlist', '') or '')

    def get_src(self, obj):
        # [FIX] 统一返回 list[str]
        urls = self._build_src_from_pic_info(obj)
        return urls  # list


# =========================
# 详情 Serializer
# =========================
class DataViewDetailSerializer(MediaURLMixin, serializers.ModelSerializer):
    # [ADD] 详情同样提供 id（前端读 item.id）
    id = serializers.IntegerField(source='index', read_only=True)
    # [ADD] 兼容前端字段名：detail -> miaoshu
    src = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()

    class Meta:
        model = DataView
        # [FIX] 保留 index 兼容旧用法，同时提供 id、detail、tags、src
        fields = [
            'id', 'index', 'title', 'age', 'beauty', 'price',
            'miaoshu', 'address', 'district', 'patime',
            'createtime', 'qq', 'wechat', 'phone', 'serverlist',
            'city', 'place', 'tags', 'src'
        ]

    def get_tags(self, obj):
        return self._extract_tags(getattr(obj, 'serverlist', '') or '')

    def get_src(self, obj):
        # [FIX] 始终返回 list[str]，包含回退逻辑
        urls = self._build_src_from_pic_info(obj)
        return urls
