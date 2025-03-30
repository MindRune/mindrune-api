export interface Error {
    /** @example false */
    success?: boolean;
    /** @example "Error message" */
    msg?: string;
    /** Error details (only in development) */
    error?: object;
}
export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = 'json' | 'text' | 'blob' | 'arrayBuffer';
export interface FullRequestParams extends Omit<RequestInit, "body"> {
    /** set parameter to `true` for call `securityWorker` for this request */
    secure?: boolean;
    /** request path */
    path: string;
    /** content type of request body */
    type?: ContentType;
    /** query params */
    query?: QueryParamsType;
    /** format of response (i.e. response.json() -> format: "json") */
    format?: ResponseFormat;
    /** request body */
    body?: unknown;
    /** base url */
    baseUrl?: string;
    /** request cancellation token */
    cancelToken?: CancelToken;
}
export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;
export interface ApiConfig<SecurityDataType = unknown> {
    baseUrl?: string;
    baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
    securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
    customFetch?: typeof fetch;
}
export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
    data: D;
    error: E;
}
type CancelToken = Symbol | string | number;
export declare enum ContentType {
    Json = "application/json",
    FormData = "multipart/form-data",
    UrlEncoded = "application/x-www-form-urlencoded",
    Text = "text/plain"
}
export declare class HttpClient<SecurityDataType = unknown> {
    baseUrl: string;
    private securityData;
    private securityWorker?;
    private abortControllers;
    private customFetch;
    private baseApiParams;
    constructor(apiConfig?: ApiConfig<SecurityDataType>);
    setSecurityData: (data: SecurityDataType | null) => void;
    protected encodeQueryParam(key: string, value: any): string;
    protected addQueryParam(query: QueryParamsType, key: string): string;
    protected addArrayQueryParam(query: QueryParamsType, key: string): any;
    protected toQueryString(rawQuery?: QueryParamsType): string;
    protected addQueryParams(rawQuery?: QueryParamsType): string;
    private contentFormatters;
    protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams;
    protected createAbortSignal: (cancelToken: CancelToken) => AbortSignal | undefined;
    abortRequest: (cancelToken: CancelToken) => void;
    request: <T = any, E = any>({ body, secure, path, type, query, format, baseUrl, cancelToken, ...params }: FullRequestParams) => Promise<HttpResponse<T, E>>;
}
/**
 * @title MindRune API
 * @version 1.0.0
 * @baseUrl https://api.mindrune.xyz
 * @contact MindRune Support <support@mindrune.xyz>
 *
 * API for managing OSRS game data and user accounts
 */
export declare class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    auth: {
        /**
         * No description
         *
         * @tags Authentication
         * @name RegisterCreate
         * @summary Register a new user or get nonce for an existing user
         * @request POST:/auth/register
         */
        registerCreate: (data: {
            /** Ethereum address */
            account: string;
        }, params?: RequestParams) => Promise<HttpResponse<{
            success?: boolean;
            nonce?: number;
            msg?: string;
        }, Error>>;
        /**
         * No description
         *
         * @tags Authentication
         * @name SignCreate
         * @summary Authenticate a user with their account and signature
         * @request POST:/auth/sign
         */
        signCreate: (data: {
            /** Ethereum address */
            account: string;
            /** Ethereum signature */
            signature: string;
        }, params?: RequestParams) => Promise<HttpResponse<{
            success?: boolean;
            token?: string;
            user_record?: object[];
            msg?: string;
        }, Error>>;
    };
    user: {
        /**
         * No description
         *
         * @tags User
         * @name InfoDetail
         * @summary Get user information
         * @request GET:/user/info/{account}
         */
        infoDetail: (account?: string, params?: RequestParams) => Promise<HttpResponse<{
            success?: boolean;
            data?: {
                account?: string;
                alias?: string;
                img?: string;
                registered?: number;
            }[];
        }, Error>>;
        /**
         * No description
         *
         * @tags User
         * @name EditCreate
         * @summary Edit user profile
         * @request POST:/user/edit
         * @secure
         */
        editCreate: (data: {
            alias?: string;
            twitter?: string;
            bio?: string;
            /** @format binary */
            image?: File;
        }, params?: RequestParams) => Promise<HttpResponse<{
            success?: boolean;
            result?: any[];
        }, Error>>;
        /**
         * No description
         *
         * @tags User
         * @name RegistrationKeyCreate
         * @summary Get user registration key
         * @request POST:/user/registrationKey
         * @secure
         */
        registrationKeyCreate: (params?: RequestParams) => Promise<HttpResponse<{
            success?: boolean;
            result?: {
                registration_key?: string;
            }[];
        }, Error>>;
    };
    osrs: {
        /**
         * No description
         *
         * @tags OSRS
         * @name CreateCreate
         * @summary Create game data
         * @request POST:/osrs/create
         * @secure
         */
        createCreate: (data: object[], params?: RequestParams) => Promise<HttpResponse<{
            success?: boolean;
            msg?: string;
            txn_id?: string;
            data_id?: string;
            eventCount?: number;
        }, Error>>;
        /**
         * No description
         *
         * @tags OSRS
         * @name QueryCreate
         * @summary Execute Neo4j query
         * @request POST:/osrs/query
         * @secure
         */
        queryCreate: (data: {
            query: string;
            params?: object;
        }, params?: RequestParams) => Promise<HttpResponse<{
            success?: boolean;
            data?: object;
        }, Error>>;
    };
}
export {};
