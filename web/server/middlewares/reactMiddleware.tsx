import React from "react";
import ReactDOMServer from 'react-dom/server';
import expressCore from "express-serve-static-core";
import { Router } from "wouter";
import App from "../../client/App";
import { COLOR_SCHEME_KEY, parseColorScheme } from "../../client/theme";
import { ErrorResponse, InitialData } from "../../../types/api";
import index from '../views/index.handlebars';
import HTTPError from "../helpers/HTTPError";

const removeTags = /[<>]/g;
const tagsToReplace: Record<string, string> = {
  '<': `\\u003C`,
  '>': `\\u003E`,
};

export default function reactMiddleware(req: expressCore.RequestEx<any, any, any>, res: expressCore.ResponseEx<any>, next: expressCore.NextFunction) {
  res.react = <Data, >(data: Data, error?: ErrorResponse) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    
    // noinspection JSUnreachableSwitchBranches
    switch(req.accepts(['html', 'json'])) {
      case "html": {
        const initialData: InitialData & Data = {
          ...data,
          _error: error,
          _colorScheme: parseColorScheme(req.cookies[COLOR_SCHEME_KEY]),
        };
        
        const initialDataJSON = JSON.stringify(initialData).replace(removeTags, tag => tagsToReplace[tag] || tag);
        
        res.send(index({
          reactContent: ReactDOMServer.renderToString(
            <Router ssrPath={req.originalUrl}>
              <App initialData={initialData} />
            </Router>,
          ),
          initialData: initialDataJSON,
          production: process.env.NODE_ENV === 'production',
        }));
        break;
      }
      
      case "json":
        if(error) res.json(error);
        else res.json(data);
        break;
      
      default:
        throw new HTTPError(406);
    }
    
    return res;
  };
  next();
}
