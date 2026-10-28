/* eslint-disable @typescript-eslint/no-floating-promises -- node:test's describe/it return promises that the runner already tracks */
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import * as mockttp from 'mockttp';
import { PineTest } from '../build/index.js';
import { expect } from 'chai';

describe('unsupported features', () => {
	const mockServer = mockttp.getLocal();
	let pine: PineTest;
	let anyRequest: mockttp.MockedEndpoint;
	before(async () => {
		await mockServer.start();
		pine = new PineTest({ apiPrefix: 'v1/' }, { app: mockServer.url });
	});
	beforeEach(async () => {
		anyRequest = await mockServer.forAnyRequest().thenJson(200, { d: [] });
	});
	afterEach(() => {
		mockServer.reset();
	});
	after(async () => {
		await mockServer.stop();
	});

	it('upsert should throw', () => {
		expect(() => pine.upsert()).to.throw(/upsert is not supported/);
	});

	it('getOrCreate should throw', () => {
		expect(() => pine.getOrCreate()).to.throw(/getOrCreate is not supported/);
	});

	it('should throw when retrying is requested', async () => {
		expect(() =>
			pine.get({
				resource: 'device',
				retry: { minDelayMs: 1, maxDelayMs: 1, maxAttempts: 2 },
			}),
		).to.throw(/Cannot use retry with supertest/);
		expect(await anyRequest.getSeenRequests()).to.have.lengthOf(0);
	});

	it('should allow explicitly disabling retries', async () => {
		const retryPine = new PineTest(
			{
				apiPrefix: 'v1/',
				retry: { minDelayMs: 1, maxDelayMs: 1, maxAttempts: 2 },
			},
			{ app: mockServer.url },
		);
		await retryPine.get({ resource: 'device', retry: false }).expect(200);
		expect(await anyRequest.getSeenRequests()).to.have.lengthOf(1);
	});
});
