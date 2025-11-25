/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface TypesAuthResponse {
  /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." */
  access_token?: string;
  /** @example 86400 */
  expires_in?: number;
  /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." */
  refresh_token?: string;
  user?: TypesUserProfileResponse;
}

export interface TypesErrorResponse {
  message?: string;
  status?: string;
}

export interface TypesLoginRequest {
  /** @example "researcher" */
  login: string;
  /** @example "password123" */
  password: string;
}

export interface TypesLogoutRequest {
  /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." */
  refresh_token: string;
}

export interface TypesRefreshTokenRequest {
  /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." */
  refresh_token: string;
}

export interface TypesRegisterRequest {
  /** @example false */
  is_moderator?: boolean;
  /** @example "researcher" */
  login: string;
  /** @example "password123" */
  password: string;
}

export interface TypesUpdateProfileRequest {
  /** @example "new_login" */
  login?: string;
  /** @example "new_password" */
  password?: string;
}

export interface TypesUserProfileResponse {
  /** @example "2024-01-01T00:00:00Z" */
  created_at?: string;
  /** @example 1 */
  id?: number;
  /** @example false */
  is_moderator?: boolean;
  /** @example "researcher" */
  login?: string;
}

export interface SpectrumAnalysisListParams {
  /** Фильтр по статусу */
  status?: string;
  /** Дата начала (RFC3339) */
  date_from?: string;
  /** Дата окончания (RFC3339) */
  date_to?: string;
  /**
   * Лимит записей
   * @default 10
   */
  limit?: number;
  /**
   * Смещение
   * @default 0
   */
  offset?: number;
}

/** Действие: complete или reject */
export interface SpectrumAnalysisCompleteUpdatePayload {
  action?: string;
}

