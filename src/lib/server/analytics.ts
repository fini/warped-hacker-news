import { analyticsEvents, type AnalyticsEvent } from '../analytics-events';

export function analyticsConfig(measurementId?: string, apiSecret?: string) {
	return /^G-[A-Z0-9]+$/.test(measurementId ?? '') && measurementId && apiSecret
		? { measurementId, apiSecret }
		: null;
}

export async function readSmallBody(request: Request): Promise<string | null> {
	const reader = request.body?.getReader();
	if (!reader) return null;
	const decoder = new TextDecoder();
	let size = 0;
	let text = '';
	try {
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) break;
			size += chunk.value.byteLength;
			if (size > 1024) {
				void reader.cancel().catch(() => {});
				return null;
			}
			text += decoder.decode(chunk.value, { stream: true });
		}
		return text + decoder.decode();
	} catch {
		return null;
	} finally {
		reader.releaseLock();
	}
}

export async function readAnalyticsBody(request: Request): Promise<unknown> {
	const body = await readSmallBody(request);
	try {
		return body === null ? null : JSON.parse(body);
	} catch {
		return null;
	}
}

export function measurementPayload(value: unknown, origin: string) {
	if (!value || typeof value !== 'object') return null;
	const { event, detail, clientId, sessionId, engagementMs } = value as Record<string, unknown>;
	if (typeof event !== 'string' || !Object.hasOwn(analyticsEvents, event)) return null;
	const name = event as AnalyticsEvent;
	const options: readonly string[] = analyticsEvents[name];
	if (
		options.length ? typeof detail !== 'string' || !options.includes(detail) : detail !== undefined
	)
		return null;
	if (
		typeof clientId !== 'string' ||
		!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(clientId) ||
		typeof sessionId !== 'number' ||
		!Number.isSafeInteger(sessionId) ||
		sessionId <= 0 ||
		typeof engagementMs !== 'number' ||
		!Number.isSafeInteger(engagementMs) ||
		engagementMs < 1 ||
		engagementMs > 60_000
	)
		return null;

	const params = {
		session_id: sessionId,
		engagement_time_msec: engagementMs,
		...(name === 'page_view'
			? {
					// A synthetic location contains only the allowlisted screen category.
					page_location: new URL(`/screen/${detail}`, origin).href,
					page_title: `Warped HN · ${detail}`
				}
			: typeof detail === 'string'
				? { action: detail }
				: {})
	};
	return {
		client_id: clientId,
		consent: { ad_user_data: 'DENIED', ad_personalization: 'DENIED' },
		events: [{ name, params }]
	};
}

export async function sendAnalytics(
	config: NonNullable<ReturnType<typeof analyticsConfig>>,
	payload: NonNullable<ReturnType<typeof measurementPayload>>,
	fetcher = fetch
) {
	const endpoint = new URL('https://region1.google-analytics.com/mp/collect');
	endpoint.searchParams.set('measurement_id', config.measurementId);
	endpoint.searchParams.set('api_secret', config.apiSecret);
	try {
		const response = await fetcher(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'Warped-HN',
				// Use a reserved documentation address for outbound forwarding headers.
				'CF-Connecting-IP': '192.0.2.1',
				'X-Forwarded-For': '192.0.2.1',
				'X-Real-IP': '192.0.2.1'
			},
			body: JSON.stringify(payload),
			redirect: 'error',
			signal: AbortSignal.timeout(4000)
		});
		await response.body?.cancel();
	} catch {
		// Analytics is best effort. Never log the collector URL or payload.
	}
}
