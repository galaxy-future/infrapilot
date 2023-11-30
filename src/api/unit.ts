import fetchData from '@/api/_request';

export function createUnit(data: any) {
  return fetchData('/api/v1/unit', data, 'post');
}

export function getUnit(param: any) {
  return fetchData('/api/v1/unit', param);
}

export function updateUnit(param: any) {
  return fetchData('/api/v1/unit/detail', param, 'patch');
}

export function getUnitList(param: any) {
  return fetchData('/api/v1/unit/list', param);
}

export function getUnitStatus(param: any) {
  return fetchData('/api/v1/unit/status', param);
}

export function getUnitVersion(param: any) {
  return fetchData('/api/v1/unit/list/version', param);
}

export function getUnitCheck(param: any) {
  return fetchData('/api/v1/unit/check_dockerfile', param);
}

export function getUnitParam(param: any) {
  return fetchData('/api/v1/unit/image/params', param);
}

export function rebuildUnit(data: any) {
  return fetchData('/api/v1/unit/rebuild', data, 'post');
}

export function getRepoList(param: any) {
  return fetchData('/api/v1/unit/image/repository', param);
}

export function getModelList(param: any) {
  return fetchData('/api/v1/volume/models', param);
}