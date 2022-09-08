import React, { memo } from 'react';
import { Select, Button, Empty, ConfigProvider } from 'antd';
import intl from 'react-intl-universal';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;

const Header = props => {
  const { graphData, selectGraph, onClose, onChange } = props;

  return (
    <div className="search-ui-header">
      <div className="flex-wrapper">
        <Select
          className="graph-seelct"
          bordered={false}
          value={selectGraph.kg_name}
          onChange={(_, option) => onChange(option.data)}
          getPopupContainer={triggerNode => triggerNode.parentElement}
          notFoundContent={<Empty image={kongImg} description={intl.get('searchConfig.nodata')} />}
        >
          {graphData.map(item => (
            <Option key={item.kg_id} value={item.kg_name} data={item}>
              {item.kg_name}
            </Option>
          ))}
        </Select>

        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default" onClick={onClose}>
            {intl.get('search.close')}
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
};

Header.defaultProps = {
  graphData: [],
  selectGraph: {},
  onClose: () => {},
  onChange: () => {}
};

export default memo(Header);
