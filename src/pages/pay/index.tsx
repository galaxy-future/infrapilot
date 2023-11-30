import {
  type ReactNode,
  useState, useEffect
} from 'react';
import { useRouter } from 'next/router';
import {
  Card, Typography,
  Row, Col, Space,
  Form, Radio, Button,
  Divider, Result,
  message
} from 'antd';
import {
  RightOutlined
} from '@ant-design/icons';

import {
  PayTypeEnum, PayTypeDict,
  SystemTypeEnum, OrderStateEnum,
  requestGetBalance, requestGetRechargeInfo,
  requestGetPayResult, requestPay
} from '@/api/pay';

import Style from './index.module.css';

enum PageEnum {
  Default = '', // 默认
  SelectMoney = 'selectMoney', // 选择金额
  SelectType = 'selectType', // 选择类型
  PayResult = 'payResult' // 支付结果
}

type RechargeItemType = {
  key: number,
  amount: number;
  points: number;
  discount_points: number;
  discount_amount: number;
  priority: number;
};
type FormInstanceType = {
  type: PayTypeEnum;
  amount: number;
};

const payImage = (prop: any) => {
  const { stateRechargeList, stateOrder } = prop,
    item = stateRechargeList.find((v: RechargeItemType) => v.key === stateOrder.amount);
  
  return <div className={ Style.box_text }>
    <p>扫描二维码支付</p>
    <p>￥{ item?.discount_amount / 100 }</p>
    <p>充值额度：<span>{ item?.discount_points }</span>点</p>
    <p>支付过程中请勿切换或关闭页面</p>
  </div>
};
const payResult = (prop: any) => {
  const { stateBalance, stateRechargeList, stateOrder } = prop,
    item = stateRechargeList.find((v: RechargeItemType) => v.key === stateOrder.amount);
  
  return <div className={ Style.box_info }>
    <p>
      充值额度：
      <span>{ item?.discount_points }</span>
      点（余额：<span>{ stateBalance }</span>点）
    </p>
    <p>订单编号：{ stateOrder.id }</p>
  
  </div>
};
const getBalance = async (prop: any): Promise<any> =>
  await requestGetBalance({})
    .then((response: any) => {
      const { setStateBalance } = prop;
      
      if (response.code !== 200) return;
      
      setStateBalance(response.data.balance);
    });
const getRechargeInfo = async (prop: any): Promise<any> =>
  await requestGetRechargeInfo({})
    .then((response: any) => {
      const {
        setStatePage, setStateChannelList,
        setStateRechargeList,
        stateOrder, setStateOrder,
        form
      } = prop;
      
      if (response.code !== 200) return;
      
      setStatePage(PageEnum.SelectMoney);
      setStateChannelList(response.data.payment_channel);
      setStateRechargeList(
        response.data.discount_info_list
          .map((v: RechargeItemType) => ({ ...v, key: v.amount }))
          .sort((a: RechargeItemType, b: RechargeItemType) => {
            if (a.priority > b.priority) return -1;
            if (a.priority < b.priority) return 1;
            return 0
          })
      );
      setStateOrder({
        ...stateOrder,
        type: response.data.default_payment_channel,
        amount: response.data.default_amount
      });
      form.setFieldsValue({
        type: response.data.default_payment_channel,
        amount: response.data.default_amount
      });
    });
const getPayResult = async (prop: any): Promise<any> =>
  await requestGetPayResult({
    order_id: prop.stateOrder.id
  })
    .then((response: any) => {
      const {
        setStatePage,
        stateOrder, setStateOrder
      } = prop;
      
      if (response.code !== 200) return;
      if (response.data.order_status === OrderStateEnum.UnPaid) return;
      
      setStateOrder({
        ...stateOrder,
        state: response.data.order_status
      });
      setStatePage(PageEnum.PayResult);
    });
const pay = async (prop: any): Promise<any> => {
  const {
      setStatePage,
      stateRechargeList,
      stateOrder, setStateOrder
    } = prop,
    item = stateRechargeList.find((v: RechargeItemType) => v.key === stateOrder.amount);
  
  await requestPay({
    payment_channel: stateOrder.type,
    payment_sub_channel: SystemTypeEnum.Native,
    amount: item.discount_amount
  })
    .then((response: any) => {
      
      if (response.code !== 200) return;
      
      setStateOrder({
        ...stateOrder,
        id: response.data.order_id,
        qr: response.data.qr_code,
        state: OrderStateEnum.Paid
      });
      
      setStatePage(PageEnum.SelectType);
    })
};
let setTime: any = null,
  time: number = 0;

