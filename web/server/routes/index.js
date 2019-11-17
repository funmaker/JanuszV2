import requireLogin, { getFreshJWT } from "../helpers/requireLogin";
import { janusz } from "../../../index";


export const coreRouter = require('express-promise-router')();

coreRouter.get('/core/login', (req, res) => {
  const initialData = {};
  
  res.react(initialData);
});

coreRouter.post('/core/login', (req, res) => {
  const initialData = {};
  
  if(req.body.password === janusz.getConfig("web").password) {
    res.cookie("auth", getFreshJWT(), { expires: new Date(Date.now() + janusz.getConfig("web").cookieLifespan) });
    initialData.success = true;
  } else {
    initialData.success = false;
  }
  
  res.json(initialData);
});

coreRouter.post('/core/logout', (req, res) => {
  const initialData = {};
  
  res.clearCookie("auth");
  
  res.json(initialData);
});

coreRouter.get('/', requireLogin, (req, res) => {
  const initialData = {};
  
  res.react(initialData);
});

coreRouter.get("/test", (req, res) => res.send("kek"));
