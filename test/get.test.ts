/* eslint-disable @typescript-eslint/no-floating-promises -- node:test's describe/it return promises that the runner already tracks */
import { after, afterEach, before, describe, it } from 'node:test';
import * as mockttp from 'mockttp';
import { PineTest } from '../build/index.js';
import { expect } from 'chai';

describe('get', () => {
	const mockServer = mockttp.getLocal();
	let pine: PineTest;
	before(async () => {
		await mockServer.start();
		pine = new PineTest({ apiPrefix: 'v1/' }, { app: mockServer.url });
	});
	afterEach(() => {
		mockServer.reset();
	});
	after(async () => {
		await mockServer.stop();
	});

	it('should compile the query into the request url', async () => {
		const endpoint = await mockServer
			.forGet('/v1/device')
			.thenJson(200, { d: [] });
		await pine
			.get({
				resource: 'device',
				options: { $select: ['id', 'device_name'], $filter: { id: 1 } },
			})
			.expect(200);
		const requests = await endpoint.getSeenRequests();
		expect(requests).to.have.lengthOf(1);
		expect(requests[0].path).to.equal(
			'/v1/device?$select=id,device_name&$filter=id%20eq%201',
		);
	});

	it('should resolve with the `d` array as the response body', async () => {
		await mockServer
			.forGet('/v1/device')
			.thenJson(200, { d: [{ id: 1 }, { id: 2 }] });
		const { body } = await pine.get({ resource: 'device' }).expect(200);
		expect(body).to.deep.equal([{ id: 1 }, { id: 2 }]);
	});

	it('should resolve with the single result as the body when an id is passed', async () => {
		await mockServer.forGet('/v1/device(1)').thenJson(200, { d: [{ id: 1 }] });
		const { body } = await pine.get({ resource: 'device', id: 1 }).expect(200);
		expect(body).to.deep.equal({ id: 1 });
	});

	it('should resolve with an undefined body when an id is passed and nothing is found', async () => {
		await mockServer.forGet('/v1/device(1)').thenJson(200, { d: [] });
		const { body } = await pine.get({ resource: 'device', id: 1 }).expect(200);
		expect(body).to.be.undefined;
	});

	it('should resolve with the count as the body for $count', async () => {
		await mockServer.forGet('/v1/device/$count').thenJson(200, { d: 5 });
		const { body } = await pine
			.get({ resource: 'device', options: { $count: {} } })
			.expect(200);
		expect(body).to.equal(5);
	});

	it('should leave the body of error responses untouched', async () => {
		await mockServer
			.forGet('/v1/device')
			.thenJson(401, { message: 'Unauthorized' });
		const { body } = await pine.get({ resource: 'device' }).expect(401);
		expect(body).to.deep.equal({ message: 'Unauthorized' });
	});

	it('should fail when multiple results are returned for an id', async () => {
		await mockServer
			.forGet('/v1/device(1)')
			.thenJson(200, { d: [{ id: 1 }, { id: 2 }] });
		let error: unknown;
		try {
			await pine.get({ resource: 'device', id: 1 }).expect(200);
		} catch (err) {
			error = err;
		}
		expect(error)
			.to.be.an.instanceOf(Error)
			.with.property('message')
			.that.matches(/Returned multiple results/);
	});

	it('should fail when a successful response is not an OData response', async () => {
		await mockServer.forGet('/v1/device').thenJson(200, { notD: [] });
		let error: unknown;
		try {
			await pine.get({ resource: 'device' }).expect(200);
		} catch (err) {
			error = err;
		}
		expect(error)
			.to.be.an.instanceOf(Error)
			.with.property('message')
			.that.matches(/Invalid response received/);
	});

	it('should use the per request apiPrefix', async () => {
		const endpoint = await mockServer
			.forGet('/v2/device')
			.thenJson(200, { d: [] });
		await pine.get({ apiPrefix: 'v2/', resource: 'device' }).expect(200);
		expect(await endpoint.getSeenRequests()).to.have.lengthOf(1);
	});

	it('should keep the app when cloned', async () => {
		await mockServer.forGet('/v3/device').thenJson(200, { d: [{ id: 1 }] });
		const { body } = await pine
			.clone({ apiPrefix: 'v3/' })
			.get({ resource: 'device' })
			.expect(200);
		expect(body).to.deep.equal([{ id: 1 }]);
	});
});
