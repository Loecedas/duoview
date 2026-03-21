export function getEnv(key: string): string {
    return (process.env as Record<string, string | undefined>)[key] || (import.meta.env as Record<string, string>)[key] || '';
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
