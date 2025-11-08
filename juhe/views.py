from rest_framework import viewsets, mixins
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.db.models import Q

from .models import DataView
from .serializers import DataViewSerializer, DataViewDetailSerializer


class DefaultPagination(PageNumberPagination):
    # ✅ 给一个默认页大小，避免前端没传 pageSize 时关闭分页
    page_size = 50
    page_size_query_param = 'pageSize'
    max_page_size = 200

    def get_paginated_response(self, data):
        # ✅ 用 has_next() 更稳，避免 URL 拼接异常
        return Response({
            "items": data,
            "hasMore": self.page.has_next(),
            "next": self.get_next_link(),
            "prev": self.get_previous_link(),
            "count": self.page.paginator.count,
            "page": self.page.number,
        })


class DataViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = DataViewSerializer
    pagination_class = DefaultPagination

    SOURCED = {
        "51fengliu": "51风流",
        "xiaohonglou": "小红楼",
        "loufenggong": "楼凤宫",
    }

    def get_queryset(self):
        q = (self.request.query_params.get('q') or '').strip()
        city = self.request.query_params.get('city')
        sourced = self.request.query_params.get('sourced')
        qs = DataView.objects.filter(vaild__gt=0).order_by('-createtime')

        # ✅ 只有 q 非空才添加模糊匹配，避免 icontains(None) 的不确定行为
        if q:
            qs = qs.filter(Q(detail__icontains=q))

        # ✅ city_key=ALL 时不加城市过滤
        if city != "ALL":
            qs = qs.filter(city_code=city)
        if sourced != 'all':
            qs = qs.filter(sourced=self.SOURCED[sourced])
        return qs


class DataDetailViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    单条详情接口：GET /api/show/<id>
    """
    queryset = DataView.objects.filter(vaild__gt=0).order_by('-createtime')
    serializer_class = DataViewDetailSerializer
    lookup_field = 'index'
    lookup_url_kwarg = 'id'
