import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	ANALYTICS_ENABLED: { schema: (value) => value === 'true' },
	GA4_MEASUREMENT_ID: { schema: (value) => value },
	GA4_API_SECRET: { schema: (value) => value }
});
