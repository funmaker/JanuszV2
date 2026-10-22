import express from "express";
import { janusz } from "../../../core/janusz";
import { LoginRequest, LoginResponse } from "../../../types/api";
import requireLogin, { AUTH_COOKIE, getFreshJWT } from "../helpers/auth";

export const router = express.Router();

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'max-age=0, no-store');
  
  next();
});

router.get<never, Empty>('/core/login', (req, res) => {
  res.react({});
});

router.post<never, LoginResponse, LoginRequest>('/core/login', (req, res) => {
  const { password, cookieLifespan } = janusz.getConfig("web");
  
  if(req.body?.password === password) {
    res.cookie(AUTH_COOKIE, getFreshJWT(), { maxAge: cookieLifespan, httpOnly: true, sameSite: "strict" });
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

router.get<never, Empty>('/core/logout', (req, res) => {
  res.react({});
});

router.post<never, Empty>('/core/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE);
  res.json({});
});

router.get<never, Empty>('/', requireLogin, (req, res) => {
  res.react({});
});
