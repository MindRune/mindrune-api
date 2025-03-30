"use strict";
/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = exports.HttpClient = exports.ContentType = void 0;
var ContentType;
(function (ContentType) {
    ContentType["Json"] = "application/json";
    ContentType["FormData"] = "multipart/form-data";
    ContentType["UrlEncoded"] = "application/x-www-form-urlencoded";
    ContentType["Text"] = "text/plain";
})(ContentType || (exports.ContentType = ContentType = {}));
class HttpClient {
    constructor(apiConfig = {}) {
        this.baseUrl = "https://api.mindrune.xyz";
        this.securityData = null;
        this.abortControllers = new Map();
        this.customFetch = (...fetchParams) => fetch(...fetchParams);
        this.baseApiParams = {
            credentials: "same-origin",
            headers: {},
            redirect: "follow",
            referrerPolicy: "no-referrer",
        };
        this.setSecurityData = (data) => {
            this.securityData = data;
        };
        this.contentFormatters = {
            [ContentType.Json]: (input) => input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
            [ContentType.Text]: (input) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
            [ContentType.FormData]: (input) => Object.keys(input || {}).reduce((formData, key) => {
                const property = input[key];
                formData.append(key, property instanceof Blob
                    ? property
                    : typeof property === "object" && property !== null
                        ? JSON.stringify(property)
                        : `${property}`);
                return formData;
            }, new FormData()),
            [ContentType.UrlEncoded]: (input) => this.toQueryString(input),
        };
        this.createAbortSignal = (cancelToken) => {
            if (this.abortControllers.has(cancelToken)) {
                const abortController = this.abortControllers.get(cancelToken);
                if (abortController) {
                    return abortController.signal;
                }
                return void 0;
            }
            const abortController = new AbortController();
            this.abortControllers.set(cancelToken, abortController);
            return abortController.signal;
        };
        this.abortRequest = (cancelToken) => {
            const abortController = this.abortControllers.get(cancelToken);
            if (abortController) {
                abortController.abort();
                this.abortControllers.delete(cancelToken);
            }
        };
        this.request = async ({ body, secure, path, type, query, format, baseUrl, cancelToken, ...params }) => {
            const secureParams = ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
                this.securityWorker &&
                (await this.securityWorker(this.securityData))) ||
                {};
            const requestParams = this.mergeRequestParams(params, secureParams);
            const queryString = query && this.toQueryString(query);
            const payloadFormatter = this.contentFormatters[type || ContentType.Json];
            const responseFormat = format || requestParams.format || 'json';
            return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
                ...requestParams,
                headers: {
                    ...(requestParams.headers || {}),
                    ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
                },
                signal: cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal,
                body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
            }).then(async (response) => {
                const r = response;
                r.data = null;
                r.error = null;
                const data = !responseFormat
                    ? r
                    : await response[responseFormat]()
                        .then((data) => {
                        if (r.ok) {
                            r.data = data;
                        }
                        else {
                            r.error = data;
                        }
                        return r;
                    })
                        .catch((e) => {
                        r.error = e;
                        return r;
                    });
                if (cancelToken) {
                    this.abortControllers.delete(cancelToken);
                }
                if (!response.ok)
                    throw data;
                return data;
            });
        };
        Object.assign(this, apiConfig);
    }
    encodeQueryParam(key, value) {
        const encodedKey = encodeURIComponent(key);
        return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
    }
    addQueryParam(query, key) {
        return this.encodeQueryParam(key, query[key]);
    }
    addArrayQueryParam(query, key) {
        const value = query[key];
        return value.map((v) => this.encodeQueryParam(key, v)).join("&");
    }
    toQueryString(rawQuery) {
        const query = rawQuery || {};
        const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
        return keys
            .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
            .join("&");
    }
    addQueryParams(rawQuery) {
        const queryString = this.toQueryString(rawQuery);
        return queryString ? `?${queryString}` : "";
    }
    mergeRequestParams(params1, params2) {
        return {
            ...this.baseApiParams,
            ...params1,
            ...(params2 || {}),
            headers: {
                ...(this.baseApiParams.headers || {}),
                ...(params1.headers || {}),
                ...((params2 && params2.headers) || {}),
            },
        };
    }
}
exports.HttpClient = HttpClient;
/**
 * @title MindRune API
 * @version 1.0.0
 * @baseUrl https://api.mindrune.xyz
 * @contact MindRune Support <support@mindrune.xyz>
 *
 * API for managing OSRS game data and user accounts
 */
class Api extends HttpClient {
    constructor() {
        super(...arguments);
        this.auth = {
            /**
             * No description
             *
             * @tags Authentication
             * @name RegisterCreate
             * @summary Register a new user or get nonce for an existing user
             * @request POST:/auth/register
             */
            registerCreate: (data, params = {}) => this.request({
                path: `/auth/register`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * No description
             *
             * @tags Authentication
             * @name SignCreate
             * @summary Authenticate a user with their account and signature
             * @request POST:/auth/sign
             */
            signCreate: (data, params = {}) => this.request({
                path: `/auth/sign`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
        };
        this.user = {
            /**
             * No description
             *
             * @tags User
             * @name InfoDetail
             * @summary Get user information
             * @request GET:/user/info/{account}
             */
            infoDetail: (account, params = {}) => this.request({
                path: `/user/info/${account}`,
                method: "GET",
                format: "json",
                ...params,
            }),
            /**
             * No description
             *
             * @tags User
             * @name EditCreate
             * @summary Edit user profile
             * @request POST:/user/edit
             * @secure
             */
            editCreate: (data, params = {}) => this.request({
                path: `/user/edit`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.FormData,
                format: "json",
                ...params,
            }),
            /**
             * No description
             *
             * @tags User
             * @name RegistrationKeyCreate
             * @summary Get user registration key
             * @request POST:/user/registrationKey
             * @secure
             */
            registrationKeyCreate: (params = {}) => this.request({
                path: `/user/registrationKey`,
                method: "POST",
                secure: true,
                format: "json",
                ...params,
            }),
        };
        this.osrs = {
            /**
             * No description
             *
             * @tags OSRS
             * @name CreateCreate
             * @summary Create game data
             * @request POST:/osrs/create
             * @secure
             */
            createCreate: (data, params = {}) => this.request({
                path: `/osrs/create`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * No description
             *
             * @tags OSRS
             * @name QueryCreate
             * @summary Execute Neo4j query
             * @request POST:/osrs/query
             * @secure
             */
            queryCreate: (data, params = {}) => this.request({
                path: `/osrs/query`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
        };
    }
}
exports.Api = Api;
//# sourceMappingURL=api.js.map