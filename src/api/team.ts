import fetchData from '@/api/_request';

export function getTeam(param: any) {
  return fetchData('/api/v1/team', param)
}

export function createTeam(data: any) {
  return fetchData('/api/v1/team', data, 'post')
}

export function getTeamList(param: any) {
  return fetchData('/api/v1/team/list', param)
}

export function getTeamMemberList(param: any) {
  return fetchData('/api/v1/team/member', param)
}

export function addTeamMember(data: any) {
  return fetchData('/api/v1/team/member', data, 'post')
}

export function delTeamMember(data: any) {
  return fetchData('/api/v1/team/member', data, 'delete')
}

export function enableTeamManager(data: any) {
  return fetchData('/api/v1/team/manager', data, 'post')
}

export function disableTeamManager(data: any) {
  return fetchData('/api/v1/team/manager', data, 'delete')
}

export function checkTeamManager(data: any) {
  return fetchData('/api/v1/team/member/check', data, 'post')
}