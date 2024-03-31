import React, { useState, useEffect, forwardRef, useImperativeHandle, useReducer } from 'react';
import { Checkbox, Input, message, Switch, Collapse } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { v4 as generateUuid } from 'uuid';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import CustomConfigModal from './CustomConfigModal';
import DefaultConfigModal from './DefaultConfigModal';
import { getDefaultConfig, showTitle, defaultNodeDoubleClick } from './enums';
import { generateConfig, mergeSavedConfig, checkRelationKey, flatFromTree } from './assistant';
import './style.less';
import ExplainTip from '@/components/ExplainTip';
import { getRenderTemplate } from './template';

const defaultFeatures = {
  welcomeMessage: { visible: false, content: '', error: '' },
  paramsTool: { visible: true },
  toolbar: { visible: true },
  resultPanel: { visible: false }
};
type BaseFeatures = typeof defaultFeatures;
type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
const reducer = (state: BaseFeatures, action: DeepPartial<BaseFeatures>) => _.merge({ ...state }, action);
const validateError = (value: string) => {
  if (!value) return intl.get('global.noNull');
  if ([...value].length > 50) {
    // TODO 转成数组可正常判断部分emoji表情长度, 复杂表情仍是多字节长度无法准确判断
    return intl.get('global.lenErr', { len: 50 });
  }
  return '';
};
// 没有打开过配置弹窗, 生成默认配置让外部调用
export const getConfigJson = () => {
  const { config, selectedKeys } = getDefaultConfig();
  const configArray = flatFromTree(config);
  const configMap = _.keyBy(configArray, 'key');
  const configs = generateConfig(configMap, selectedKeys, defaultFeatures);
  return JSON.stringify(configs);
};

/**
 * PC嵌入配置项
 * WARNING 后续添加配置需要关注enums.ts和template.ts两个文件;
 * 1. 前端使用时, 所有配置全部铺平成一维数组, 存入映射configMap, 只修改这一份数据;
 * 2. enums.ts 中声明的配置, 决定了保存到后端的数据格式, 为了兼容新老版本, 不应大改;
 * 3. template.ts 中声明的模板定义了如何渲染, 可任意变更, 通过key值从configMap取到真正数据;
 */
