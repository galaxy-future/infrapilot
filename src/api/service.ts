import fetchData from '@/api/_request';

export function createService(data: any) {
  return fetchData('/api/v1/service', data, 'post');
}

export function updateService(data: any) {
  return fetchData('/api/v1/service/detail', data, 'patch');
}

export function rollbackService(data: any) {
  return fetchData('/api/v1/service/rollback', data, 'post');
}

export function getServiceById(param: any) {
  return fetchData('/api/v1/service/id', param);
}

export function getServiceList(param: any) {
  return fetchData('/api/v1/project/service/list', param);
}

export function getVersionList(param: any) {
  return fetchData('/api/v1/service/versions', param);
}

export function getVersionDetail(param: any) {
  return fetchData('/api/v1/service/version', param);
}