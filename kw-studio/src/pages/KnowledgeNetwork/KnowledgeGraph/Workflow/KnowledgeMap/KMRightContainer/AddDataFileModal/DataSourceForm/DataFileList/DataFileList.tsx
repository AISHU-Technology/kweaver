import React, { useEffect, useMemo, useRef, useState } from 'react';
import SearchInput from '@/components/SearchInput';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { fuzzyMatch } from '@/utils/handleFunction';
import FileIcon from '@/components/FileIcon';
import './style.less';
import classNames from 'classnames';
import LoadingMask from '@/components/LoadingMask';
import NoDataBox from '@/components/NoDataBox';
import IconFont from '@/components/IconFont';

interface DataFileListProps {
  value?: string[] | string; // 配置该属性则证明受控
  onChange?: (selectedValue: string[] | string, arData: any) => void;
  dataSource: string[]; // 数据列表原始数据源
  loading?: boolean;
  multiple?: boolean; //  是否多选
  partitionData?: any[]; // 分区数据
  selectedDS?: any;
  errors?: any;
}

/**
 * 数据文件列表
 * @param props
 * @constructor
 */
const DataFileList: React.FC<DataFileListProps> = props => {
  const {
    value,
    onChange,
    dataSource,
    loading = false,
    multiple = false,
    partitionData = [],
    selectedDS = {},
    errors
  } = props;
  const [keyword, setKeyword] = useState('');
  const searchInputRef = useRef<any>(null);
  const [selectedData, setSelectedData] = useState<string[] | string>('');

  const isControlled = 'value' in props; // 是否受控

  /**
   * 数据源变化清空搜索条件
   */
  useEffect(() => {
    setKeyword('');
    searchInputRef.current?.setValue('');
  }, [dataSource]);

  const onSearch = _.debounce(e => {
    setKeyword(e.target.value);
  }, 300);

  /**
   * 列表数据的点击事件
   * @param item
   */
  const onClick = (item: any) => {
    const isRobot = selectedDS.data_source === 'AnyRobot';
    const data = isRobot ? item?.id : item;
    const select = isControlled ? value : selectedData;
    if ((multiple && select?.includes(data)) || select === data) {
      // if ((multiple && select?.includes(item)) || select === item) {
      return;
    }
    const res = multiple ? [...(select as string[]), data] : data;
    // const res = multiple ? [...(select as string[]), item] : item;
    if (!isControlled) {
      setSelectedData(res);
    }
    onChange && onChange(res, item);
  };

  const showData = useMemo(() => {
    return dataSource?.filter((item: any) => fuzzyMatch(keyword, item?.name || item));
  }, [keyword, dataSource]);

  const partitionTable = useMemo(() => {
    return partitionData.map(item => item.table_name);
  }, [partitionData]);

  const prefixCls = 'data-source-list';

  const newSelectedData = isControlled ? value : selectedData;

  return (
    <div className={classNames(`${prefixCls}-root`, 'kw-flex-column kw-pt-1 kw-h-100')}>
      <LoadingMask loading={loading} />
      <div style={{ padding: '0 12px' }}>
        <SearchInput
          style={{ width: '100%' }}
          ref={searchInputRef}
          placeholder={intl.get('graphList.enter')}
          onChange={e => {
            e.persist();
            onSearch(e);
          }}
        />
      </div>
      <div className={classNames('kw-flex-item-full-height kw-mt-1')} style={{ overflow: 'auto' }}>
        {showData.map((tableName: any, index: any) => {
          const sheet = tableName?.name || tableName;
          const sheetId = tableName?.id || tableName;
          return (
            <div
              key={index}
              className={classNames(
                `${prefixCls}-item kw-align-center kw-pl-3`,
                {
                  [`${prefixCls}-item-selected`]: multiple
                    ? newSelectedData?.includes(sheetId)
                    : newSelectedData === sheetId
                },
                { [`${prefixCls}-item-disabled`]: errors?.current?.errors[sheet] }
              )}
              onClick={() => onClick(tableName)}
            >
              <FileIcon type="sheet" size={16} className="kw-mr-2" dataSource={selectedDS.data_source} />
              <span className="kw-ellipsis kw-flex-item-full-width" title={sheet}>
                {sheet}
              </span>
              {partitionTable.includes(sheetId) && (
                <IconFont
                  type="icon-fenqupeizhi"
                  className="kw-mr-2"
                  title={intl.get('workflow.information.already')}
                />
              )}
            </div>
          );
        })}
        {(dataSource.length === 0 || showData.length === 0) && <NoDataBox type="NO_RESULT" />}
      </div>
    </div>
  );
};

export default DataFileList;
