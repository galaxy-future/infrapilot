import { getTeamList } from '@/api/team';
import {
  getServiceList
} from '@/api/service';
import {
  getUnitList,
  getRepoList, getModelList
} from '@/api/unit';
import {
  getConfigList
} from '@/api/config';
import {
  getTemplateVersion
} from '@/api/template';
import {
  getDependencyList
} from '@/api/dependency';


type ListDataType = {
  page: number;
  pageSize: number;
  total: number;
  list: any[];
};

async function getListAll(
  api: (data: any) => Promise<any>,
  requestFN: (data: ListDataType) => any,
  responseFN: (data: ListDataType, result: any) => void
): Promise<any> {
  const listData: ListDataType = {
      page: 1,
      pageSize: 50,
      total: 0,
      list: []
    },
    getList = async () => {
      await api(requestFN(listData))
        .then(async (response: any) => {
          if (response.code !== 200) return;
          
          responseFN(listData, response.data);
          
          if (listData.total > listData.list.length) {
            listData.page++;
            await getList();
          }
        });
    };
  
  await getList();
  
  return listData.list;
}

export namespace List {
  export async function team(data?: any): Promise<any> {
    return getListAll(
      getTeamList,
      (listData: ListDataType) => {
        return {
          ...data,
          page: listData.page,
          page_size: listData.pageSize
        };
      },
      (listData: ListDataType, result: any) => {
        listData.page === 1 && (listData.total = result.total);
        listData.list.push(...result.list);
      }
    );
  }
  
  export async function service(data?: any): Promise<any> {
    return getListAll(
      getServiceList,
      (listData: ListDataType) => {
        return {
          ...data,
          page: listData.page,
          page_size: listData.pageSize
        };
      },
      (listData: ListDataType, result: any) => {
        listData.page === 1 && (listData.total = result.total);
        listData.list.push(...result.services);
      }
    );
  }
  
  export async function serviceTemplateVersion(data?: any): Promise<any> {
    return getListAll(
      getTemplateVersion,
      (listData: ListDataType) => {
        return {
          ...data,
          page: listData.page,
          page_size: listData.pageSize
        };
      },
      (listData: ListDataType, result: any) => {
        listData.page === 1 && (listData.total = result.total);
        listData.list.push(...result.versions);
      }
    );
  }
  
  export async function serviceDependency(data?: any): Promise<any> {
    return getListAll(
      getDependencyList,
      (listData: ListDataType) => {
        return {
          ...data,
          page: listData.page,
          page_size: listData.pageSize
        };
      },
      (listData: ListDataType, result: any) => {
        listData.page === 1 && (listData.total = result.total);
        listData.list.push(...result.list);
      }
    );
  }
  
  export async function unit(data?: any): Promise<any> {
    return getListAll(
      getUnitList,
      (listData: ListDataType) => {
        return {
          ...data,
          page: listData.page,
          page_size: listData.pageSize
        };
      },
      (listData: ListDataType, result: any) => {
        listData.page === 1 && (listData.total = result.total);
        listData.list.push(...result.list);
      }
    );
  }
  
  export async function unitRepo(data?: any): Promise<any> {
    return getListAll(
      getRepoList,
      (listData: ListDataType) => {
        return {
          ...data,
          page: listData.page,
          page_size: listData.pageSize
        };
      },
      (listData: ListDataType, result: any) => {
        listData.page === 1 && (listData.total = result.total);
        listData.list.push(...result.repos);
      }
    );
  }
  
  export async function unitModel(data?: any): Promise<any> {
    return getListAll(
      getModelList,
      (listData: ListDataType) => {
        return {
          ...data,
          page: listData.page,
          page_size: listData.pageSize
        };
      },
      (listData: ListDataType, result: any) => {
        listData.page === 1 && (listData.total = result.total);
        listData.list.push(...result.models);
      }
    );
  }
  
  export async function unitConfig(data?: any): Promise<any> {
    return getListAll(
      getConfigList,
      (listData: ListDataType) => {
        return {
          ...data,
          page: listData.page,
          page_size: listData.pageSize
        };
      },
      (listData: ListDataType, result: any) => {
        listData.page === 1 && (listData.total = result.total);
        listData.list.push(...result.config_map_list);
      }
    );
  }
}