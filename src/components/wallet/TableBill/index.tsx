import {
  type ReactNode, useEffect,
  useRef, useState
} from 'react';
import {
  useRouter
} from 'next/router';
import {
  Form, DatePicker,
  type TableProps, Table,
  Space, Row, Col,
  Button, message
} from 'antd';
import DayJS from 'dayjs';

import { requestGetBillList } from '@/api/pay';
import { showFormError } from '@/utils/public';
import Style from './index.module.css';

type FormInstanceType = {
  time: DayJS.Dayjs[]
};
type TableItemType = {
  key: string;
  team_id: string;
  pre_id: string;
  pre_name: string;
  service_id: string;
  service_name: string;
  cost: number;
  cost_source: 'cpu_instance' | 'gpu_instance';
  cpu_usage: number;
  gpu_usage_time: string;
  gpu_type: number;
  memory_usage: number;
  begin_time: number;
  end_time: number;
};

const round = (num: number, decimal: number = 3): string => {
  const d = Math.pow(10, decimal);
  return (Math.round(num * d) / d).toFixed(decimal);
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
          datePickerClean(prop);
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
    dataIndex: 'service_name',
    title: '服务名称',
    width: 170,
    ellipsis: true,
    render: (v: string, record: TableItemType, index: number) =>
      <Button type="link" className="no_padding ellipsis_button"
              onClick={ () => prop.router.push(`/projects/project/${ record.pre_id }/service/${ record.service_id }`) }>
        { v || '-' }
      </Button>
  },
  {
    dataIndex: 'pre_name',
    title: '所属项目',
    width: 170,
    ellipsis: true,
    render: (v: string, record: TableItemType, index: number) =>
      <Button type="link" className="no_padding ellipsis_button"
              onClick={ () => prop.router.push(`/projects/project/${ record.pre_id }`) }>
        { v || '-' }
      </Button>
  },
  {
    title: '用量明细',
    width: 170,
    ellipsis: true,
    render: (text: string, record: TableItemType, index: number) =>
      <>
        {
          record.cost_source === 'cpu_instance' &&
          <>
            <div className={ Style.usage }>
              CPU:&nbsp;
              { round(record.cpu_usage) }&nbsp;
              <span>Core*min</span>
            </div>
            <div className={ Style.usage }>
              内存:&nbsp;
              { round(record.memory_usage) }&nbsp;
              <span>GiB*min</span>
            </div>
          </>
        }
        {
          record.cost_source === 'gpu_instance' &&
          <>
            <div className={ Style.usage }>
              GPU:&nbsp;
              { record.gpu_type }
            </div>
            <div className={ Style.usage }>
              时长:&nbsp;
              { record.gpu_usage_time }&nbsp;
              <span>min</span>
            </div>
          </>
        }
      </>
  },
  // {
  //   dataIndex: 'cost',
  //   title: '消费点数',
  //   width: 100,
  //   ellipsis: true,
  //   render: (text: number, record: TableItemType, index: number) =>
  //     <>{ round(text) }</>
  // },
  {
    title: '使用时间',
    width: 300,
    ellipsis: true,
    render: (text: string, record: TableItemType, index: number) =>
      <>
        { DayJS(record.begin_time * 1000).format('YYYY.MM.DD HH:mm') }
        &nbsp;~&nbsp;
        { DayJS(record.end_time * 1000).format('YYYY.MM.DD HH:mm') }
      </>
  }
];
const submit = async (prop: any): Promise<any> =>
  prop.form.validateFields()
    .then(async () => {
      getList(prop);
    })
    .catch(e => showFormError(e));
const getList = async (prop: any): Promise<any> =>
  await requestGetBillList({
    ...(
      prop.stateForm.time && prop.stateForm.time.length === 2
        ? {
          begin_time: prop.stateForm.time[0] && prop.stateForm.time[0].startOf('day').unix(),
          end_time: prop.stateForm.time[1] && prop.stateForm.time[1].endOf('day').unix(),
        }
        : {}
    ),
    page: prop.statePagination.current,
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
        total: response.data.total
      });
      setStateList(
        response.data.costs
          ? response.data.costs.map((v: TableItemType) => ({
            ...v,
            key: '' +
                 v.team_id + v.pre_id + v.service_id +
                 v.begin_time + v.end_time
          }))
          : []
      );
    });

export default function WalletTableBill(): ReactNode {
  const router = useRouter();
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
    router, form,
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
    </Form>
    <Table columns={ tableColumn(propData) } pagination={ statePagination }
           dataSource={ stateList } scroll={ { x: 0 } } />
  </>;
}