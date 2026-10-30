// Compile-time only assertions, checked by `tsc -p tsconfig.test.json` and never executed.
/* eslint-disable @typescript-eslint/no-unused-vars -- values are only assigned so that their types can be asserted */
import type { PineTest } from '../build/index.js';

type Equals<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
		? true
		: false;
const expectType = <_T extends true>() => {
	// noop
};

interface Application {
	Read: {
		id: number;
		app_name: string;
		owns__device: Array<Device['Read']>;
	};
	Write: {
		id: number;
		app_name: string;
	};
}
interface Device {
	Read: {
		id: number;
		device_name: string;
		belongs_to__application: { __id: number } | [Application['Read']];
	};
	Write: {
		id: number;
		device_name: string;
		belongs_to__application: number;
	};
}
interface Model {
	application: Application;
	device: Device;
}

export async function typedModel(pine: PineTest<Model>) {
	const { body: devices } = await pine
		.get({ resource: 'device', options: { $select: ['id', 'device_name'] } })
		.expect(200);
	expectType<
		Equals<typeof devices, Array<{ id: number; device_name: string }>>
	>();

	const { body: device } = await pine.get({
		resource: 'device',
		id: 1,
		options: { $select: 'id' },
	});
	expectType<Equals<typeof device, { id: number } | undefined>>();

	const { body: count } = await pine.get({
		resource: 'device',
		options: { $count: {} },
	});
	expectType<Equals<typeof count, number>>();

	const { body: created } = await pine.post({
		resource: 'application',
		body: { app_name: 'a' },
	});
	expectType<
		Equals<
			typeof created,
			{ id: number; app_name: string; owns__device: never }
		>
	>();

	// @ts-expect-error put does not accept a url
	await pine.put({ resource: 'device', url: 'device' });
	// @ts-expect-error patch does not accept a url
	await pine.patch({ resource: 'device', url: 'device' });
	// @ts-expect-error upsert is not supported
	pine.upsert({ resource: 'device', id: { id: 1 }, body: {} });
}

export async function untypedModel(pine: PineTest) {
	const { body: explicit } = await pine.get<Array<{ id: number }>>({
		resource: 'device',
	});
	expectType<Equals<typeof explicit, Array<{ id: number }>>>();
}
