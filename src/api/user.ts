import fetchData from '@/api/_request';

export function getUserTP(param: any = {}) {
  return fetchData('/api/v1/project/personal_team_info', param)
}