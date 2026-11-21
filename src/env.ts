import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	GA4_MEASUREMENT_ID: { schema: (value) => value },
	GA4_API_SECRET: { schema: (value) => value }
});
