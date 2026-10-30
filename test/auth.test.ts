/* eslint-disable @typescript-eslint/no-floating-promises -- node:test's describe/it return promises that the runner already tracks */
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import * as mockttp from 'mockttp';
import { PineTest } from '../build/index.js';
import { expect } from 'chai';

describe('headers', () => {
	const mockServer = mockttp.getLocal();
	let pine: PineTest;
	let endpoint: mockttp.MockedEndpoint;
	const seenHeaders = async () => {
		const [request] = await endpoint.getSeenRequests();
		return request.headers;
	};
	before(async () => {
		await mockServer.start();
		pine = new PineTest({ apiPrefix: 'v1/' }, { app: mockServer.url });
	});
	beforeEach(async () => {
		endpoint = await mockServer.forGet('/v1/device').thenJson(200, { d: [] });
	});
	afterEach(() => {
		mockServer.reset();
	});
	after(async () => {
		await mockServer.stop();
	});

	it('should mark every request as https', async () => {
		await pine.get({ resource: 'device' }).expect(200);
		expect((await seenHeaders())['x-forwarded-proto']).to.equal('https');
	});

	it('should not send an Authorization header without a user', async () => {
		await pine.get({ resource: 'device' }).expect(200);
		expect((await seenHeaders()).authorization).to.be.undefined;
	});

	it('should send a string user as a bearer token', async () => {
		await pine
			.get({ resource: 'device', passthrough: { user: 'abc' } })
			.expect(200);
		expect((await seenHeaders()).authorization).to.equal('Bearer abc');
	});

	it('should send the token of a user object as a bearer token', async () => {
		await pine
			.get({ resource: 'device', passthrough: { user: { token: 'def' } } })
			.expect(200);
		expect((await seenHeaders()).authorization).to.equal('Bearer def');
	});

	it('should not send an Authorization header for a user object without a token', async () => {
		await pine
			.get({ resource: 'device', passthrough: { user: {} } })
			.expect(200);
		expect((await seenHeaders()).authorization).to.be.undefined;
	});

	it('should use the user of the client passthrough', async () => {
		const userPine = new PineTest(
			{ apiPrefix: 'v1/', passthrough: { user: 'ghi' } },
			{ app: mockServer.url },
		);
		await userPine.get({ resource: 'device' }).expect(200);
		expect((await seenHeaders()).authorization).to.equal('Bearer ghi');
	});
});
