import intl from 'react-intl-universal';

// 分区变量样例
export const EXAMPLE_SHOW = [
  {
    type: intl.get('workflow.information.previous'),
    regular: "$date_format($date_add($current_timestamp(),-1),'YYYYMMdd')"
  },
  {
    type: intl.get('workflow.information.current'),
    regular: "$date_format($current_timestamp(),'YYYY-MM-dd')"
  },
  {
    type: intl.get('workflow.information.last'),
    regular: "$date_format($date_add($current_timestamp(),1),'YYYY/MM/dd')"
  },
  {
    type: intl.get('workflow.information.before'),
    regular: "$date_format($hour_add($date_add($current_timestamp(),-1),-1),'YYYY-MM-dd:HH')"
  }
];
