/**
 * 跨平台环境配置与密钥提取工具
 * 支持 Cloudflare Workers (cloudflare:workers),
 * Node.js (process.env), 以及 Vite / Astro (import.meta.env)
 */

let workersModule: any = undefined;

try {
    // @ts-ignore
    workersModule = await import('cloudflare:workers');
} catch {
    // 非 Cloudflare Workers 运行时或构建阶段，忽略
}

export function getRuntimeEnv(locals?: any): Record<string, any> {
    try {
        if (workersModule?.env && typeof workersModule.env === 'object') {
            return workersModule.env;
        }
    } catch {
        // 忽略异常
    }

    if (locals && typeof locals === 'object') {
        const directEnv = (locals as any).env;
        if (directEnv && typeof directEnv === 'object') {
            return directEnv;
        }
    }

    return {};
}

export function getEnv(key: string, locals?: any): string {
    // 1. 优先读取 Cloudflare Workers 运行时环境 (cloudflare:workers / locals.env)
    try {
        const runtimeEnv = getRuntimeEnv(locals);
        if (runtimeEnv && runtimeEnv[key] !== undefined && runtimeEnv[key] !== null) {
            const val = String(runtimeEnv[key]).trim();
            if (val) return val;
        }
    } catch {
        // 忽略异常
    }

    // 2. 读取 Node.js 环境变量 (process.env)
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined && process.env[key] !== null) {
        const val = String(process.env[key]).trim();
        if (val) return val;
    }

    // 3. 读取 Vite / Astro 构建注入的环境变量 (import.meta.env)
    try {
        const metaEnv = (import.meta as any).env as Record<string, any> | undefined;
        if (metaEnv && metaEnv[key] !== undefined && metaEnv[key] !== null) {
            const val = String(metaEnv[key]).trim();
            if (val) return val;
        }
    } catch {
        // 忽略异常
    }

    return '';
}

export function jsonResponse(
    data: unknown,
    status = 200,
    options?: { cacheControl?: string }
): Response {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
    };
    if (options?.cacheControl) {
        headers['Cache-Control'] = options.cacheControl;
    }
    return new Response(JSON.stringify(data), { status, headers });
}
