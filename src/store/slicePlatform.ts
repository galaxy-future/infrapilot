import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  AppstoreOutlined,
  AppstoreAddOutlined,
  ApartmentOutlined,
  PartitionOutlined,
  BarsOutlined,
  ProfileOutlined,
  TeamOutlined,
  WalletOutlined
} from '@ant-design/icons';

import type { RouterType } from '@/lib/interfaces/public';
import { subscribeInfo } from '@/api/subscribe';

export const thunkSubscribe = createAsyncThunk('platform/subscribeInfo', async () =>
  await subscribeInfo({})
    .then((response: any) => {
      if (response.code !== 200) return;
      
      return response.data;
    })
    .catch(e => console.log(e))
);

export default createSlice({
  name: 'platform',
  initialState: {
    subscribe: {
      expire: 0,
      person: {
        count: 0,
        total: 0
      },
      app: {
        count: 0,
        total: 0
      }
    },
    router: [
      {
        name: '',
        href: '/',
        menuHidden: true
      },
      {
        name: '项目列表',
        href: '/projects',
        icon: AppstoreOutlined,
        children: [
          {
            name: '服务列表',
            href: '/projects/project/[projectId]',
            children: [
              {
                name: '服务',
                href: '/projects/project/[projectId]/service/[serviceId]'
              }
            ],
          }
        ],
        menuName: '项目'
      },
      {
        name: '部署列表',
        href: '/deployments',
        icon: ApartmentOutlined,
        menuName: '部署'
      },
      {
        name: 'Unit列表',
        href: '/units',
        icon: PartitionOutlined,
        children: [
          {
            name: 'Unit',
            href: '/units/unit/[unitId]'
          }
        ],
        menuName: 'Unit'
      },
      {
        name: '配置列表',
        href: '/configs',
        icon: BarsOutlined,
        children: [
          {
            name: '配置',
            href: '/configs/config/[configId]'
          }
        ],
        menuName: '配置'
      },
      {
        name: '外部依赖',
        href: '/dependencies',
        icon: AppstoreAddOutlined,
        children: [
          {
            name: 'dependencies',
            href: '/dependencies/dependency/[dependencyId]'
          }
        ]
      },
      {
        name: '模版市场',
        href: '/templates',
        icon: ProfileOutlined,
        children: [
          {
            name: '模版',
            href: '/templates/template/[templateId]'
          }
        ]
      },
      {
        name: '成员',
        href: '/team',
        icon: TeamOutlined
      },
      {
        name: '用量',
        href: '/wallet',
        icon: WalletOutlined,
        children: [
          {
            name: '充值',
            href: '/pay'
          }
        ]
      }
    ] as RouterType[],
    history: [] as string[]
  },
  reducers: {
    addHistory: (state, action) => {
      state.history.push(action.payload.path);
    },
    
    cleanHistory: (state, action) => {
      state.history.length = 0;
    }
  },
  extraReducers(builder) {
    builder
      .addCase(thunkSubscribe.fulfilled, (state, action) => {
        if (!action.payload) return;
        
        state.subscribe.expire = Number(action.payload.expire_at);
        state.subscribe.person.count = action.payload.members_count;
        state.subscribe.person.total = action.payload.members_limit;
        state.subscribe.app.count = action.payload.apps_count;
        state.subscribe.app.total = action.payload.apps_limit;
      });
  }
});