# Change Log

All notable changes to this project will be documented in this file
automatically by Versionist. DO NOT EDIT THIS FILE MANUALLY!
This project adheres to [Semantic Versioning](http://semver.org/).

## 2.0.2 - 2024-01-02

* Update @types/supertest to v6 [Thodoris Greasidis]

## 2.0.1 - 2023-10-10

* get(): Fix returning an empty object instead of undefined [Thodoris Greasidis]

## 2.0.0 - 2023-10-10

* Update supertest to v6 [Thodoris Greasidis]
* Update @balena/lint to v7 [Thodoris Greasidis]
* Update TypeScript to 5.2.2 [Thodoris Greasidis]
* Drop support for node < 16 & require es2021 [Thodoris Greasidis]

## 1.5.0 - 2023-07-19

* Export `PromiseResult` [myarmolinsky]

## 1.4.1 - 2023-05-31

* Update flowzone.yml [Kyle Harding]

## 1.4.0 - 2023-04-03

* Allow passing a url string as the `app` instead of an Express app [Thodoris Greasidis]

## 1.3.5 - 2022-09-26

* Delete redundant .resinci.yml [Thodoris Greasidis]

## 1.3.4 - 2022-09-22

* Specify node 10 as the minimum supported node engine in the package.json [Thodoris Greasidis]
* Replace balenaCI with flowzone [Thodoris Greasidis]

## 1.3.3 - 2022-02-08


<details>
<summary> Fix using along with pinejs-client v6.10 [Thodoris Greasidis] </summary>

> ### pinejs-client-js-6.10.1 - 2022-02-08
> 
> * Do not await the _request() result to allow enhanced promises downstream [Thodoris Greasidis]
> 
> ### pinejs-client-js-6.10.0 - 2022-01-24
> 
> * Add optional retry logic to client [Paul Jonathan Zoulin]
> 
> ### pinejs-client-js-6.9.6 - Invalid date
> 
> * Reformat with the latest prettier [Thodoris Greasidis]
> * Delete CODEOWNERS [Thodoris Greasidis]
> 
> ### pinejs-client-js-6.9.5 - 2021-03-22
> 
> * Enable strict tsconfig options by default [Pagan Gazzard]
> 
> ### pinejs-client-js-6.9.4 - 2021-03-10
> 
> * Update dependencies [Pagan Gazzard]
> 
</details>

## 1.3.2 - 2021-06-30

* Delete CODEOWNERS [Thodoris Greasidis]

## 1.3.1 - 2021-01-19

* Throw on not supported upsert & getOrCreate methods [Thodoris Greasidis]

## 1.3.0 - 2021-01-18


<details>
<summary> Update pinejs-client-core to 6.9.3 and pick up improved typings [Pagan Gazzard] </summary>

> ### pinejs-client-js-6.9.3 - 2020-11-20
> 
> * Explicitly specify return types for all functions [Pagan Gazzard]
> 
> ### pinejs-client-js-6.9.2 - 2020-10-23
> 
> * Update dev dependencies [Pagan Gazzard]
> 
> ### pinejs-client-js-6.9.1 - 2020-09-17
> 
> * Improve typings [Pagan Gazzard]
> 
> ### pinejs-client-js-6.9.0 - 2020-09-07
> 
> * Add 'getOrCreate' method supporting natural keys [Thodoris Greasidis]
> 
> ### pinejs-client-js-6.8.0 - 2020-09-03
> 
> * Add support for $format [Pagan Gazzard]
> 
> ### pinejs-client-js-6.7.3 - 2020-08-26
> 
> * Improve $orderby typing to allow `[{a: 'desc'}, {b: 'asc'}]` [Pagan Gazzard]
> 
> ### pinejs-client-js-6.7.2 - 2020-08-24
> 
> * Update dev dependencies [Pagan Gazzard]
> 
> ### pinejs-client-js-6.7.1 - 2020-08-12
> 
> * Fix prepare $count typings [Pagan Gazzard]
> 
> ### pinejs-client-js-6.7.0 - 2020-08-12
> 
> * Improve typings for request/post/put/patch/delete [Pagan Gazzard]
> 
</details>

## 1.2.0 - 2020-08-12


<details>
<summary> Update pinejs-client-core to 6.6.1 [Pagan Gazzard] </summary>

> ### pinejs-client-js-6.6.1 - 2020-08-11
> 
> * Fix typing when id is specified to be `AnyObject | undefined` [Pagan Gazzard]
> 
> ### pinejs-client-js-6.6.0 - 2020-08-11
> 
> * Deprecate `$expand: { 'a/$count': {...} }` [Pagan Gazzard]
> * Deprecate `resource: 'a/$count'` and update typings to reflect it [Pagan Gazzard]
> 
> ### pinejs-client-js-6.5.0 - 2020-08-11
> 
> * Add `options: { $count: { ... } }` sugar for top level $count [Pagan Gazzard]
> * Add `$expand: { a: { $count: { ... } } }` sugar for $count in expands [Pagan Gazzard]
> 
> ### pinejs-client-js-6.4.0 - 2020-08-11
> 
> * Improve return typing of `subscribe` method [Pagan Gazzard]
> 
> ### pinejs-client-js-6.3.0 - 2020-08-11
> 
> * Fix Poll.on typings [Pagan Gazzard]
> * Improve return typing when id is passed to GET methods [Pagan Gazzard]
> * Remove `PromiseResult` type, use `Promise<PromiseResultTypes>` instead [Pagan Gazzard]
> * Remove `PromiseObj` type, use `Promise<{}>` instead [Pagan Gazzard]
> 
> ### pinejs-client-js-6.2.0 - 2020-08-10
> 
> * Add `$filter: { a: { $count: 1 } }` sugar for $count in filters [Pagan Gazzard]
> 
> ### pinejs-client-js-6.1.2 - 2020-08-10
> 
> * Remove redundant ParamsObj/SubscribeParamsObj types [Pagan Gazzard]
> 
> ### pinejs-client-js-6.1.1 - 2020-08-10
> 
> * Make use of `mapObj` helper in more places [Pagan Gazzard]
> * Use `Object.keys` in preference to `hasOwnProperty` where applicable [Pagan Gazzard]
> 
</details>

## 1.1.0 - 2020-07-22

* Update dependencies [Pagan Gazzard]

# v1.0.1
## (2020-06-23)

* Add a .versionbot/CHANGELOG.yml for nested changelogs [Pagan Gazzard]

# v1.0.0
## (2020-06-19)

* Bump build target to es2018 [Thodoris Greasidis]
* Add method overrides to provide supertest typings in the results [Thodoris Greasidis]
* Update pinejs-client-core to v6 [Thodoris Greasidis]

# v0.2.0
## (2020-04-24)

* Initial code commit [Thodoris Greasidis]

## v0.1.0 - 2020-04-24

* Initialize repository
