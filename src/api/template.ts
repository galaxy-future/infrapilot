import HTTP from 'http';
import HTTPS from 'https';
import Axios from 'axios';

import Store from '@/store';
import fetchData from '@/api/_request';

export function getTemplate(param: any) {
  // return new Promise((resolve) => {
  //   resolve({
  //     code: 200,
  //     data: {
  //       template_id: '11111',
  //       version: '11111',
  //       icon: '/logo.png',
  //       name: '111111111111111111111111111111111111111111111',
  //       description: '111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111',
  //       previews: '/logo.png,2,3,4,5',
  //       user_guide: '1111111',
  //       size: 500,
  //       create_at: '11111',
  //       update_at: '11111',
  //       change_log: '11111',
  //       units: [],
  //       access_control: []
  //     }
  //   });
  // });
  return fetchData('/api/v1/service/template/detail', param);
}

export function getTemplateList(param: any) {
  // return new Promise((resolve) => {
  //   resolve({
  //     code: 200,
  //     data: {
  //       page: 1,
  //       page_size: 10,
  //       total: 4,
  //       templates: [
  //         {
  //           template_id: '11111',
  //           version: '11111',
  //           icon: '/logo.png',
  //           name: '111111111111111111111111111111111111111111111',
  //           description: '111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111',
  //           previews: '/logo.png,2,3,4,5',
  //           size: 500,
  //           create_at: '11111',
  //           update_at: '11111'
  //         },
  //         {
  //           template_id: '22222',
  //           version: '22222',
  //           icon: '/logo.png',
  //           name: '222222222222222222222222222222222222222222222',
  //           description: '222222222222222222222222222222222222222222222',
  //           previews: '/logo.png,2,3,4,5',
  //           size: 500,
  //           create_at: '22222',
  //           update_at: '22222'
  //         },
  //         {
  //           template_id: '33333',
  //           version: '33333',
  //           icon: '/logo.png',
  //           name: '333333333333333333333333333333333333333333333',
  //           description: '333333333333333333333333333333333333333333333',
  //           previews: '/logo.png,2,3,4,5',
  //           size: 500,
  //           create_at: '33333',
  //           update_at: '33333'
  //         },
  //         {
  //           template_id: '44444',
  //           version: '44444',
  //           icon: '/logo.png',
  //           name: '444444444444444444444444444444444444444444444',
  //           description: '444444444444444444444444444444444444444444444',
  //           previews: '/logo.png,2,3,4,5',
  //           size: 500,
  //           create_at: '44444',
  //           update_at: '44444'
  //         }
  //       ]
  //     }
  //   });
  // });
  return fetchData('/api/v1/service/template/list', param);
}

export function getTemplateVersion(param: any) {
  // return new Promise((resolve) => {
  //   resolve({
  //     code: 200,
  //     data: {
  //       page: 1,
  //       page_size: 10,
  //       total: 4,
  //       versions: [
  //         {
  //           template_id: '11111',
  //           version: '11111',
  //           icon: '/logo.png',
  //           name: '111111111111111111111111111111111111111111111',
  //           description: '111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111',
  //           previews: '/logo.png,2,3,4,5',
  //           size: 500,
  //           create_at: '11111',
  //           update_at: '11111',
  //           change_log: '',
  //           units: [],
  //           access_control: []
  //         },
  //         {
  //           template_id: '22222',
  //           version: '22222',
  //           icon: '/logo.png',
  //           name: '222222222222222222222222222222222222222222222',
  //           description: '222222222222222222222222222222222222222222222',
  //           previews: '/logo.png,2,3,4,5',
  //           size: 500,
  //           create_at: '22222',
  //           update_at: '22222',
  //           change_log: '',
  //           units: [],
  //           access_control: []
  //         },
  //         {
  //           template_id: '33333',
  //           version: '33333',
  //           icon: '/logo.png',
  //           name: '333333333333333333333333333333333333333333333',
  //           description: '333333333333333333333333333333333333333333333',
  //           previews: '/logo.png,2,3,4,5',
  //           size: 500,
  //           create_at: '33333',
  //           update_at: '33333',
  //           change_log: '',
  //           units: [],
  //           access_control: []
  //         },
  //         {
  //           template_id: '44444',
  //           version: '44444',
  //           icon: '/logo.png',
  //           name: '444444444444444444444444444444444444444444444',
  //           description: '444444444444444444444444444444444444444444444',
  //           previews: '/logo.png,2,3,4,5',
  //           size: 500,
  //           create_at: '44444',
  //           update_at: '44444',
  //           change_log: '',
  //           units: [],
  //           access_control: []
  //         }
  //       ]
  //     }
  //   });
  // });
  return fetchData('/api/v1/service/template/versions', param);
}

export function deploymentTemplate(data: any) {
  // return new Promise((resolve) => {
  //   resolve({
  //     code: 200,
  //     data: {
  //       service_id: '1111'
  //     }
  //   });
  // });
  return fetchData('/api/v1/service/template/deploy', data, 'post');
}

export function uploadTemplate(data: any) {
  const keepAlive = {
      keepAlive: true,
      maxSockets: 10
    },
    formData = new FormData();
  
  Object.keys(data)
    .forEach(v => {
      formData.set(v, data[v]);
    });
  
  return Axios.post('/api/v1/service/template/install', formData, {
    httpAgent: new HTTP.Agent(keepAlive),
    httpsAgent: new HTTPS.Agent(keepAlive),
    headers: {
      'Authorization': `Bearer ${ Store.getState().user.token }`,
      'Content-Type': 'multipart/form-data',
    },
    baseURL: (() => {
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
    })()
  });
}