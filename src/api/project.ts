import fetchData from '@/api/_request';

export function createProject(data: any) {
  return fetchData('/api/v1/project', data, 'post')
}

export function getProjectById(param: any) {
  return fetchData('/api/v1/project', param)
}

export function getProjectList(param: any) {
  return fetchData('/api/v1/team/projects/r', param)
}