const EmbedConfig = (props: any, ref: any) => {
  const { savedPCConfig, basicData, onChange } = props;
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const { selectedKeys: keys } = getDefaultConfig();
    return keys;
  }); // 已选的配置key
  const [operation, setOperation] = useState<Record<string, any>>({ action: '', type: '', visible: false, data: {} }); // 编辑的配置信息
  const closeOperationModal = () => setOperation({ action: '', type: '', visible: false, data: {} }); // 关闭编辑弹窗
  const [features, dispatchFeatures] = useReducer(reducer, _.cloneDeep(defaultFeatures));
  const [renderTemplate] = useState(() => getRenderTemplate());
  const [configMap, setConfigMap] = useState(() => {
    const { config } = getDefaultConfig();
    const configs = flatFromTree(config);
    return _.keyBy(configs, 'key');
  });

  useImperativeHandle(ref, () => ({
    /**
     * 生成最终配置
     * 勾选配置的交互更新频繁, 所以不暴露onChange方法, 外部在需要的时候自行获取最终配置
     */
    getConfig: () => {
      if (features.welcomeMessage.visible) {
        const error = validateError(features.welcomeMessage.content);
        dispatchFeatures({ welcomeMessage: { error } });
        if (error) return null;
      }
      return generateConfig(configMap, selectedKeys, features);
    },
    /**
     * 重置
     */
    reset: () => {
      const { selectedKeys: keys } = getDefaultConfig();
      setSelectedKeys(keys);
      dispatchFeatures(_.cloneDeep(defaultFeatures));
    }
  }));

  // 还原已保存的配置
  useEffect(() => {
    if (_.isEmpty(savedPCConfig)) return;
    try {
      const [config, keys, featuresConfig] = mergeSavedConfig(_.cloneDeep(savedPCConfig));
      dispatchFeatures(featuresConfig);
      setSelectedKeys(keys);
      setConfigMap(_.keyBy(flatFromTree(config), 'key'));
    } catch (err) {
      //
    }
  }, [savedPCConfig]);

  // 配置变化, 通知外部组件
  useEffect(() => {
    onChange?.(generateConfig(configMap, selectedKeys, features));
  }, [configMap, selectedKeys, features]);

  /**
   * 新增配置
   * @param data 新增的节点
   */
  const onAdd = (data: Record<string, any>) => {
    setOperation({ action: 'create', type: 'custom', visible: true, data });
  };

  /**
   * 确认新增配置
   * @param data 新增的节点
   */
  const customConfirmOk = (data: Record<string, any>) => {
    if (operation.action === 'create') {
      const newConfig = { ...configMap };
      const parent = { ...operation.data };
      const key = generateUuid();
      const child = {
        ...data,
        key,
        pKey: parent.key,
        type: 'custom'
      };
      newConfig[key] = child;
      parent.children?.push(child);
      _.merge(newConfig[parent.key], parent);
      setConfigMap(newConfig);
      setSelectedKeys(pre => [...pre, key]); // [bug 372794]新增的个性化配置之后，自动勾选
      message.success(intl.get('analysisService.configSuccess'));
    }

    if (operation.action === 'edit') {
      const newConfig = { ...configMap };
      const newItem = { ...operation.data, ...data };
      _.merge(newConfig[newItem.key], newItem);

      // 同步修改绑定的名称
      const bindConfigs = _.filter(_.values(newConfig), d => d.bind === newItem.key);
      _.forEach(bindConfigs, d => {
        _.merge(newConfig[d.key], _.pick(newItem, 'name', 'alias'));
      });

      setConfigMap(newConfig);
      message.success(intl.get('ThesaurusManage.editWordsSuccess'));
    }
    closeOperationModal();
  };

  /**
   * 点击编辑配置
   * @param data 编辑的节点
   */
  const onEdit = (data: Record<string, any>) => {
    setOperation({
      action: 'edit',
      type: data.type === 'custom' ? 'custom' : 'default',
      visible: true,
      data
    });
  };

  /**
   * 确认编辑
   * @param data 新的数据
   */
  const confirmEdit = (data: Record<string, any>) => {
    const newConfig = { ...configMap };
    _.merge(newConfig[data.key], data);
    setConfigMap(newConfig);
    closeOperationModal();
    message.success(intl.get('analysisService.configSuccess'));
  };

  /**
   * 点击更换配置
   * @param data 更换的节点
   */
  const onChangeConfig = (data: Record<string, any>) => {
    setOperation({ action: 'change', type: 'default', visible: true, data });
  };

  /**
   * 确认更换
   * @param data 新的数据
   * @param oldData 被替换的数据
   */
  const confirmChange = (data: Record<string, any>, oldData?: any) => {
    const { pKey, key: oldKey } = oldData || operation.data;
    const newConfig = { ...configMap };
    const newItem = { ...data, pKey };
    newConfig[data.key] = newItem;
    Reflect.deleteProperty(newConfig, oldKey);
    _.merge(newConfig[pKey], {
      key: pKey,
      children: [newItem]
    });
    setConfigMap(newConfig);
    message.success(intl.get('analysisService.opSuccess'));

    // 如果已勾选, 更新
    const index = _.findIndex(selectedKeys, k => k === oldKey);
    if (index > -1) {
      const newKeys = [...selectedKeys];
      newKeys[index] = data.key;
      setSelectedKeys(newKeys);
    }

    closeOperationModal();
  };

  /**
   * 移除自定义配置项
   * @param data 移除的配置
   */
  const onRemove = (data: Record<string, any>) => {
    const newConfig = { ...configMap };
    Reflect.deleteProperty(newConfig, data.key);
    _.remove(newConfig[data.pKey]?.children, (d: any) => d.key === data.key);
    setConfigMap(newConfig);

    if (_.includes(selectedKeys, data.key)) {
      setSelectedKeys(pre => pre.filter(k => k !== data.key));
    }

    // WARNING 点双击事件有绑定, 恢复默认的一度邻居查询, 指定key更新, 暂时这么处理
    const config = newConfig.nodeDoubleClick_basic;
    const bindConfig = _.find(config?.children, c => c.bind === data.key);
    if (bindConfig) {
      _.merge(newConfig.nodeDoubleClick_basic, {
        key: 'nodeDoubleClick_basic',
        children: [{ ...defaultNodeDoubleClick }]
      });
      setConfigMap({ ...newConfig });
      const index = _.findIndex(selectedKeys, k => k === bindConfig.key);
      if (index > -1) {
        setSelectedKeys(pre => {
          const newKeys = [...pre];
          newKeys[index] = data.key;
          return newKeys;
        });
      }
    }
  };

  /**
   * 勾选单个配置
   * @param isCheck 是否勾选
   * @param data 勾选的数据
   */
  const onCheckSingle = (isCheck: boolean, data: Record<string, any>) => {
    setSelectedKeys(pre => {
      const keys = isCheck ? [...pre, data.key] : pre.filter(key => key !== data.key);
      return checkRelationKey(keys);
    });
  };

  /**
   * 全选
   * @param isCheck 是否全选
   * @param data 全选的配置(二级节点)
   */
  const onCheckAll = (isCheck: boolean, data: Record<string, any>) => {
    const childKeys = _.flattenDeep(
      _.map(data?.children, c => {
        if (c.children) return _.map(c.children, cc => cc.key);
        return c.key;
      })
    );
    const newKeys = isCheck
      ? _.uniq([...selectedKeys, ...childKeys])
      : _.filter(selectedKeys, key => !_.includes(childKeys, key));
    setSelectedKeys(checkRelationKey(newKeys));
  };

  /**
   * 欢迎语开关变化
   */
  const onWelcomeSwitchChange = (checked: boolean) => {
    dispatchFeatures({
      welcomeMessage: {
        visible: checked,
        // 每次打开自动填充消息
        ...(checked && !features.welcomeMessage.content
          ? { content: intl.get('analysisService.welcomeText'), error: '' }
          : {})
      }
    });
  };

  /**
   * 修改欢迎语
   */
  const onWelcomeChange = (e: any) => {
    const { value } = e.target;
    const error = validateError(value);
    dispatchFeatures({ welcomeMessage: { content: value, error } });
  };

  /**
   * 渲染
   * @param data
   */
  const renderConfig = (data: any) => {
    const { key, children, level, title, allowCheck, allowAdd, renderConfigs } = data;
    const curItem = configMap[key];
    const isDisabled = _.includes(key, 'toolbar') && !features.toolbar.visible;
    const isDoubleEvtConfig = key === 'nodeDoubleClick_basic';

    // 一级标题
    if (level === 'h1') {
      return (
        <Collapse.Panel
          key={key}
          header={
            <div className="p-title kw-space-between kw-c-header">
              <span onClick={e => e.stopPropagation}>
                {title || showTitle(key)}
                {isDoubleEvtConfig && (
                  <ExplainTip arrowPointAtCenter title={intl.get('analysisService.doubleEvtTip')} />
                )}
              </span>
              {key === 'toolbar' && (
                <Switch
                  className="kw-ml-5"
                  checked={features.toolbar.visible}
                  onClick={(v, e) => e.stopPropagation()}
                  onChange={checked => dispatchFeatures({ toolbar: { visible: checked } })}
                />
              )}
            </div>
          }
        >
          <div className="config-parent-item" style={isDoubleEvtConfig ? { paddingLeft: 16 } : undefined}>
            {renderConfigs ? renderChildren(key) : _.map(children, c => renderConfig(c))}
          </div>
        </Collapse.Panel>
      );
    }

    // 二级标题
    if (level === 'h2') {
      return (
        <div key={key} className="items-box">
          <div className="sub-title kw-c-header">
            {title || showTitle(key)}
            {allowCheck && (
              <span className={classNames('check-btn-bar kw-ml-3 kw-c-subtext', { disabled: isDisabled })}>
                <span className="c-btn kw-pointer" onClick={() => !isDisabled && onCheckAll(true, curItem)}>
                  {intl.get('global.checkAll')}
                </span>
                &nbsp;/&nbsp;
                <span className="c-btn kw-pointer" onClick={() => !isDisabled && onCheckAll(false, curItem)}>
                  {intl.get('analysisService.unCheckAll')}
                </span>
              </span>
            )}
          </div>

          {renderConfigs && !children?.length && renderChildren(key, allowAdd)}
          {renderConfigs &&
            children?.length &&
            _.map(children, c => (
              <React.Fragment key={c.key}>
                <div className="kw-c-subtext kw-mb-2 kw-pl-2">{c.title || showTitle(c.key)}</div>
                {renderChildren(c.key, c.allowAdd)}
              </React.Fragment>
            ))}
        </div>
      );
    }
  };

  // 渲染 一大块 配置项
  const renderChildren = (parentKey: string, allowAdd?: boolean) => {
    const isDisabled = _.includes(parentKey, 'toolbar') && !features.toolbar.visible;
    const data = configMap[parentKey];

    return (
      <div className="items-list kw-flex">
        {renderChildrenItem(parentKey)}
        {/* {allowAdd && (
          <div
            className={classNames(
              'children-item add-item-btn',
              isDisabled ? 'disabled-btn' : 'kw-c-primary kw-pointer'
            )}
            onClick={() => !isDisabled && onAdd(data)}
          >
            <IconFont type="icon-Add" className="kw-mr-2" />
            {intl.get('analysisService.addConfig')}
          </div>
        )} */}
      </div>
    );
  };

  // 渲染 单个 配置项
  const renderChildrenItem = (parentKey: string) => {
    const isDisabled = _.includes(parentKey, 'toolbar') && !features.toolbar.visible;
    const data = configMap[parentKey];
    if (!data?.children) return;
    return _.map(data.children, item => {
      const curItem = configMap[item.key] || item;
      const { key, pKey, type, alias } = curItem;
      const isCheck = _.includes(selectedKeys, key);
      const isDoubleEvtConfig = pKey === 'nodeDoubleClick_basic';
      const isCustom = type === 'custom';
      const unEditable = _.includes(key, 'algorithm');

      return (
        <div key={key} className="children-item kw-align-center">
          <Checkbox
            className="kw-mr-2"
            checked={isCheck}
            disabled={isDisabled}
            onChange={e => onCheckSingle(e.target.checked, curItem)}
          />
          <span className="i-name kw-c-text kw-ellipsis" title={alias || showTitle(key)}>
            {alias || showTitle(key)}
          </span>
          <span
            className={classNames('click-mask kw-pointer', { unEditable })}
            title={isDoubleEvtConfig ? intl.get('global.replace') : intl.get('global.edit')}
            onClick={() => !unEditable && (isDoubleEvtConfig ? onChangeConfig(curItem) : onEdit(curItem))}
          >
            {isDoubleEvtConfig ? <IconFont type="icon-qiehuan1" rotate={90} /> : <IconFont type="icon-edit" />}
          </span>
          {isCustom && (
            <span className="click-mask kw-pointer" title={intl.get('global.delete')} onClick={() => onRemove(curItem)}>
              <CloseCircleFilled style={{ color: '#b4b4b4' }} />
            </span>
          )}
        </div>
      );
    });
  };

  return (
    <div className="search-service-embed-config-root">
      <div className="scroll-wrap kw-pt-4">
        <Collapse className="config-Collapse" ghost>
          {_.map(renderTemplate, renderConfig)}
        </Collapse>
      </div>

      <CustomConfigModal
        visible={operation.type === 'custom' && operation.visible}
        action={operation.action}
        graphId={basicData.kg_id}
        knwId={basicData.knw_id}
        data={operation.data}
        totalConfig={configMap}
        onOk={customConfirmOk}
        onCancel={closeOperationModal}
      />

      <DefaultConfigModal
        visible={operation.type === 'default' && operation.visible}
        action={operation.action}
        data={operation.data}
        totalConfig={configMap}
        onOk={operation.action === 'change' ? confirmChange : confirmEdit}
        onCancel={closeOperationModal}
      />
    </div>
  );
};

export default forwardRef(EmbedConfig);
