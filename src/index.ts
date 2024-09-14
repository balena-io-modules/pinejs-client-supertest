import type {
	AnyObject,
	AnyResource,
	ConstructorParams,
	OptionsToResponse,
	Params,
	Resource,
	RetryParameters,
} from 'pinejs-client-core';
import { PinejsClientCore } from 'pinejs-client-core';
import type * as express from 'express';
import type { CallbackHandler, Response, Test } from 'supertest';
import supertest from './supertest';
import { expect } from './chai';
import type { UserParam, Overwrite } from './common';
import type { PickDeferred } from '@balena/abstract-sql-to-typescript';

type StringKeyOf<T> = keyof T & string;

type supportedMethod = 'get' | 'put' | 'patch' | 'post' | 'delete';

// Use `T = any` by default, just like supertest does, but also support specifying
// the expected type, so that we can avoid the ugly `() as Something` castings.
export type PromiseResult<T = any> = Promise<T> &
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
export class PineTest<
	Model extends {
		[key in keyof Model]: Resource;
	} = {
		[key in string]: AnyResource;
	},
> extends PinejsClientCore<Model> {
	constructor(
		params: ConstructorParams,
		public backendParams: BackendParams,
	) {
		super(params);
	}

	public get<
		TResource extends StringKeyOf<Model>,
		TParams extends Params<Model[TResource]> & {
			resource: TResource;
		},
	>(
		params: { resource: TResource } & TParams,
	): PromiseResult<
		NoInfer<
			OptionsToResponse<
				Model[TResource]['Read'],
				NonNullable<TParams['options']>,
				TParams['id']
			>
		>
	>;
	public get<T = any>(params: Params): PromiseResult<T>;
	public get<T = any>(params: Params): PromiseResult<T> {
		params.method = 'GET';

		return this.request(params).expect((response) => {
			const { error, body } = response;
			if (error) {
				return;
			}

			expect(() => {
				const resultBody = this.transformGetResult(params, body);
				// We need to use Object.defineProperty in order to be able to set undefined
				// as the response body value, since superagent uses a getter which re-parses
				// the body whenever it is undefined.
				// See: https://github.com/ladjs/superagent/blob/1c8338b2e0a3b8f604d08acc7f3cbe305be1e571/src/node/response.js#L54
				Object.defineProperty(response, 'body', {
					value: resultBody,
				});
			}).to.not.throw();
		}) as PromiseResult<T>;
	}

	public put<TResource extends StringKeyOf<Model>>(
		params: { resource: TResource; url?: undefined } & Params<Model[TResource]>,
	): PromiseResult<void> {
		return super.put(
			params as Parameters<PinejsClientCore<Model>['put']>[0],
		) as PromiseResult<ResolvableReturnType<PinejsClientCore<Model>['put']>>;
	}

	public patch<TResource extends StringKeyOf<Model>>(
		params: { resource: TResource; url?: undefined } & Params<Model[TResource]>,
	): PromiseResult<void> {
		return super.patch(
			params as Parameters<PinejsClientCore<Model>['patch']>[0],
		) as PromiseResult<ResolvableReturnType<PinejsClientCore<Model>['patch']>>;
	}

	public post<TResource extends StringKeyOf<Model>>(
		params: { resource: TResource } & Params<Model[TResource]>,
	): PromiseResult<PickDeferred<Model[TResource]['Read']>> {
		return super.post(
			params as Parameters<PinejsClientCore<Model>['post']>[0],
		) as PromiseResult<ResolvableReturnType<PinejsClientCore<Model>['post']>>;
	}

	public delete<TResource extends StringKeyOf<Model>>(
		params: { resource: TResource } & Params<Model[TResource]>,
	): PromiseResult<void> {
		return super.delete(
			params as Parameters<PinejsClientCore<Model>['delete']>[0],
		) as PromiseResult<ResolvableReturnType<PinejsClientCore<Model>['delete']>>;
	}

	public upsert(): never {
		throw new Error('upsert is not supported by pinejs-client-supertest');
	}

	public getOrCreate(): never {
		throw new Error('getOrCreate is not supported by pinejs-client-supertest');
	}

	public request(
		...args: Parameters<PinejsClientCore<Model>['request']>
	): PromiseResult {
		return super.request(...args) as PromiseResult;
	}

	protected callWithRetry<T>(
		fnCall: () => Promise<T>,
		retry?: RetryParameters,
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
		body: AnyObject;
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
