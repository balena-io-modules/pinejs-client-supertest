import type {
	AnyObject,
	AnyResource,
	ConstructorParams,
	ODataOptions,
	Params,
	PromiseResultTypes,
	Resource,
	RetryParameters,
} from 'pinejs-client-core';
import { PinejsClientCore } from 'pinejs-client-core';
import type * as express from 'express';
import type { CallbackHandler, Response, Test } from 'supertest';
import supertest from './supertest';
import { expect } from './chai';
import type { UserParam, Overwrite } from './common';
import type {
	PickDeferred,
	PickExpanded,
} from '@balena/abstract-sql-to-typescript';

type StringKeyOf<T> = keyof T & string;
type SelectPropsOf<T extends Resource['Read'], U extends ODataOptions<T>> =
	U['$select'] extends ReadonlyArray<StringKeyOf<T>>
		? U['$select'][number]
		: U['$select'] extends StringKeyOf<T>
			? U['$select']
			: never;
type ExpandPropsOf<T extends Resource['Read'], U extends ODataOptions<T>> =
	U['$expand'] extends ReadonlyArray<StringKeyOf<T>>
		? U['$expand'][number]
		: U['$expand'] extends { [key in StringKeyOf<T>]?: any }
			? StringKeyOf<U['$expand']>
			: never;

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
> extends PinejsClientCore<unknown, Model> {
	constructor(
		params: ConstructorParams,
		public backendParams: BackendParams,
	) {
		super(params);
	}

	public get<
		TResource extends StringKeyOf<Model>,
		TParams extends Params<Model[TResource]> & {
			options: {
				$count: NonNullable<ODataOptions<Model[TResource]['Read']>['$count']>;
			};
		},
	>(
		params: {
			resource: TResource;
		} & TParams,
	): PromiseResult<number>;
	public get<
		TResource extends StringKeyOf<Model>,
		TParams extends Params<Model[TResource]> & {
			id: NonNullable<Params<Model[TResource]>['id']>;
			options: NonNullable<
				Params<Model[TResource]>['options'] &
					(
						| {
								$select: NonNullable<
									NonNullable<Params<Model[TResource]>['options']>['$select']
								>;
						  }
						| {
								$expand: NonNullable<
									NonNullable<Params<Model[TResource]>['options']>['$expand']
								>;
						  }
					)
			>;
		},
	>(
		params: {
			resource: TResource;
		} & TParams,
	): PromiseResult<
		| NoInfer<
				PickDeferred<
					Model[TResource]['Read'],
					SelectPropsOf<
						Model[TResource]['Read'],
						NonNullable<TParams['options']>
					>
				> &
					PickExpanded<
						Model[TResource]['Read'],
						ExpandPropsOf<
							Model[TResource]['Read'],
							NonNullable<TParams['options']>
						>
					>
		  >
		| undefined
	>;
	public get<
		TResource extends StringKeyOf<Model>,
		TParams extends Params<Model[TResource]> & {
			id: NonNullable<Params<Model[TResource]>['id']>;
			resource: TResource;
		},
	>(
		params: { resource: TResource } & TParams,
	): PromiseResult<NoInfer<Model[TResource]['Read']> | undefined>;
	public get<
		TResource extends StringKeyOf<Model>,
		TParams extends Omit<Params<Model[TResource]>, 'id'> & {
			resource: TResource;
			options: NonNullable<
				Params<Model[TResource]>['options'] &
					(
						| {
								$select: NonNullable<
									NonNullable<Params<Model[TResource]>['options']>['$select']
								>;
						  }
						| {
								$expand: NonNullable<
									NonNullable<Params<Model[TResource]>['options']>['$expand']
								>;
						  }
					)
			>;
		},
	>(
		params: { resource: TResource } & TParams,
	): PromiseResult<
		NoInfer<
			Array<
				PickDeferred<
					Model[TResource]['Read'],
					SelectPropsOf<
						Model[TResource]['Read'],
						NonNullable<TParams['options']>
					>
				> &
					PickExpanded<
						Model[TResource]['Read'],
						ExpandPropsOf<
							Model[TResource]['Read'],
							NonNullable<TParams['options']>
						>
					>
			>
		>
	>;
	public get<TResource extends StringKeyOf<Model>>(
		params: { resource: TResource } & Omit<Params<Model[TResource]>, 'id'>,
	): PromiseResult<NoInfer<Array<Model[TResource]['Read']>>>;
	/**
	 * @deprecated GETing via `url` is deprecated
	 */
	public get<T extends Resource = AnyResource>(
		params: {
			resource?: undefined;
			url: NonNullable<Params<T>['url']>;
		} & Params<T>,
	): PromiseResult<PromiseResultTypes>;
	public get<T = any>(params: Params): PromiseResult<T>;
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
				const resultBody = this.transformGetResult(normalizedParams)(body);
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
	): PromiseResult<void>;
	/**
	 * @deprecated PUTing via `url` is deprecated
	 */
	public put<T extends Resource = AnyResource>(
		params: {
			resource?: undefined;
			url: NonNullable<Params<T>['url']>;
		} & Params<T>,
	): PromiseResult<void>;
	public put(params: Params<AnyResource>): PromiseResult<void> {
		return super.put(
			params as Parameters<PinejsClientCore<unknown, Model>['put']>[0],
		) as PromiseResult<
			ResolvableReturnType<PinejsClientCore<unknown, Model>['put']>
		>;
	}

	public patch<TResource extends StringKeyOf<Model>>(
		params: { resource: TResource; url?: undefined } & Params<Model[TResource]>,
	): PromiseResult<void>;
	/**
	 * @deprecated PATCHing via `url` is deprecated
	 */
	public patch<T extends Resource = AnyResource>(
		params: {
			resource?: undefined;
			url: NonNullable<Params<T>['url']>;
		} & Params<T>,
	): PromiseResult<void>;
	public patch(params: Params<AnyResource>): PromiseResult<void> {
		return super.patch(
			params as Parameters<PinejsClientCore<unknown, Model>['patch']>[0],
		) as PromiseResult<
			ResolvableReturnType<PinejsClientCore<unknown, Model>['patch']>
		>;
	}

	public post<TResource extends StringKeyOf<Model>>(
		params: { resource: TResource } & Params<Model[TResource]>,
	): PromiseResult<PickDeferred<Model[TResource]['Read']>>;
	/**
	 * @deprecated POSTing via `url` is deprecated
	 */
	public post<T extends Resource = AnyResource>(
		params: {
			resource?: undefined;
			url: NonNullable<Params<T>['url']>;
		} & Params<T>,
	): PromiseResult<AnyObject>;
	public post(params: Params<AnyResource>): PromiseResult<AnyObject> {
		return super.post(
			params as Parameters<PinejsClientCore<unknown, Model>['post']>[0],
		) as PromiseResult<
			ResolvableReturnType<PinejsClientCore<unknown, Model>['post']>
		>;
	}

	public delete<TResource extends StringKeyOf<Model>>(
		params: { resource: TResource } & Params<Model[TResource]>,
	): PromiseResult<void>;
	/**
	 * @deprecated DELETEing via `url` is deprecated
	 */
	public delete<T extends Resource = AnyResource>(
		params: {
			resource?: undefined;
			url: NonNullable<Params<T>['url']>;
		} & Params<T>,
	): PromiseResult<void>;
	public delete(params: Params<AnyResource>): PromiseResult<void> {
		return super.delete(
			params as Parameters<PinejsClientCore<unknown, Model>['delete']>[0],
		) as PromiseResult<
			ResolvableReturnType<PinejsClientCore<unknown, Model>['delete']>
		>;
	}

	public upsert(): never {
		throw new Error('upsert is not supported by pinejs-client-supertest');
	}

	public getOrCreate(): never {
		throw new Error('getOrCreate is not supported by pinejs-client-supertest');
	}

	public request(
		...args: Parameters<PinejsClientCore<unknown, Model>['request']>
	): PromiseResult<any> {
		return super.request(...args) as PromiseResult<any>;
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
