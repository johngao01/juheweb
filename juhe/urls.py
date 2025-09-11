from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.generic import TemplateView
from .views import DataViewSet, DataDetailViewSet

router = DefaultRouter()
router.register(r'data', DataViewSet, basename='data')
router.register(r'show', DataDetailViewSet, basename='dataDetail')
urlpatterns = [
    path('api/', include(router.urls)),
    path('', TemplateView.as_view(template_name='index.html')),  # 前端入口
    path('show/<str:id>', TemplateView.as_view(template_name='index.html')),  # 支持React路由
]
