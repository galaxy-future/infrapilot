import DayJS from 'dayjs';
import {
  type ReactNode, useEffect,
  useRef, useState
} from 'react';
import {
  Form, DatePicker,
  type TableProps, Table,
  Space, Row, Col,
  Button,
  message
} from 'antd';

import { showFormError } from '@/utils/public';
import {
  PayTypeEnum, PayTypeDict,
  requestGetRechargeList
} from '@/api/pay';
import Style from './index.module.css';

type FormInstanceType = {
  time: DayJS.Dayjs[]
};
type TableItemType = {
  key: string;
  order_id: string;
  payment_channel: PayTypeEnum;
  amount: number;
  points: number;
  create_at: number;
};

const datePickerClean = (prop: any, time: DayJS.Dayjs[] = []) => {
  const {
    stateForm, setStateForm,
    setStateTime,
    form
  } = prop;
  
  setStateForm({ ...stateForm, time });
  setStateTime([]);
  form.setFieldValue('time', time);
};
const datePickerDisabled = (prop: any) =>
  (current: DayJS.Dayjs) => {
    const { stateTime } = prop;
    
    return current && (
      (stateTime[0] && current >= stateTime[0].startOf('day').add(7, 'day')) ||
      (stateTime[1] && current <= stateTime[1].endOf('day').subtract(7, 'day')) ||
      current > DayJS().endOf('day')
    );
  };
const datePickerFooter = (prop: any) =>
  function datePickerFooterDom(): ReactNode {
    const {
        refDatePicker,
        stateForm, setStateForm,
        setStateTime,
        form
      } = prop,
      setTime: Function = (time: DayJS.Dayjs[]) =>
        () => {
          datePickerClean({ stateForm, setStateForm, setStateTime, form, time });
          refDatePicker.current.blur();
        };
    
    return <Space className={ Style.space } size="small">
      <Button size="small" type="primary"
              onClick={
                setTime([
                  DayJS().startOf('day').subtract(7, 'day'),
                  DayJS().endOf('day')
                ])
              }>
        最近一周
      </Button>
    </Space>
  };
const tableColumn = (prop: any): TableProps<TableItemType>['columns'] => [
  {
    dataIndex: 'order_id',
    title: '订单号',
    width: 200,
    ellipsis: true
  },
  {
    dataIndex: 'payment_channel',
    title: '渠道',
    width: 100,
    ellipsis: true,
    render: (v: PayTypeEnum, record: TableItemType, index: number) =>
      <>{ PayTypeDict.find(vv => vv.value === v)?.label }</>
  },
  {
    dataIndex: 'create_at',
    title: '时间',
    width: 200,
    ellipsis: true,
    render: v => v
      ? DayJS(v).format('YYYY.MM.DD HH:mm:ss')
      : '-'
  },
  {
    dataIndex: 'points',
    title: '点数',
    width: 100,
    ellipsis: true
  },
  {
    dataIndex: 'amount',
    title: '金额',
    width: 100,
    ellipsis: true,
    render: (v: number, record: TableItemType, index: number) =>
      <>￥ { v / 100 }</>
  }
];
const submit = async (prop: any): Promise<any> =>
  prop.form.validateFields()
    .then(async () => {
      const {
        stateForm,
        statePagination, setStatePagination,
        setStateList
      } = prop;
      
      getList({ stateForm, statePagination, setStatePagination, setStateList });
    })
    .catch(e => showFormError(e));
const getList = async (prop: any): Promise<any> =>
  await requestGetRechargeList({
    ...(
      prop.stateForm.time && prop.stateForm.time.length === 2
        ? {
          begin_time: prop.stateForm.time[0] && prop.stateForm.time[0].startOf('day').unix(),
          end_time: prop.stateForm.time[1] && prop.stateForm.time[1].endOf('day').unix(),
        }
        : {}
    ),
    page_number: prop.statePagination.current,
    page_size: prop.statePagination.pageSize
  })
    .then((response: any) => {
      const {
        statePagination, setStatePagination,
        setStateList
      } = prop;
      
      if (response.code !== 200) return;
      
      setStatePagination({
        ...statePagination,
        total: response.data.pager.total
      });
      setStateList(
        response.data.order_list
          ? response.data.order_list.map((v: TableItemType) => ({
            ...v,
            key: v.order_id
          }))
          : []
      );
    });

export default function WalletTableRecharge(): ReactNode {
  const [ form ] = Form.useForm<FormInstanceType>();
  const refDatePicker = useRef<any>(null);
  const [ stateForm, setStateForm ] = useState<FormInstanceType>({
    time: []
  });
  const [ statePagination, setStatePagination ] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total: number, range: [ number, number ]) => `总数：${ total }条`,
    onChange: (page: number, pageSize: number) => {
      statePagination.pageSize !== pageSize &&
      (page = 1);
      
      setStatePagination({
        ...statePagination,
        current: page,
        pageSize
      });
    }
  });
  const [ stateList, setStateList ] = useState<TableItemType[]>([]);
  const [ stateTime, setStateTime ] = useState<any[]>([]);
  const propData = {
    form,
    refDatePicker,
    stateForm, setStateForm,
    statePagination, setStatePagination,
    stateList, setStateList,
    stateTime, setStateTime
  };
  
  useEffect(() => {
    submit(propData);
  }, [
    statePagination.current,
    statePagination.pageSize
  ]);
  
  return <>
    <Form form={ form } initialValues={ stateForm }
          onValuesChange={ (value: any, valueAll: any) => setStateForm({ time: valueAll.time || [] }) }>
      {
        false &&
        <Row gutter={ [ 20, 0 ] }>
          <Col span={ 10 }>
            <Form.Item name="time" label="时间范围">
              <DatePicker.RangePicker className={ Style.datePicker } ref={ refDatePicker }
                                      renderExtraFooter={ datePickerFooter(propData) }
                                      disabledDate={ datePickerDisabled({ stateTime }) }
                                      onOpenChange={ (open) => open && datePickerClean(propData) }
                                      onCalendarChange={ (date, dateString) => setStateTime(date || []) } />
            </Form.Item>
          </Col>
          <Col span={ 3 }>
            <Button type="primary"
                    onClick={ () => submit(propData) }>
              查询
            </Button>
          </Col>
        </Row>
      }
    </Form>
    <Table columns={ tableColumn(propData) } pagination={ statePagination }
           dataSource={ stateList } scroll={ { x: 0 } } />
  </>;
}