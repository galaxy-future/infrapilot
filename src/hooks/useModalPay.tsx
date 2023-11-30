import {
  useRouter
} from 'next/router';
import {
  Modal
} from 'antd';

export default function useModalPay() {
  const router = useRouter();
  
  return (response: any) => {
    if (!response || response.code !== 2104) return;
    
    Modal.confirm({
      content: '您的可用额度不足，请充值后继续部署',
      okType: 'default',
      okText: '取消',
      onOk: () => {
      },
      cancelButtonProps: {
        type: 'primary'
      },
      cancelText: '充值',
      onCancel: () => {
        router.push('/pay');
      }
    });
  }
}