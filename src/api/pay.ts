import fetchData from '@/api/_request';
import ImagePayWechat from '@/../public/pay/pay_Wechat.png';
import ImagePayAlipay from '@/../public/pay/pay_Alipay.png';

export enum PayTypeEnum { // 支付类型
  None, // 无
  WeChat, // 微信
  Alipay // 支付宝
}

export const PayTypeDict = [ // 支付类型字典
  {
    label: '微信',
    value: PayTypeEnum.WeChat,
    expand: {
      icon: ImagePayWechat
    }
  },
  {
    label: '支付宝',
    value: PayTypeEnum.Alipay,
    expand: {
      icon: ImagePayAlipay
    }
  }
];

export enum SystemTypeEnum { // 系统类型
  Native = 1,
  H5,
  JSApi,
  Applet
}

export enum OrderStateEnum { // 订单状态枚举
  UnPaid = 'UnPaid', // 待支付
  Paid = 'Paid', // 已支付
  Expired = 'Expired' // 失效
}

export function requestGetBalance(param: any): Promise<any> {
  return fetchData(`/api/v1/user/info/balance`, param);
}

export function requestGetBillList(param: any): Promise<any> {
  return fetchData(`/api/v1/cost`, param);
}

export function requestGetRechargeList(param: any): Promise<any> {
  return fetchData(`/api/v1/user/order/list`, param);
}

export function requestGetRechargeInfo(param: any): Promise<any> {
  return fetchData(`/api/v1/user/recharge/info`, param);
}

export function requestGetPayResult(param: any): Promise<any> {
  return fetchData(`/api/v1/user/order/${ param.order_id }`, param);
}

export function requestPay(data: any): Promise<any> {
  return fetchData(`/api/v1/user/recharge`, data, 'post');
}