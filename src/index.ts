import { PinejsClientCore, Params } from 'pinejs-client-core';
import type * as express from 'express';
import type { CallbackHandler, Response, Test } from 'supertest';
import supertest from './supertest';
import { expect } from './chai';
import type { UserParam, Overwrite } from './common';

type supportedMethod = 'get' | 'put' | 'patch' | 'post' | 'delete';

// Use `T = any` by default, just like supertest does, but also support specifying
// the expected type, so that we can avoid the ugly `() as Something` castings.
type PromiseResult<T = any> = Promise<T> &
	Omit<Test, 'expect' | 'then'> &
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
type Resolvable<R> = R | PromiseLike<R>;
type ResolvableReturnType<T extends (...args: any[]) => any> = T extends (
	...args: any[]
) => Resolvable<infer R>
	? R
	: any;

interface BackendParams {
	app: express.Express | string;
}

/** A pine testing client fused with the api of supertest */
export class PineTest extends PinejsClientCore<PineTest> {
	constructor(params: Params, public backendParams: BackendParams) {
		super(params);
	}

	public get<T = any>(params: Params): PromiseResult<T> {
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
		}) as PromiseResult<T>;
	}

	public put(
		...args: Parameters<PinejsClientCore<PineTest>['put']>
	): PromiseResult<ResolvableReturnType<PinejsClientCore<PineTest>['put']>> {
		return super.put(...args) as PromiseResult<
			ResolvableReturnType<PinejsClientCore<PineTest>['put']>
		>;
	}

	public patch(
		...args: Parameters<PinejsClientCore<PineTest>['patch']>
	): PromiseResult<ResolvableReturnType<PinejsClientCore<PineTest>['patch']>> {
		return super.patch(...args) as PromiseResult<
			ResolvableReturnType<PinejsClientCore<PineTest>['patch']>
		>;
	}

	public post(
		...args: Parameters<PinejsClientCore<PineTest>['post']>
	): PromiseResult<ResolvableReturnType<PinejsClientCore<PineTest>['post']>> {
		return super.post(...args) as PromiseResult<
			ResolvableReturnType<PinejsClientCore<PineTest>['post']>
		>;
	}

	public delete(
		...args: Parameters<PinejsClientCore<PineTest>['delete']>
	): PromiseResult<ResolvableReturnType<PinejsClientCore<PineTest>['delete']>> {
		return super.delete(...args) as PromiseResult<
			ResolvableReturnType<PinejsClientCore<PineTest>['delete']>
		>;
	}

	public upsert(): never {
		throw new Error('upsert is not supported by pinejs-client-supertest');
	}

	public getOrCreate(): never {
		throw new Error('getOrCreate is not supported by pinejs-client-supertest');
	}

	public request(
		...args: Parameters<PinejsClientCore<PineTest>['request']>
	): PromiseResult<any> {
		return super.request(...args) as PromiseResult<any>;
	}

	protected callWithRetry<T>(
		fnCall: () => Promise<T>,
		retry?: Params['retry'],
	): Promise<T> {
		if ((retry ?? this.retry) === false) {
			return fnCall();
		}
		throw new Error('Cannot use retry with supertest');
	}

	_request({
		method,
		url,
		body,
		user,
	}: {
		method: supportedMethod;
		url: string;
		body: Params['body'];
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
