import fetchData from '@/api/_request';

export function subscribeInfo(param: any = {}) {
  return fetchData('/api/v1/license/info', param);
}

export function subscribe(data: {}) {
  return fetchData('/api/v1/license/subscribe', data, 'post');
}

export function getLicenseCode(data: {} = {}) {
  return fetchData('/api/v1/license/request_code/generate', data, 'post');
}