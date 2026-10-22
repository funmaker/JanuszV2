import * as core from "express-serve-static-core";
import { ErrorResponse } from "./api";

declare module "express-serve-static-core" {
  export interface RequestEx<P, ResBody, ReqData> extends core.Request<P, ResBody, any, any, any> {
    body: ReqData;
  }
  
  export interface ResponseEx<ResBody> extends core.Response<ResBody, any, any> {
    react(initialData: ResBody, error?: ErrorResponse): void;
    react(initialData: Empty, error: ErrorResponse): void;
  }
  
  export interface RequestHandlerEx<
    P = core.ParamsDictionary,
    ResBody = any,
    ReqData = any,
  > {
    (
      req: RequestEx<P, ResBody, ReqData>,
      res: ResponseEx<ResBody>,
      next: core.NextFunction,
    ): void | Promise<void>;
  }
  
  export interface ErrorRequestHandlerEx<
    P = core.ParamsDictionary,
    ResBody = any,
    ReqData = any,
  > {
    (
      err: any,
      req: RequestEx<P, ResBody, ReqData>,
      res: ResponseEx<ResBody>,
      next: core.NextFunction,
    ): void | Promise<void>;
  }
  
  export interface IRouterMatcher<T> {
    <P, ResBody, ReqData = never>(handler: ErrorRequestHandlerEx<P, ResBody, ReqData>): T;
    <P, ResBody, ReqData = never>(...middlewares: Array<RequestHandlerEx<P, ResBody, ReqData>>): T;
    <P, ResBody, ReqData = never>(p: string, ...middlewares: Array<RequestHandlerEx<P, ResBody, ReqData>>): T;
    <P, ResBody, ReqData = never>(p: string[], ...middlewares: Array<RequestHandlerEx<P, ResBody, ReqData>>): T;
  }
}
