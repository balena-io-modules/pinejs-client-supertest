import * as Bluebird from 'bluebird';
import { PinejsClientCoreFactory } from 'pinejs-client-core';
import type * as express from 'express';
import type { CallbackHandler, Response, Test } from 'supertest';
import supertest from './supertest';
import { expect } from './chai';
import type { UserParam, Overwrite } from './common';

type supportedMethod = 'get' | 'put' | 'patch' | 'post' | 'delete';

// Use `T = any` by default, just like supertest does, but also support specifying
// the expected type, so that we can avoid the ugly `() as Something` castings.
type PromiseResult<T = any> = Omit<Test, 'expect' | 'then'> &
	Promise<Overwrite<Response, { body: T }>> & {
		// Atm we can't override just the return type of a method w/o re-defining all its variants.
		expect(
			statusOrCheckerOrBody:
				| number
				| ((res: Response) => any)
				| string
				| RegExp
				| object,
			callback?: CallbackHandler,
		): PromiseResult<T>;
		expect(
			status: number,
			body: any,
			callback?: CallbackHandler,
		): PromiseResult<T>;
		expect(
			field: string,
			val: string | RegExp,
			callback?: CallbackHandler,
		): PromiseResult<T>;
	};

interface BackendParams {
	app: express.Express;
}

/** A pine testing client fused with the api of supertest */
export class PineTest extends PinejsClientCoreFactory(Bluebird)<
	PineTest,
	PromiseResult,
	PromiseResult
> {
	constructor(
		params: PinejsClientCoreFactory.Params,
		public backendParams: BackendParams,
	) {
		super(params);
	}

	public get<T = any>(
		params: PinejsClientCoreFactory.Params,
	): PromiseResult<T> {
		// Use a different const, since if we just re-assign `params`
		// inside the `expect(() => {})` TS forgets that it's ensured
		// to be a ParamsObj and will complain.
		const normalizedParams =
			typeof params === 'string' ? { url: params } : params;
		normalizedParams.method = 'GET';

		return this.request(normalizedParams).expect((response) => {
			const { error, body } = response;
			if (error) {
				return;
			}

			expect(() => {
				response.body = this.transformGetResult(normalizedParams)(body);
			}).to.not.throw();
		});
	}

	public post<T = any>(
		params: PinejsClientCoreFactory.Params,
	): PromiseResult<T> {
		return super.post(params);
	}

	_request({
		method,
		url,
		body,
		user,
	}: {
		method: supportedMethod;
		url: string;
		body: PinejsClientCoreFactory.ParamsObj['body'];
		user?: UserParam;
	}) {
		const { app } = this.backendParams;
		const supertestClient = supertest(app, user);

		const methodName = method.toLowerCase() as supportedMethod;
		let result = supertestClient[methodName](`/${url}`);
		if (body != null) {
			result = result.send(body);
		}
		return result;
	}
}