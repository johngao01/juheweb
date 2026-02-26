from pathlib import Path
import os
import sys

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'dev-secret-key-change-me'
DEBUG = True
ALLOWED_HOSTS = ['198.46.143.26', '127.0.0.1', 'juhe.tiktoksave.top']
# 添加React构建的静态文件目录
REACT_BUILD_DIR = os.path.join(BASE_DIR, 'react_build')

if sys.platform.startswith('win'):
    password = '123456'
    MEDIA_ROOT = os.path.join('G:\juhe\pics')  # 实际存放路径
elif sys.platform == 'linux':
    password = '31305a0fbd'
    MEDIA_ROOT = os.path.join('/root/juhe/pics')
else:
    password = '31305a0fbd'
    MEDIA_ROOT = os.path.join('/root/juhe/pics')
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'juhe',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'juheweb.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(REACT_BUILD_DIR),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'juheweb.wsgi.application'

# 数据库配置：根据你的实际连接修改
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'juhe',
        'USER': 'root',
        'PASSWORD': password,
        'HOST': '127.0.0.1',
        'PORT': '3306',
        'OPTIONS': {'charset': 'utf8mb4'},
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = False

STATIC_URL = '/static/'
# 生产环境可启用以下两行：
STATIC_ROOT = BASE_DIR / 'staticfiles'
# 并运行 collectstatic
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 30,
}

MEDIA_URL = '/media/'  # URL 前缀

# 静态文件配置
STATICFILES_DIRS = [
    os.path.join(REACT_BUILD_DIR, 'static'),  # React的静态资源
]
