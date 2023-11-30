import fetchData from '@/api/_request';

export function createDependency(data: any) {
  return fetchData('/api/v1/ext_dep', data, 'post');
}

export function updateDependency(data: any) {
  return fetchData('/api/v1/ext_dep', data, 'patch');
}

// export function deleteConfig(data: any) {
//   return fetchData('/api/v1/config_map', data, 'delete');
// }

export function getDependency(param: any) {
  return fetchData('/api/v1/ext_dep', param);
}

export function getDependencyList(param: any) {
  return fetchData('/api/v1/ext_dep/list', param);
}

export function getDependencyVersion(param: any) {
  return fetchData('/api/v1/ext_dep/versions', param);
}