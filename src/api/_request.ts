import { notification } from 'antd';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Router from 'next/router';

import Store from '@/store';
import { SSO } from '@/utils/public';

const baseURL = () => {
  let path: string = 'http://172.16.16.181:19010';
  
  switch (process.env.ENV_MODE) {
    case 'platform':
      path = '/';
      break;
    case 'production':
      path = `${ location.protocol }//${ location.hostname }:19010`
      break;
    case 'development':
    default:
      break;
  }
  
  return path;
};

// 定义通用的响应数据类型
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
}

// 封装 Axios 请求方法
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await axios(config);
    const { code } = response.data as any;
    
    switch (true) {
      case code === 1201: // 无效
      case code === 1202: // 过期
        SSO.logout();
        break;
      case code === 1209: // 即将过期
        (response.data as any).code = 200;
        break;
      case code === 1102: // 非白名单用户
        Router.push('/expectancy');
        break;
    }
    
    return response.data;
  }
  catch (error: any) {
    throw error.response?.data || {
      code: error.code,
      msg: '服务器错误',
      data: 500
    };
  }
}

// 使用封装的请求方法
async function fetchData(url: string, data: any, method: string = 'GET') {
  const apiUrl = baseURL() + url;
  const token = `Bearer ${ Store.getState().user.token }`;
  
  const headers = {
    'Authorization': token,
    'Content-Type': 'application/json',
  };
  
  const config: AxiosRequestConfig = {
    timeout: 10000,
    method,
    url: apiUrl,
    headers: headers,
    ...(method === 'GET' ? { params: data } : { data: data }),
  }
  
  try {
    // 调用封装的请求方法
    return await request<any>(config);
  }
  catch (error: any) {
    if (error.code === 'ECONNABORTED') return error;
    
    console.error('Error:', error);
    notification.error({
      // duration: null,
      message: error.msg,
      style: {
        wordWrap: 'break-word',
        wordBreak: 'break-all'
      }
    });
    return error
  }
}

export default fetchData