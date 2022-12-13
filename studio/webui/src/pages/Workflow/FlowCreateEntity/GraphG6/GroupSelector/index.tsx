import React, { useMemo, useRef } from 'react';
import { Select, Divider, Button, Empty } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

export interface GroupSelectorProps {
  groupList: any[]; // 分组数据
  value: number[]; // 已选分组
  onChange: (ids: number[]) => void; // 改变分组回调
  onCreateGroup: () => void; // 点击添加分组
}

const GroupSelector = (props: GroupSelectorProps) => {
  const { groupList, value, onChange, onCreateGroup } = props;
  const ungrouped = useRef<any>({}); // 未分组数据缓存

  // 转换Selector渲染数据
  const options = useMemo(() => {
    return groupList.map((g: any) => {
      if (g.isUngrouped) ungrouped.current = { ...g };
      return { value: g.id, label: g.name };
    });
  }, [groupList]);

  // 处理受控值, 为空时显示`未分组`
  const showValues = useMemo(() => {
    return value.length ? [...value] : [ungrouped.current.id];
  }, [value]);

  /**
   * 处理选择的分组数据, 始终过滤未分组
   * @param ids 分组id
   */
  const handleChange = (ids: number[]) => {
    if (ids.includes(ungrouped.current.id) && !showValues.includes(ungrouped.current.id)) {
      return onChange([]);
    }
    const curIds = ids.filter(id => id !== ungrouped.current.id);
    onChange(curIds);
  };

  /**
   * 标签删除事件
   * @param value Select value
   */
  const onTagDelete = (value: number) => {
    handleChange(showValues.filter(id => id !== value));
  };

  /**
   * 自定义标签, antd 的Tag组件触发删除有bug
   */
  const tagRender = (props: any) => {
    const { label, value } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };
    return (
      <span className="group-tag" onMouseDown={onPreventMouseDown}>
        <span
          className="ad-ellipsis"
          title={label}
          style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: 120 }}
        >
          <IconFont type="icon-putongwenjianjia" className="ad-mr-1" />
          {label}
        </span>
        <CloseOutlined
          className="ad-ml-1 ad-pointer ad-c-subtext"
          style={{ display: 'inline-block', verticalAlign: 'middle' }}
          onClick={() => onTagDelete(value)}
        />
      </span>
    );
  };

  return (
    <div className="c-group-selector">
      <Select
        className="ad-w-100"
        placeholder={intl.get('createEntity.groupSelectorPlace')}
        getPopupContainer={triggerNode => triggerNode.parentElement}
        allowClear
        showArrow
        mode="multiple"
        optionFilterProp="label"
        listHeight={32 * 5}
        maxTagCount={1}
        options={options}
        value={showValues}
        onChange={handleChange}
        tagRender={tagRender}
        notFoundContent={<Empty className="ad-mb-4" image={kongImg} description={intl.get('global.noData')} />}
        dropdownRender={menu => (
          <>
            {menu}
            <Divider className="ad-m-0" />
            <Button type="link" block style={{ textAlign: 'left' }} onClick={onCreateGroup}>
              <IconFont type="icon-Add" />
              {intl.get('createEntity.createGroupBtn')}
            </Button>
          </>
        )}
      />
    </div>
  );
};

export default GroupSelector;
