import React, { useEffect, useMemo, useState } from 'react';
import { Select, Checkbox, Empty } from 'antd';

import { CloseOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { GraphIcon } from '@/utils/antv6';
import noResImg from '@/assets/images/noResult.svg';

import './style.less';
import classNames from 'classnames';
import { fuzzyMatch } from '@/utils/handleFunction';
type SelectConfigTagsProps = {
  className?: string;
  value: Array<string>;
  classList: Array<any>;
  onChange: (data: any) => void;
  getPopupContainer?: any;
  showSearch?: boolean;
};
const SelectConfigTags = (props: SelectConfigTagsProps) => {
  const { className, classList, value, onChange, getPopupContainer, showSearch = false } = props;
  const [initValue, setInitValue] = useState<any>('all');
  const [data, setData] = useState<any>(classList);
  const [searchValue, setSearchValue] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    if (!searchValue) return setData(classList);
    const matchData = _.filter(classList, d => fuzzyMatch(searchValue, d.alias));
    setData(matchData);
  }, [classList, searchValue]);

  const selectedNodes = useMemo(() => {
    if (!value) {
      const names = _.map(classList, e => e?.name);
      const data = _.map(classList, (g: any) => {
        return { value: g.name, alias: g.alias, color: g?.color };
      });

      return { names, data };
    }
    const names: any = [];
    const data: any = [];
    _.forEach(classList, item => {
      if (_.includes(value, item?.name)) {
        names?.push(item?.name);
        data?.push({ value: item.name, alias: item.alias, color: item?.color });
      }
    });

    const current = names?.length === classList?.length ? 'all' : undefined;
    setInitValue(current);

    return { names, data };
  }, [value, classList]);

  // 全选
  const onChangeAll = (e: any) => {
    if (e?.target?.checked) {
      const className = _.map(classList, e => e?.name);
      onChange(className);
    } else {
      onChange([]);
    }
  };

  // 监听复选框
  const changeSelect = (item: any) => {
    if (_.includes(selectedNodes?.names, item?.name)) {
      const className = _.filter(selectedNodes?.names, e => e !== item?.name);
      onChange(className);
    } else {
      const names = _.concat(selectedNodes?.names, [item?.name]);
      onChange(names);
    }
  };

  // 自定义下拉框的内容
  const getDropDownRender = () => {
    if (_.isEmpty(data)) {
      return <Empty image={noResImg} description={intl.get('global.noResult')} />;
    }
    return (
      <div className="kw-p-4" style={{ maxHeight: 300, overflowY: 'auto' }}>
        {!(showSearch && searchValue) && (
          <Checkbox
            onChange={e => onChangeAll(e)}
            indeterminate={!!selectedNodes?.names?.length && selectedNodes?.names?.length < classList?.length}
            checked={selectedNodes?.names?.length === classList?.length}
          >
            {intl.get('global.checkAll')}
          </Checkbox>
        )}

        {_.map(data, (item, index) => {
          const { alias, icon, color } = item;
          return (
            <div
              key={item?.name}
              className="kw-align-center kw-pointer"
              style={{ height: 32 }}
              onClick={() => changeSelect(item)}
            >
              <Checkbox checked={selectedNodes?.names?.includes(item?.name)} />
              <div
                className="kw-center kw-ml-2 kw-mr-2"
                style={{ height: 16, width: 16, borderRadius: '50%', background: color }}
              >
                <GraphIcon type={icon} style={{ color: '#fff' }} />
              </div>
              <div className="kw-ellipsis kw-c-text" title={alias} style={{ flex: 1 }}>
                {alias}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * 自定义标签,
   */
  const tagRender = (props: any) => {
    const { label, value } = props;
    const data = _.find(selectedNodes?.data, item => item?.value === value);
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };
    return (
      <span className="entity-tag kw-align-center" onMouseDown={onPreventMouseDown}>
        <span
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            height: 12,
            width: 12,
            borderRadius: '50%',
            background: data?.color
          }}
        />
        <span
          className="kw-ellipsis kw-ml-2"
          title={data?.alias}
          style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: 120 }}
        >
          {data?.alias}
        </span>
        <CloseOutlined
          className="kw-ml-1 kw-pointer kw-c-subtext"
          style={{ display: 'inline-block', verticalAlign: 'middle' }}
          onClick={() => changeSelect({ name: value })}
        />
      </span>
    );
  };

  return (
    <div className={classNames(className, 'start-point-selector')}>
      <Select
        mode={initValue !== 'all' ? 'multiple' : undefined}
        showArrow={true}
        style={{ width: '100%' }}
        value={initValue !== 'all' ? selectedNodes?.names : intl.get('exploreGraph.all')}
        onChange={(newValue: string[]) => {
          onChange(newValue);
          setInitValue(newValue);
        }}
        placeholder={intl.get('cognitiveService.neighbors.selectEntityType')}
        maxTagCount="responsive"
        tagRender={tagRender}
        dropdownRender={getDropDownRender}
        getPopupContainer={getPopupContainer}
        autoClearSearchValue={!showSearch}
        showSearch={showSearch}
        searchValue={showSearch ? searchValue : undefined}
        onSearch={value => showSearch && setSearchValue(value || '')}
        onDropdownVisibleChange={visible => {
          if (showSearch) {
            !visible && setSearchValue('');
            setDropdownVisible(visible);
          }
        }}
        // 搜索模式强制关闭避免抖动
        dropdownClassName={showSearch && !dropdownVisible ? 'start-point-selector-forceHide' : ''}
      />
    </div>
  );
};
export default SelectConfigTags;
