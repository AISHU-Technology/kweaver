import React from 'react';
import _ from 'lodash';

import DisplayShape from './DisplayShape';
import DisplayIcon from './DisplayIcon';

const DisplayStyle = (props: any) => {
  const { selectedItem } = props;
  const { onChangeData } = props;

  return (
    <div className="displayStyleRoot">
      <DisplayShape selectedItem={selectedItem} onChangeData={onChangeData} />
      <DisplayIcon selectedItem={selectedItem} onChangeData={onChangeData} />
    </div>
  );
};

export default DisplayStyle;
