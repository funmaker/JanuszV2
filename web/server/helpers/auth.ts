import http from "http";
import jwt from 'jsonwebtoken';
import expressCore from "express-serve-static-core";
import { janusz } from "../../../core/janusz";
import HTTPError from "./HTTPError";

export const AUTH_COOKIE = "auth";

export function getFreshJWT() {
  const { secret, cookieLifespan } = janusz.getConfig("web");
  return jwt.sign({ lol: "kek" }, secret, { expiresIn: Math.floor(cookieLifespan / 1000) });
}

function parseCookies(header = "") {
  const cookies: Record<string, string> = {};
  
  for(const cookie of header.split(";")) {
    const separator = cookie.indexOf("=");
    if(separator < 0) continue;
    cookies[cookie.slice(0, separator).trim()] = decodeURIComponent(cookie.slice(separator + 1).trim());
  }
  
  return cookies;
}

export function validateReq(req: http.IncomingMessage) {
  const token = (req as Partial<expressCore.Request>).cookies?.[AUTH_COOKIE] ?? parseCookies(req.headers.cookie)[AUTH_COOKIE];
  if(!token) return false;
  
  try {
    jwt.verify(token, janusz.getConfig("web").secret);
  } catch(e) {
    void e;
    return false;
  }
  return true;
}

export default function requireLogin(req: expressCore.Request, res: expressCore.Response, next: expressCore.NextFunction) {
  if(validateReq(req)) return void next();
  
  switch(req.accepts(['html', 'json'])) {
    case "html":
      return void res.redirect("/core/login");
    
    case "json":
      return void next(new HTTPError(401));
    
    default:
      return void next(new HTTPError(406));
  }
}
