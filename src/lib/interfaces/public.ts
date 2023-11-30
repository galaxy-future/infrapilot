export type RouterType = {
  name: string; // 名称
  href: string; // 地址
  icon?: any; // 图标
  children?: RouterType[]; // 子元素
  menuName?: string; // 菜单-别名
  menuHidden?: boolean; // 菜单-隐藏
};