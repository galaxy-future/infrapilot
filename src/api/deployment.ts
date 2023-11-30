import fetchData from '@/api/_request';

export function deploy(data: any) {
  return fetchData('/api/v1/service/deploy', data, 'post')
}

export function pause(data: any) {
  return fetchData('/api/v1/service/pause', data, 'post')
}

export function resume(data: any) {
  return fetchData('/api/v1/service/resume', data, 'post')
}

export function stop(data: any) {
  return fetchData('/api/v1/service/stop', data, 'post')
}

export function getDeploymentInfo(param: any) {
  return fetchData('/api/v1/service/deployment/info', param)
}

export function getDeploymentList(param: any) {
  return fetchData('/api/v1/project/service/deployment/list', param)
}

export function getTeamDeploymentList(param: any) {
  return fetchData('/api/v1/team/service/deployment/list', param)
}

export function getPodLogs(param: any) {
  return fetchData('/api/v1/pod/logs', param)
}

export function getLog(param: any) {
  return fetchData('/api/v1/service/pipeline/events', param)
}

export function getPodList(param: any) {
  return fetchData('/api/v1/deployment/instance', param)
}

export function getServicePipeline(param: any) {
  return fetchData('/api/v1/service/pipeline/log', param)
}

export function getPodDirectory(param: any) {
  return fetchData('/api/v1/pod/filesys', param);
}