import React, { useState, useMemo, useEffect } from 'react';
import { Checkbox } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import servicesCreateEntity from '@/services/createEntity';
import SearchInput from '@/components/SearchInput';
import FileIcon from '@/components/FileIcon';
import LoadingMask from '@/components/LoadingMask';
import NoDataBox from '@/components/NoDataBox';
import ExplainTip from '@/components/ExplainTip';
import { fuzzyMatch } from '@/utils/handleFunction';
import { DsSourceItem } from '../types';
import './style.less';

export interface DataSheetProps {
  source: DsSourceItem;
  checkedValues: string[];
  selectedKey?: string;
  errors?: Record<string, string>;
  extraTip?: string;
  onChange: (keys: string[]) => void;
  onNameClick: (sheet: string, source?: any, data?: any) => void;
}

const DataSheet = (props: DataSheetProps) => {
  const { source, checkedValues, selectedKey, errors = {}, extraTip, onChange, onNameClick } = props;
  const [sheetList, setSheetList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const showData = useMemo(() => {
    if (source?.data_source === 'AnyRobot') {
      return _.filter(sheetList, (d: any) => fuzzyMatch(keyword, d?.name));
    }
    return _.filter(sheetList, d => fuzzyMatch(keyword, d));
  }, [sheetList, keyword]);

  useEffect(() => {
    source.id && getDataSheet();
  }, [source.id]);

  /**
   * 获取数据库中的数据表
   */
  const getDataSheet = async () => {
    const params = {
      ds_id: source.id,
      data_source: source.data_source,
      postfix: ''
    };
    setLoading(true);
    const { res } = (await servicesCreateEntity.getDataList(params)) || {};
    setLoading(false);
    res && setSheetList(res.output);
  };

  /**
   * 勾选
   */
  const handleCheck = (key: string, isCheck: boolean) => {
    const newKeys = isCheck ? [...checkedValues, key] : checkedValues.filter(k => k !== key);
    onChange(newKeys);
  };

  /**
   * 点击预览
   */
  const handleClick = (sheet: any, selected: boolean) => {
    if (selected) return;
    if (source.data_source === 'AnyRobot') {
      onNameClick(sheet?.id, '', sheet);
      return;
    }
    onNameClick(sheet);
  };

  const onSearch = _.debounce(e => {
    setKeyword(e.target.value);
  }, 300);

  return (
    <div className="extract-sheet-list-root kw-h-100">
      <LoadingMask loading={loading} />
      <div className="kw-flex">
        <SearchInput
          className="s-input kw-mt-2 kw-mb-2"
          placeholder={intl.get('graphList.enter')}
          onChange={(e: any) => {
            e.persist();
            onSearch(e);
          }}
        />
        {extraTip && (
          <ExplainTip title={extraTip} placement="bottom" autoMaxWidth>
            <div className="icon-mask">
              <BulbOutlined />
            </div>
          </ExplainTip>
        )}
      </div>

      <div className="list-box">
        {_.map(showData, (sheet: any) => {
          const isRobot = source.data_source === 'AnyRobot';
          const sheetShow = isRobot ? sheet?.name : sheet;
          const isCheck = _.includes(checkedValues, sheetShow);
          const selected = selectedKey === sheetShow;

          return (
            <div
              className={classNames('sheet-item kw-align-center kw-pointer', { selected })}
              key={sheet}
              onClick={() => handleClick(sheet, selected)}
            >
              <div
                className="check-mask"
                onClick={e => {
                  e.stopPropagation();
                  handleCheck(sheetShow, !isCheck);
                }}
              >
                <Checkbox className="kw-ml-3 kw-mr-2" checked={isCheck} />
              </div>
              <div className={classNames('click-mask', { disabled: errors[sheet?.name || sheet] })}>
                <FileIcon
                  type="sheet"
                  size={16}
                  className="kw-mr-2"
                  dataSource={source?.data_source === 'AnyRobot' ? source?.data_source : ''}
                />
                <span className="s-name kw-ellipsis" title={sheetShow}>
                  {sheetShow}
                </span>
              </div>
            </div>
          );
        })}

        {!!sheetList.length && !showData.length && <NoDataBox type="NO_RESULT" />}
      </div>
    </div>
  );
};

export default DataSheet;
