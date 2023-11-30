export enum RoleTypeEnum { // 角色类型枚举
  Creator = 'owner', // 创建者
  Manager = 'manager', // 管理员
  Member = 'member' // 普通成员
}

export const RoleTypeDict = [ // 角色类型字典
  {
    label: '创建者',
    value: RoleTypeEnum.Creator,
    expand: {
      color: 'red'
    }
  },
  {
    label: '管理员',
    value: RoleTypeEnum.Manager,
    expand: {
      color: 'orange'
    }
  },
  {
    label: '成员',
    value: RoleTypeEnum.Member,
    expand: {
      color: 'blue'
    }
  }
];