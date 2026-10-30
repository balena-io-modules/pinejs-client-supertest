/* eslint-disable @typescript-eslint/no-floating-promises -- node:test's describe/it return promises that the runner already tracks */
import { after, afterEach, before, describe, it } from 'node:test';
import * as mockttp from 'mockttp';
import { PineTest } from '../build/index.js';
import { expect } from 'chai';

describe('writes', () => {
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

	it('post should send the body and resolve with the created resource', async () => {
		const endpoint = await mockServer
			.forPost('/v1/device')
			.thenJson(201, { id: 1, device_name: 'a' });
		const { body } = await pine
			.post({ resource: 'device', body: { device_name: 'a' } })
			.expect(201);
		const [request] = await endpoint.getSeenRequests();
		expect(await request.body.getJson()).to.deep.equal({ device_name: 'a' });
		expect(body).to.deep.equal({ id: 1, device_name: 'a' });
	});

	it('post should support actions', async () => {
		const endpoint = await mockServer
			.forPost('/v1/device(1)/restart')
			.thenJson(200, { ok: true });
		const { body } = await pine
			.post({ resource: 'device', id: 1, action: 'restart', body: { a: 1 } })
			.expect(200);
		const [request] = await endpoint.getSeenRequests();
		expect(await request.body.getJson()).to.deep.equal({ a: 1 });
		expect(body).to.deep.equal({ ok: true });
	});

	it('put should send the body to the resource url', async () => {
		const endpoint = await mockServer.forPut('/v1/device(1)').thenReply(200);
		await pine
			.put({ resource: 'device', id: 1, body: { device_name: 'b' } })
			.expect(200);
		const [request] = await endpoint.getSeenRequests();
		expect(await request.body.getJson()).to.deep.equal({ device_name: 'b' });
	});

	it('patch should send the body to the resource url', async () => {
		const endpoint = await mockServer.forPatch('/v1/device(1)').thenReply(200);
		await pine
			.patch({ resource: 'device', id: 1, body: { device_name: 'b' } })
			.expect(200);
		const [request] = await endpoint.getSeenRequests();
		expect(await request.body.getJson()).to.deep.equal({ device_name: 'b' });
	});

	it('delete should request the filtered resource url', async () => {
		const endpoint = await mockServer.forDelete('/v1/device').thenReply(200);
		await pine
			.delete({ resource: 'device', options: { $filter: { id: 1 } } })
			.expect(200);
		const [request] = await endpoint.getSeenRequests();
		expect(request.path).to.equal('/v1/device?$filter=id%20eq%201');
		expect(await request.body.getText()).to.equal('');
	});

	it('request should resolve with the raw response', async () => {
		await mockServer.forGet('/v1/device').thenJson(200, { d: [{ id: 1 }] });
		const { body } = await pine
			.request({ method: 'GET', url: 'device' })
			.expect(200);
		expect(body).to.deep.equal({ d: [{ id: 1 }] });
	});
});
