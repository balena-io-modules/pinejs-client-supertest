import type * as express from 'express';
import * as supertest from 'supertest';
import { UserParam } from './common';

export default function (app: express.Express | string, user?: UserParam) {
	// Can be an object with `token`, a JWT string or an API key string
	let token = user;
	if (typeof user === 'object' && user.token) {
		token = user.token;
	}
	// We have to cast `as any` because the types are poorly maintained
	// and don't support setting defaults
	const req: any = supertest.agent(app);
	req.set('X-Forwarded-Proto', 'https');

	if (typeof token === 'string') {
		req.set('Authorization', `Bearer ${token}`);
	}
	return req as ReturnType<typeof supertest.agent>;
}
