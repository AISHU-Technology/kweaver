import React from 'react';
import { Collapse, Popconfirm } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import NoDataBox from '@/components/NoDataBox';
import { ParamsList as TParamsList } from '../../../../SecondPublishAPI/types';
import './style.less';

export interface ParamsListProps {
  paramsList: TParamsList;
  onEdit?: (item: TParamsList[number]) => void;
  onDelete?: (item: TParamsList[number]) => void; // 删除，返回剩余的参数
}

const getTypeString = (type: string) => {
  const TYPE_ENUM: Record<string, string> = {
    int: intl.get('dpapiService.int'),
    string: intl.get('dpapiService.string'),
    double: intl.get('dpapiService.double'),
    boolean: intl.get('dpapiService.boolean'),
    array: intl.get('dpapiService.array')
  };
  return TYPE_ENUM[type];
};

const ParamsList = (props: ParamsListProps) => {
  const { paramsList, onEdit, onDelete } = props;

  return (
    <Collapse className="cog-service-param-collapse kw-mt-4" ghost>
      {_.map(paramsList, (item, index) => {
        return (
          <Collapse.Panel
            key={item._id}
            header={
              <div
                className="panel-header kw-align-center"
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <div className="kw-ellipsis" title={item.name}>
                  {item.name}
                </div>
                <IconFont type="icon-edit" className="h-icon kw-ml-3 kw-pointer" onClick={() => onEdit?.(item)} />

                <IconFont type="icon-lajitong" className="h-icon kw-ml-3 kw-pointer" onClick={() => onDelete?.(item)} />
              </div>
            }
          >
            <div style={{ padding: '20px 24px 0 28px' }}>
              <div className="p-item kw-pl-4">
                <div className="p-row kw-flex kw-mb-1">
                  <div className="p-label">{intl.get('dpapiService.alias')}</div>：
                  <div className="p-value kw-pl-1 kw-ellipsis" title={item.alias}>
                    {item.alias}
                  </div>
                </div>
                <div className="p-row kw-flex kw-mb-1">
                  <div className="p-label">{intl.get('dpapiService.type')}</div>：
                  <div className="p-value kw-pl-1 kw-ellipsis" title={getTypeString(item.param_type!)}>
                    {getTypeString(item.param_type!)}
                  </div>
                </div>
                <div className="p-row kw-flex kw-mb-1">
                  <div className="p-label">{intl.get('dpapiService.example')}</div>：
                  <div className="p-value kw-pl-1 kw-ellipsis" title={item.example}>
                    {item.example}
                  </div>
                </div>
                <div className="p-row kw-flex">
                  <div className="p-label">{intl.get('global.desc')}</div>：
                  <div className="p-value kw-pl-1 kw-ellipsis" title={item.description}>
                    {item.description || intl.get('global.notDes')}
                  </div>
                </div>
              </div>
            </div>
          </Collapse.Panel>
        );
      })}

      {!paramsList.length && <NoDataBox.NO_CONTENT />}
    </Collapse>
  );
};

export default ParamsList;
