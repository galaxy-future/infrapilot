import fetchData from '@/api/_request';

export function createConfig(data: any) {
  // return new Promise((resolve, reject) => {
  //   resolve({
  //     code: 200,
  //     data: null,
  //     msg: ''
  //   });
  // });
  return fetchData('/api/v1/config_map', data, 'post');
}

export function updateConfig(data: any) {
  // return new Promise((resolve, reject) => {
  //   resolve({
  //     code: 200,
  //     data: null,
  //     msg: ''
  //   });
  // });
  return fetchData('/api/v1/config_map', data, 'patch');
}

export function deleteConfig(data: any) {
  // return new Promise((resolve, reject) => {
  //   resolve({
  //     code: 200,
  //     data: null,
  //     msg: ''
  //   });
  // });
  return fetchData('/api/v1/config_map', data, 'delete');
}

export function getConfig(param: any) {
  // return new Promise((resolve, reject) => {
  //   resolve({
  //     code: 200,
  //     data: {
  //       config_map_id: '11111',
  //       config_map_name: '11111',
  //       creator: '11111',
  //       create_at: '11111',
  //       kvs: {
  //         '11111': '111111111111\n\r111111',
  //         '22222': '111111111111',
  //         '33333': '111111111111'
  //       }
  //     },
  //     msg: ''
  //   });
  // });
  return fetchData('/api/v1/config_map', param);
}

export function getConfigList(data: any) {
  // return new Promise((resolve, reject) => {
  //   resolve({
  //     code: 200,
  //     data: {
  //       config_map_list: [
  //         {
  //           config_map_id: '11111',
  //           config_map_name: '11111',
  //           creator: '11111',
  //           create_at: '11111',
  //           kvs: {
  //             '11111': '111111111111\n\r111111',
  //             '22222': '111111111111',
  //             '33333': '111111111111'
  //           }
  //         },
  //         {
  //           config_map_id: '22222',
  //           config_map_name: '22222',
  //           creator: '22222',
  //           create_at: '22222',
  //           kvs: {
  //             '11111': '111111111111\n\r111111',
  //             '22222': '111111111111',
  //             '33333': '111111111111'
  //           }
  //         }
  //       ],
  //       page: 1,
  //       page_size: 10,
  //       total: 2
  //     },
  //     msg: ''
  //   });
  // });
  return fetchData('/api/v1/config_map/list', data);
}