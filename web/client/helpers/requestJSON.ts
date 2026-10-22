import isNode from 'detect-node';
import axios, { Canceler, AxiosRequestConfig } from 'axios';
import { qsStringify } from './utils';
import { ClientError } from "./clientError";

const CancelToken = axios.CancelToken;

interface RequestOptions<Req> extends Omit<AxiosRequestConfig<Req>, "cancelToken"> {
  search?: string | Record<string, unknown>;
  cancelCb?: (cancel: Canceler) => void;
}

export default async function requestJSON<Res = void, Req = never>({ url = "", search, cancelCb, ...rest }: RequestOptions<Req> = {}): Promise<Res> {
  if(isNode) return new Promise(() => {});
  
  if(search && typeof search !== "string") search = qsStringify(search);
  if(search) url += search;
  
  try {
    const response = await axios({
      ...rest,
      url,
      cancelToken: cancelCb ? new CancelToken(cancelCb) : undefined,
    });
    
    return response.data;
  } catch(err: any) {
    const error = new ClientError(err);
    
    if(error.status === 401 && location.pathname !== "/core/login") {
      location.href = "/core/login";
    } else if(!axios.isCancel(err)) {
      error.prepareNotify();
    }
    
    throw error;
  }
}
