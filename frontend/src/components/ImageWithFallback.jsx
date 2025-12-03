import React, { useState } from 'react';

export default function ImageWithFallback({ src, alt, className, ...props }) {
    const [status, setStatus] = useState('loading'); // loading | loaded | error

    return (
        <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
            {/* 1. 骨架屏占位（加载中显示） */}
            {status === 'loading' && (
                <div className="absolute inset-0 animate-pulse bg-gray-200" />
            )}

            {/* 2. 失败占位（加载失败显示） */}
            {status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400 text-xs">
                    图片失效
                </div>
            )}

            {/* 3. 实际图片 */}
            <img
                {...props}
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                    status === 'loaded' ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
                loading="lazy"
            />
        </div>
    );
}