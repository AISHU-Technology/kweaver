import React, { useLayoutEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import intl from 'react-intl-universal';
import EditorIntention from '../../../components/EditorIntention';
import { EmptyIntention } from '../../../components/EmptyBox';
import RenderItem from './RenderItem';

import './style.less';
import { tipModalFunc } from '@/components/TipModal';

type IntentListType = {
  fileName: string; // 上传的文件
  intentList: any[];
  updateIntention: (data: any, change?: any) => void;
};

const IntentList = (props: IntentListType) => {
  const { intentList, fileName, updateIntention } = props;
  const [selected, setSelected] = useState<any>('');
  const [hasEditor, setHasEditor] = useState<boolean>(false); // 同时只能存在一个输入框
  const getUniqueId = (prefix: any) => _.uniqueId(prefix);

  useLayoutEffect(() => {
    setHasEditor(false);
  }, [fileName]);

  /** 新建按钮 */
  const onAddIntention = () => {
    if (hasEditor) return;
    const addData = { editor: true, id: getUniqueId('intent'), slots: [] };
    updateIntention((pre: any) => [addData, ...pre]);
    setHasEditor(true);
  };

  /** 删除确认框 */
  const confirmDel = (type: 'intent' | 'slot') => {
    const title =
      type === 'intent'
        ? intl.get('cognitiveSearch.qaAdvConfig.delIntTitle')
        : intl.get('cognitiveSearch.qaAdvConfig.delSlotTitle');
    const content =
      type === 'intent'
        ? intl.get('cognitiveSearch.qaAdvConfig.delIntContent')
        : intl.get('cognitiveSearch.qaAdvConfig.delSlotContent');
    return tipModalFunc({
      title,
      content,
      closable: false
    });
  };

  /** 意图菜单
   * edit、add 只是激活输入框，数据还未改变
   */
  const onClickIntMenu = async (key: string, data: any) => {
    if (key === 'delete') {
      const isOk = await confirmDel('intent');
      if (!isOk) return;
      const newData = _.filter(intentList, item => item?.id !== data?.id);
      updateIntention(newData, { data, key: 'delete' });
    }
    if (key === 'edit') {
      const newData = _.map(intentList, item => {
        if (item?.id === data?.id) return { ...item, editor: true };
        return item;
      });
      setHasEditor(true);
      updateIntention(newData);
    }
    if (key === 'add') {
      const newData = _.map(intentList, item => {
        const itemSlots = _.isArray(item?.slots) ? item?.slots : [];
        if (item?.id === data?.id) {
          return { ...item, slots: [{ editor: true, id: getUniqueId('intent') }, ...itemSlots] };
        }
        return item;
      });
      setHasEditor(true);
      updateIntention(newData);
    }
  };

  /** 槽位菜单 */
  const onClickSlotMenu = async (key: string, data: any, parent: any) => {
    const listKV = _.keyBy(intentList, 'id');
    const slotList = listKV?.[parent?.id]?.slots;
    if (key === 'delete') {
      const isOk = await confirmDel('slot');
      if (!isOk) return;
      const newSlot = _.filter(slotList, item => item?.id !== data?.id);
      const updateList = _.map(intentList, item => {
        if (item?.id === parent?.id) return { ...item, slots: newSlot };
        return item;
      });
      updateIntention(updateList, { parent, data, key: 'delete' });
    }
    if (key === 'edit') {
      const newSlot = _.map(slotList, item => {
        if (item?.id === data?.id) return { ...item, editor: true };
        return item;
      });
      const updateList = _.map(intentList, item => {
        if (item?.id === parent?.id) return { ...item, slots: newSlot };
        return item;
      });
      setHasEditor(true);
      updateIntention(updateList);
    }
  };

  /**
   * 更新意图
   * @param data 更新的数据 意图名key：intent
   * @param id 需要更新的id
   */
  const onIntentOk = (data: { name: string; description: string }, opData: any) => {
    const key = opData?.intent ? 'edit' : 'add';

    const newList = _.map(intentList, item => {
      if (opData?.id === item?.id) {
        return { ..._.omit(item, 'editor'), intent: data?.name, description: data?.description };
      }
      return item;
    });
    updateIntention(newList, { data: opData, key, newData: data });
    setHasEditor(false);
  };

  /** 跟新槽位
   * 槽位名key：name
   */
  const onSlotOK = (data: { name: string; description: string }, opData: any, parent: any) => {
    const key = opData?.name ? 'edit' : 'add';
    const listKV = _.keyBy(intentList, 'id');
    const slotList = listKV?.[parent?.id]?.slots;
    const newslot = _.map(slotList, item => {
      if (opData?.id === item?.id) return { ..._.omit(item, 'editor'), ...data };
      return item;
    });
    const newList = _.map(intentList, item => {
      if (item?.id === parent?.id) return { ...item, slots: newslot };
      return item;
    });
    setHasEditor(false);
    updateIntention(newList, { data: opData, parent, key, newData: data });
  };

  // 取消修改意图名称描述
  const onIntCancel = (isEdit: boolean, id: any) => {
    if (isEdit) {
      const newList = _.map(intentList, item => {
        if (id === item?.id) return _.omit(item, 'editor');
        return item;
      });
      updateIntention(newList);
    } else {
      const newList = _.filter(intentList, item => item?.id !== id);
      updateIntention(newList);
    }
    setHasEditor(false);
  };

  // 取消修改槽位名称描述
  const onSlotCancel = (isEdit: boolean, id: any, parentId: any) => {
    const listKV = _.keyBy(intentList, 'id');
    const slotList = listKV?.[parentId]?.slots;
    if (isEdit) {
      const newslot = _.map(slotList, item => {
        if (id === item?.id) return _.omit(item, 'editor');
        return item;
      });
      const newList = _.map(intentList, item => {
        if (item?.id === parentId) return { ...item, slots: newslot };
        return item;
      });
      updateIntention(newList);
    } else {
      const newslot = _.filter(slotList, item => item?.id !== id);
      const newList = _.map(intentList, item => {
        if (item?.id === parentId) return { ...item, slots: newslot };
        return item;
      });
      updateIntention(newList);
    }
    setHasEditor(false);
  };

  return (
    <div className="intentListRoot">
      <div className="kw-c-primary kw-mb-3 kw-pointer kw-ml-3">
        <div className={classNames({ 'kw-c-watermark': hasEditor })} onClick={onAddIntention}>
          <IconFont type="icon-Add" />
          <span>{intl.get('cognitiveSearch.qaAdvConfig.addIntent')}</span>
        </div>
      </div>
      {_.isEmpty(intentList) && <EmptyIntention style={{ marginTop: 50 }} onCreate={onAddIntention} />}
      {_.map(intentList, (item, index) => {
        return (
          <div key={index}>
            {item?.editor ? (
              <EditorIntention
                data={item}
                existData={intentList}
                type="intent"
                onOk={(data: any) => onIntentOk(data, item)}
                onCancel={(e: any) => onIntCancel(e, item?.id)}
              />
            ) : (
              <RenderItem
                data={item}
                hasEditor={hasEditor}
                onSelected={setSelected}
                className={classNames({ selected: selected === item?.id })}
                opList={[
                  { key: 'add', label: intl.get('cognitiveSearch.qaAdvConfig.addSlot') },
                  { key: 'edit', label: intl.get('cognitiveSearch.qaAdvConfig.editIntent') },
                  { key: 'delete', label: intl.get('cognitiveSearch.qaAdvConfig.delIntent') }
                ]}
                onClick={(e: string) => {
                  onClickIntMenu(e, item);
                }}
              />
            )}
            <div className="kw-flex kw-pl-3">
              <div className="kw-mr-1 kw-mt-1 kw-ml-3" style={{ width: 1, background: 'rgba(0,0,0,0.1)' }} />
              <div className="kw-mt-1 kw-w-100">
                {_.map(item?.slots, (slot, sIndex) => {
                  if (slot?.editor) {
                    return (
                      <EditorIntention
                        data={slot}
                        existData={item?.slots}
                        type="slot"
                        onOk={(data: any) => onSlotOK(data, slot, item)}
                        onCancel={(e: any) => onSlotCancel(e, slot?.id, item?.id)}
                      />
                    );
                  }
                  return (
                    <RenderItem
                      key={sIndex}
                      data={slot}
                      hasEditor={hasEditor}
                      onSelected={setSelected}
                      className={classNames({ selected: selected === slot?.id })}
                      opList={[
                        { key: 'edit', label: intl.get('cognitiveSearch.qaAdvConfig.editSlot') },
                        { key: 'delete', label: intl.get('cognitiveSearch.qaAdvConfig.deleteSlot') }
                      ]}
                      onClick={(e: any) => {
                        onClickSlotMenu(e, slot, item);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default IntentList;
