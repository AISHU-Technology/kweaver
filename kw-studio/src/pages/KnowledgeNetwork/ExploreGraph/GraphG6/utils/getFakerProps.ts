import _ from 'lodash';

// 假组件不响应函数
export const getFakerProps = <T>(_props: T): T => {
  const props: any = { ..._props };
  _.forEach(_.keys(props), key => {
    if (typeof props[key] === 'function') {
      props[key] = () => 0;
    }
  });
  return props;
};