export default function Pay(): ReactNode {
  const router = useRouter();
  const [ statePage, setStatePage ] = useState<PageEnum>(PageEnum.Default);
  const [ stateBalance, setStateBalance ] = useState<number>(0);
  const [ stateChannelList, setStateChannelList ] = useState<PayTypeEnum[]>([]);
  const [ stateRechargeList, setStateRechargeList ] = useState<RechargeItemType[]>([]);
  const [ stateOrder, setStateOrder ] = useState({
    id: '',
    qr: '',
    state: OrderStateEnum.UnPaid,
    type: PayTypeEnum.WeChat,
    amount: 0
  });
  const [ form ] = Form.useForm<FormInstanceType>();
  
  useEffect(() => {
    switch (statePage) {
      case PageEnum.Default:
        getBalance({ setStateBalance });
        getRechargeInfo({
          setStatePage,
          setStateChannelList, setStateRechargeList,
          stateOrder, setStateOrder,
          form
        });
        break;
      case PageEnum.SelectMoney:
        form.setFieldValue('order', '');
        break;
      case PageEnum.SelectType:
        getPayResult({ setStatePage, stateOrder, setStateOrder });
        
        setTime && clearInterval(setTime);
        setTime = setInterval(() => {
          time++;
          if (time >= 60) {
            clearInterval(setTime);
            
            setStatePage(PageEnum.SelectMoney);
            message.error('支付失败，请稍后重试');
            return;
          }
          
          getPayResult({ setStatePage, stateOrder, setStateOrder });
        }, 1000);
        break;
      case PageEnum.PayResult:
        getBalance({ setStateBalance });
        break;
    }
    
    return () => {
      setTime && clearInterval(setTime);
    };
  }, [ statePage ]);
  
  return <Form form={ form } initialValues={ stateOrder }
               onValuesChange={ (value, valueAll) => setStateOrder({ ...stateOrder, ...valueAll }) }>
    {
      statePage === PageEnum.SelectMoney &&
      <Card>
        <Typography.Title className={ Style.title_1 }
                          level={ 1 }>
          快速充值
        </Typography.Title>
        <div className={ Style.balance }>
          可用额度：<span>{ stateBalance }</span>点
        </div>
        <Form.Item className={ Style.box_radio }
                   name="amount">
          <Radio.Group className={ Style.radio }>
            <Row className={ Style.row }
                 gutter={ [ 20, 20 ] }>
              {
                stateRechargeList.map(v =>
                  <Col key={ v.key } flex="0 0 20%">
                    <Radio.Button className={ Style.box_recharge }
                                  value={ v.key }>
                      <Typography.Title level={ 3 }>
                        { v.points }&nbsp;点
                      </Typography.Title>
                      <div className={ Style.discount }>
                        {
                          v.discount_amount !== v.amount &&
                          <span>￥{ v.discount_amount / 100 }</span>
                        }
                        <span>￥{ v.amount / 100 }</span>
                      </div>
                    </Radio.Button>
                  </Col>
                )
              }
            </Row>
          </Radio.Group>
        </Form.Item>
        <div className={ Style.box_protocol }>
          <Button type="link">
            充值条款与条件
            <RightOutlined />
          </Button>
        </div>
        <div className={ Style.box_button }>
          <Space size="large" align="center">
            <Button onClick={ () => router.back() }>
              取消
            </Button>
            <Button type="primary"
                    onClick={ () => pay({ setStatePage, stateRechargeList, stateOrder, setStateOrder }) }>
              确定
            </Button>
          </Space>
        </div>
      </Card>
    }
    {
      statePage === PageEnum.SelectType &&
      <Card>
        <Typography.Title className={ Style.title_4 }
                          level={ 4 }>
          选择支付方式
        </Typography.Title>
        <Form.Item name="type">
          <Radio.Group>
            {
              stateChannelList.map(v =>
                <Radio className={ Style.type_radio }
                       key={ v } value={ v }>
                  <div className={ Style.box_image }>
                    <img alt=""
                         src={ PayTypeDict.find(vv => vv.value === v)?.expand.icon.src } />
                  </div>
                </Radio>
              )
            }
          </Radio.Group>
        </Form.Item>
        <Divider />
        <div className={ Style.box_qr }>
          <div className={ Style.qr }>
            {
              stateOrder.qr &&
              <img alt=""
                   src={ stateOrder.qr } />
            }
            { payImage({ stateRechargeList, stateOrder }) }
          </div>
        </div>
      </Card>
    }
    {
      statePage === PageEnum.PayResult &&
      <Card>
        {
          (stateOrder.state === OrderStateEnum.UnPaid || stateOrder.state === OrderStateEnum.Paid) &&
          <Result className={ Style.result }
                  status="success" title="充值成功" />
        }
        {
          stateOrder.state === OrderStateEnum.Expired &&
          <Result className={ Style.result }
                  status="warning" title="充值失败" />
        }
        <Divider />
        { payResult({ stateBalance, stateRechargeList, stateOrder }) }
        <div className={ Style.box_button }>
          <Space size="large" align="center">
            <Button onClick={ () => router.push('/') }>
              返回首页
            </Button>
            <Button type="primary"
                    onClick={ () => setStatePage(PageEnum.SelectMoney) }>
              继续充值
            </Button>
          </Space>
        </div>
      </Card>
    }
  </Form>;
}