export interface SpectrumAnalysisCompleteUpdateParams {
  /** ID заявки */
  id: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "//localhost:8080",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title ColorLex API
 * @version 1.0
 * @license Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0.html)
 * @termsOfService http://swagger.io/terms/
 * @baseUrl //localhost:8080
 * @contact API Support <support@swagger.io> (http://www.swagger.io/support)
 *
 * API для системы спектроскопического анализа фрагментов живописи
 */
export class Api<SecurityDataType extends unknown> {
  http: HttpClient<SecurityDataType>;

  constructor(http: HttpClient<SecurityDataType>) {
    this.http = http;
  }

  api = {
    /**
     * @description Вход в систему с получением JWT токенов
     *
     * @tags auth
     * @name AuthLoginCreate
     * @summary Аутентификация пользователя
     * @request POST:/api/auth/login
     * @response `200` `TypesAuthResponse` OK
     * @response `400` `TypesErrorResponse` Bad Request
     * @response `401` `TypesErrorResponse` Unauthorized
     * @response `500` `TypesErrorResponse` Internal Server Error
     */
    authLoginCreate: (request: TypesLoginRequest, params: RequestParams = {}) =>
      this.http.request<TypesAuthResponse, TypesErrorResponse>({
        path: `/api/auth/login`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Выход из системы с добавлением токена в blacklist
     *
     * @tags auth
     * @name AuthLogoutCreate
     * @summary Выход из системы
     * @request POST:/api/auth/logout
     * @response `200` `Record<string,string>` OK
     * @response `400` `TypesErrorResponse` Bad Request
     * @response `500` `TypesErrorResponse` Internal Server Error
     */
    authLogoutCreate: (
      request: TypesLogoutRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<Record<string, string>, TypesErrorResponse>({
        path: `/api/auth/logout`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Обновляет access токен используя refresh токен
     *
     * @tags auth
     * @name AuthRefreshCreate
     * @summary Обновление токена
     * @request POST:/api/auth/refresh
     * @response `200` `TypesAuthResponse` OK
     * @response `400` `TypesErrorResponse` Bad Request
     * @response `401` `TypesErrorResponse` Unauthorized
     * @response `500` `TypesErrorResponse` Internal Server Error
     */
    authRefreshCreate: (
      request: TypesRefreshTokenRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<TypesAuthResponse, TypesErrorResponse>({
        path: `/api/auth/refresh`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Создает нового пользователя в системе
     *
     * @tags auth
     * @name AuthRegisterCreate
     * @summary Регистрация пользователя
     * @request POST:/api/auth/register
     * @response `201` `TypesAuthResponse` Created
     * @response `400` `TypesErrorResponse` Bad Request
     * @response `500` `TypesErrorResponse` Internal Server Error
     */
    authRegisterCreate: (
      request: TypesRegisterRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<TypesAuthResponse, TypesErrorResponse>({
        path: `/api/auth/register`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Возвращает список заявок с учетом прав доступа пользователя
     *
     * @tags spectrum-analysis
     * @name SpectrumAnalysisList
     * @summary Получение списка заявок
     * @request GET:/api/spectrum-analysis
     * @secure
     * @response `200` `Record<string,any>` OK
     * @response `401` `TypesErrorResponse` Unauthorized
     * @response `500` `TypesErrorResponse` Internal Server Error
     */
    spectrumAnalysisList: (
      query: SpectrumAnalysisListParams,
      params: RequestParams = {},
    ) =>
      this.http.request<Record<string, any>, TypesErrorResponse>({
        path: `/api/spectrum-analysis`,
        method: "GET",
        query: query,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Возвращает информацию о корзине текущего пользователя
     *
     * @tags spectrum-analysis
     * @name SpectrumAnalysisCartList
     * @summary Получение корзины пользователя
     * @request GET:/api/spectrum-analysis/cart
     * @secure
     * @response `200` `Record<string,any>` OK
     * @response `401` `TypesErrorResponse` Unauthorized
     * @response `500` `TypesErrorResponse` Internal Server Error
     */
    spectrumAnalysisCartList: (params: RequestParams = {}) =>
      this.http.request<Record<string, any>, TypesErrorResponse>({
        path: `/api/spectrum-analysis/cart`,
        method: "GET",
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Завершает или отклоняет заявку (только для модераторов)
     *
     * @tags spectrum-analysis
     * @name SpectrumAnalysisCompleteUpdate
     * @summary Завершение/отклонение заявки
     * @request PUT:/api/spectrum-analysis/{id}/complete
     * @secure
     * @response `200` `Record<string,any>` OK
     * @response `400` `TypesErrorResponse` Bad Request
     * @response `401` `TypesErrorResponse` Unauthorized
     * @response `403` `TypesErrorResponse` Forbidden
     * @response `404` `TypesErrorResponse` Not Found
     * @response `500` `TypesErrorResponse` Internal Server Error
     */
    spectrumAnalysisCompleteUpdate: (
      { id, ...query }: SpectrumAnalysisCompleteUpdateParams,
      request: SpectrumAnalysisCompleteUpdatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<Record<string, any>, TypesErrorResponse>({
        path: `/api/spectrum-analysis/${id}/complete`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Возвращает информацию о текущем пользователе
     *
     * @tags users
     * @name UsersProfileList
     * @summary Получение профиля пользователя
     * @request GET:/api/users/profile
     * @secure
     * @response `200` `TypesUserProfileResponse` OK
     * @response `401` `TypesErrorResponse` Unauthorized
     * @response `500` `TypesErrorResponse` Internal Server Error
     */
    usersProfileList: (params: RequestParams = {}) =>
      this.http.request<TypesUserProfileResponse, TypesErrorResponse>({
        path: `/api/users/profile`,
        method: "GET",
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Обновляет информацию профиля текущего пользователя
     *
     * @tags users
     * @name UsersProfileUpdate
     * @summary Обновление профиля пользователя
     * @request PUT:/api/users/profile
     * @secure
     * @response `200` `TypesUserProfileResponse` OK
     * @response `400` `TypesErrorResponse` Bad Request
     * @response `401` `TypesErrorResponse` Unauthorized
     * @response `500` `TypesErrorResponse` Internal Server Error
     */
    usersProfileUpdate: (
      request: TypesUpdateProfileRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<TypesUserProfileResponse, TypesErrorResponse>({
        path: `/api/users/profile`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
