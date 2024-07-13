/* eslint-disable max-lines */
import intl from 'react-intl-universal';
import React, { useState, useEffect } from 'react';
import { Select, Form, Input, Radio, TreeSelect, InputNumber } from 'antd';

import HOOKS from '@/hooks';
import { DownOutlined } from '@ant-design/icons';
import TemplateModal from '@/components/TemplateModal';
import servicesEventStats, { updateMenuDataType, addMenuDataType, listMenuDataType } from '@/services/eventStats';
import './style.less';

const nameRegex = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
const iconRegex = /^[!-~a-zA-Z0-9！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
const codeRegex = /^[a-zA-Z0-9-]+$/;
const routeRegex = /^[a-zA-Z0-9<>/_-]+$/;
const componentRegex = /^[a-zA-Z0-9@<>/_-]+$/;

export interface CreateOrEditModalProps {
  initData: CreateOrEditDataType | undefined;
  resModalVisible: boolean;
  closeResModal: (needRefresh?: boolean) => void;
  comparedData: any[];
  optionalRootId: string | undefined; // 被编辑菜单的所属的根目录id
}

export interface CreateOrEditDataType {
  id?: string; // 资源id，如果存在则为编辑
  cName: string; // 中文名
  eName: string; // 英文名
  code: string; // 资源编码
  icon?: string; // 常规图标
  selectedIcon?: string; // 选中图标
  path?: string; //绝对路径
  component?: string; // 组件路径
  menuType: number; // 菜单类型(1-菜单 2-按钮)
  pid: string; // 父菜单id
  sortOrder: number; // 排序数值
  visible: number; // 是否显示(0-显示 1-不显示)
}

export enum RULE_TYPE {
  ICON = 'icon',
  SELECTED_ICON = 'selectedIcon',
  C_NAME = 'cName',
  E_NAME = 'eName',
  CODE = 'code',
  PATH = 'path',
  COMPONENT = 'component',
  PID = 'pid'
}

export enum INT_BOOLEAN {
  FALSE = 1,
  TRUE = 0
}

export enum MENU_TYPE {
  MENU = 1,
  BUTTON = 2,
  ALL = 3
}

const menuTypeOptions = [
  { value: MENU_TYPE.MENU, label: intl.get('adminManagement.newManagement.createOrEditModal.menu') },
  { value: MENU_TYPE.BUTTON, label: intl.get('adminManagement.newManagement.createOrEditModal.button') }
];

const CreateOrEditModal = (props: CreateOrEditModalProps) => {
  const reqPage = 1;
  const reqSize = -1;
  const reqIsTree = 1;

  // props
  const { initData, resModalVisible, closeResModal, comparedData, optionalRootId } = props;
  // antd form ref
  const [formRef] = Form.useForm();
  // 当前的语言
  const language = HOOKS.useLanguage();
  // 中文名称
  const [cName, setCName] = useState<string | undefined>(initData?.cName);
  // 英文名称
  const [eName, setEName] = useState<string | undefined>(initData?.eName);
  // 资源编码
  const [code, setCode] = useState<string | undefined>(initData?.code);
  // 基础图标
  const [icon, setIcon] = useState<string | undefined>(initData?.icon);
  // 激活图标
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(initData?.selectedIcon);
  // 绝对路径
  const [path, setPath] = useState<string | undefined>(initData?.path);
  // 组件路径
  const [component, setComponent] = useState<string | undefined>(initData?.component);
  // 菜单类型
  const [menuType, setMenuType] = useState<MENU_TYPE | undefined>(initData?.menuType);
  // 上级菜单
  const [pid, setPid] = useState<string | undefined>(initData?.pid);
  // 排序
  const [sortOrder, setSortOrder] = useState<number | undefined>(initData?.sortOrder);
  // 是否显示
  const [visible, setVisible] = useState<INT_BOOLEAN | undefined>(initData?.visible);
  // 属性选择数据源
  const [treeSelectData, setTreeSelectData] = useState<Record<string, any>[]>([]);
  // 设置字段是否验证
  const [isFieldValidating, setIsFieldValidating] = useState<boolean>(initData?.menuType === MENU_TYPE.MENU);

  const fetchResourceTreeData = async () => {
    const fetchDataParam: listMenuDataType = {
      pid: optionalRootId,
      isTree: reqIsTree,
      menuType: menuType!,
      page: reqPage,
      size: reqSize
    };
    const result = (await servicesEventStats.newMenuList(fetchDataParam)) || {};
    if (result.res) {
      const tempFinalTreeData: any[] = [];
      result.res?.data.forEach((item: any) => {
        handlingRecursiveData(tempFinalTreeData, item);
      });
      const finalTreeData = [
        {
          title: language === 'en-US' ? 'Root Menu' : '根目录',
          children: tempFinalTreeData,
          value: '0'
        }
      ];
      setTreeSelectData(finalTreeData);
    }
  };

  const handlingRecursiveData = (processedTreeData: any[], fetchedTreeData: any) => {
    if (!fetchedTreeData.children.length) {
      processedTreeData.push({
        value: fetchedTreeData.id,
        title: language === 'en-US' ? fetchedTreeData.eName : fetchedTreeData.cName
      });
      return;
    }
    const children: any[] = [];
    fetchedTreeData.children.forEach((item: any) => {
      handlingRecursiveData(children, item);
    });
    processedTreeData.push({
      value: fetchedTreeData.id,
      title: language === 'en-US' ? fetchedTreeData.eName : fetchedTreeData.cName,
      children
    });
  };

  useEffect(() => {
    fetchResourceTreeData();
  }, []);

  const createOrEditResource = () => {
    formRef
      .validateFields()
      .then(async () => {
        const result = await sendResThenGetResp();
        if (result.res) {
          closeResModal(true);
        }
      })
      .catch(() => {
        /* empty */
      });
  };

  // 菜单类型变更
  const onInterfaceElementsChanged = (e: any) => {
    // 变更菜单类型时，校验上级菜单
    formRef.validateFields(['create-edit-res-modal-content-parentMenu']);
    // 变更菜单类型时，变更校验项
    setIsFieldValidating(e === MENU_TYPE.MENU);
    // 变更菜单类型
    setMenuType(e);
  };

  // 上级菜单变更
  const onTreeSelectChanged = (e: any) => {
    setPid(e);
  };
  // 基础图标变更
  const onBasicIconChanged = (e: any) => {
    setIcon(e.target.value);
  };
  // 激活图标变更
  const onSelectIconChanged = (e: any) => {
    setSelectedIcon(e.target.value);
  };
  // 中文名称变更
  const onCNameChanged = (e: any) => {
    setCName(e.target.value);
  };
  // 英文名称变更
  const onENameChanged = (e: any) => {
    setEName(e.target.value);
  };
  // 资源编码变更
  const onCodeChanged = (e: any) => {
    setCode(e.target.value);
  };
  // 排序变更
  const onSortChanged = (e: any) => {
    setSortOrder(e);
  };
  // 绝对路径变更
  const onPathChanged = (e: any) => {
    setPath(e.target.value);
  };
  // 组件路径变更
  const onComponentChanged = (e: any) => {
    setComponent(e.target.value);
  };
  // 是否显示变更
  const radioIsShowChanged = (e: any) => {
    setVisible(e.target.value);
  };

  const generateRules = (filedType: RULE_TYPE) => {
    let reg_pattern;
    let error_msg;
    let max_len_or_number;
    let validator_error_msg: any;
    switch (filedType) {
      case RULE_TYPE.C_NAME:
      case RULE_TYPE.E_NAME:
        max_len_or_number = 50;
        reg_pattern = nameRegex;
        error_msg = intl.get('adminManagement.newManagement.errorMsg.inputAllowedError', {
          content: intl.get('adminManagement.newManagement.errorMsg.nameRegex')
        });
        validator_error_msg = intl.get('adminManagement.newManagement.errorMsg.existedError', {
          content: intl.get('adminManagement.newManagement.errorMsg.name')
        });
        break;
      case RULE_TYPE.ICON:
      case RULE_TYPE.SELECTED_ICON:
        max_len_or_number = 50;
        reg_pattern = iconRegex;
        error_msg = intl.get('adminManagement.newManagement.errorMsg.inputAllowedError', {
          content: intl.get('adminManagement.newManagement.errorMsg.iconRegex')
        });
        break;
      case RULE_TYPE.CODE:
        max_len_or_number = 100;
        reg_pattern = codeRegex;
        error_msg = intl.get('adminManagement.newManagement.errorMsg.inputAllowedError', {
          content: intl.get('adminManagement.newManagement.errorMsg.codeRegex')
        });
        validator_error_msg = intl.get('adminManagement.newManagement.errorMsg.existedError', {
          content: intl.get('adminManagement.newManagement.errorMsg.code')
        });
        break;
      case RULE_TYPE.PATH:
        max_len_or_number = 100;
        reg_pattern = routeRegex;
        error_msg = intl.get('adminManagement.newManagement.errorMsg.wrongRouteError');
        validator_error_msg = intl.get('adminManagement.newManagement.errorMsg.existedError', {
          content: intl.get('adminManagement.newManagement.errorMsg.content')
        });
        break;
      case RULE_TYPE.COMPONENT:
        max_len_or_number = 100;
        reg_pattern = componentRegex;
        error_msg = intl.get('adminManagement.newManagement.errorMsg.wrongComponentError');
        validator_error_msg = intl.get('adminManagement.newManagement.errorMsg.existedError', {
          content: intl.get('adminManagement.newManagement.errorMsg.content')
        });
        break;
      case RULE_TYPE.PID:
        validator_error_msg = intl.get('adminManagement.newManagement.errorMsg.parentSameSelfError');
        break;
      default:
        break;
    }
    const notEmpty = (required = true) => {
      return { required, message: intl.get('adminManagement.newManagement.errorMsg.emptyError') };
    };
    const maxRule = {
      max: max_len_or_number,
      message: intl.get('adminManagement.newManagement.errorMsg.maxLengthError', {
        len: max_len_or_number
      })
    };
    const pattern = { pattern: reg_pattern, message: error_msg };
    const validatorErrorFieldValue = {
      validator: async (_: any, value: any) => {
        switch (filedType) {
          case RULE_TYPE.C_NAME: {
            const resultArr = comparedData.filter(item => item.name === value);
            if (resultArr.length) {
              throw new Error(validator_error_msg);
            }
            break;
          }
          case RULE_TYPE.E_NAME: {
            const resultArr = comparedData.filter(item => item.desc === value);
            if (resultArr.length) {
              throw new Error(validator_error_msg);
            }
            break;
          }
          case RULE_TYPE.CODE: {
            const resultArr = comparedData.filter(item => item.code === value);
            if (resultArr.length) {
              throw new Error(validator_error_msg);
            }
            break;
          }
          case RULE_TYPE.PID: {
            // 界面类型为菜单时，上级菜单不能选择根菜单
            // 编辑时，上级菜单不能选择自己本身
            if (initData?.id === pid) {
              throw new Error(validator_error_msg);
            }
            break;
          }
          default:
            break;
        }
      }
    };
    switch (filedType) {
      case RULE_TYPE.C_NAME:
      case RULE_TYPE.E_NAME:
      case RULE_TYPE.CODE:
        return [notEmpty(), maxRule, pattern, validatorErrorFieldValue];
      case RULE_TYPE.PATH:
      case RULE_TYPE.COMPONENT:
        return [notEmpty(isFieldValidating), maxRule, pattern];
      case RULE_TYPE.ICON:
      case RULE_TYPE.SELECTED_ICON:
        return [notEmpty(setIconIsShow() !== 'none' && isFieldValidating), maxRule, pattern];
      case RULE_TYPE.PID:
        return [notEmpty(), validatorErrorFieldValue];
      default:
        break;
    }
  };

  const setIconIsShow = () => {
    let elementDisplay = 'flex';
    if (treeSelectData.length) {
      if (menuType === MENU_TYPE.BUTTON) {
        elementDisplay = 'none';
      }
    }
    return elementDisplay;
  };

  const sendResThenGetResp = async () => {
    let resData;
    if (initData?.id) {
      const requestData: updateMenuDataType = {
        id: initData?.id,
        cName: cName!,
        eName: eName!,
        icon,
        selectedIcon,
        path,
        component,
        menuType: menuType!,
        pid,
        sortOrder,
        visible
      };
      resData = await servicesEventStats.newMenuUpdate(requestData);
    } else {
      const requestData: addMenuDataType = {
        cName: cName!,
        eName: eName!,
        code: code!,
        icon,
        selectedIcon,
        path,
        component,
        menuType: menuType!,
        pid,
        sortOrder,
        visible
      };
      resData = await servicesEventStats.newMenuAdd(requestData);
    }
    return resData;
  };

  return (
    <TemplateModal
      className="create-edit-res-modal"
      width={640}
      title={
        initData?.id
          ? intl.get('adminManagement.newManagement.createOrEditModal.titleEdit')
          : intl.get('adminManagement.newManagement.createOrEditModal.titleCreate')
      }
      open={resModalVisible}
      onCancel={() => closeResModal()}
      onOk={createOrEditResource}
    >
      <div
        style={{
          maxHeight: '610px',
          padding: '24px 24px 48px 24px',
          overflowY: 'scroll'
        }}
        className="create-edit-res-modal-content"
      >
        <Form form={formRef} className="create-edit-res-modal-content-form" layout={'vertical'} requiredMark={true}>
          <Form.Item
            name="create-edit-res-modal-content-element"
            label={intl.get('adminManagement.newManagement.createOrEditModal.interfaceElements')}
            rules={[{ required: true }]}
            initialValue={menuType}
          >
            <Select
              onChange={onInterfaceElementsChanged}
              options={menuTypeOptions}
              disabled={initData?.id !== undefined} // 设计和测试让添加的编辑时不能更改
            ></Select>
          </Form.Item>

          <Form.Item
            name="create-edit-res-modal-content-parentMenu"
            label={intl.get('adminManagement.newManagement.createOrEditModal.parentMenu')}
            rules={generateRules(RULE_TYPE.PID)}
            initialValue={pid}
          >
            <TreeSelect
              treeData={treeSelectData}
              treeLine
              switcherIcon={<DownOutlined />}
              onChange={onTreeSelectChanged}
              getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
            ></TreeSelect>
          </Form.Item>

          <div className="create-edit-res-modal-content-icon" style={{ display: setIconIsShow(), width: '100%' }}>
            <Form.Item
              name="create-edit-res-modal-content-basicIcon"
              style={{ flex: 1 }}
              label={intl.get('adminManagement.newManagement.createOrEditModal.basicIcon')}
              rules={generateRules(RULE_TYPE.ICON)}
              validateFirst={true}
              initialValue={icon}
            >
              <Input
                placeholder={intl.get('adminManagement.newManagement.createOrEditModal.iconPlaceHold')}
                onChange={onBasicIconChanged}
                autoComplete="off"
              ></Input>
            </Form.Item>

            <Form.Item
              name="create-edit-res-modal-content-selectIcon"
              style={{ flex: 1, paddingLeft: 20 }}
              label={intl.get('adminManagement.newManagement.createOrEditModal.selectIcon')}
              rules={generateRules(RULE_TYPE.SELECTED_ICON)}
              initialValue={selectedIcon}
            >
              <Input
                placeholder={intl.get('adminManagement.newManagement.createOrEditModal.iconPlaceHold')}
                onChange={onSelectIconChanged}
                autoComplete="off"
              ></Input>
            </Form.Item>
          </div>

          <div className="create-edit-res-modal-content-name" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="create-edit-res-modal-content-cName"
              style={{ flex: 1 }}
              label={intl.get('adminManagement.newManagement.createOrEditModal.cName')}
              rules={generateRules(RULE_TYPE.C_NAME)}
              validateFirst={true}
              initialValue={cName}
            >
              <Input
                placeholder={intl.get('adminManagement.newManagement.createOrEditModal.cNamePlaceHold')}
                onChange={onCNameChanged}
                autoComplete="off"
              ></Input>
            </Form.Item>

            <Form.Item
              name="create-edit-res-modal-content-eName"
              style={{ flex: 1, paddingLeft: 20 }}
              label={intl.get('adminManagement.newManagement.createOrEditModal.eName')}
              rules={generateRules(RULE_TYPE.E_NAME)}
              initialValue={eName}
            >
              <Input
                placeholder={intl.get('adminManagement.newManagement.createOrEditModal.eNamePlaceHold')}
                onChange={onENameChanged}
                autoComplete="off"
              ></Input>
            </Form.Item>
          </div>

          <div className="create-edit-res-modal-content-code-code" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="create-edit-res-modal-content-code"
              style={{ flex: 1 }}
              label={intl.get('adminManagement.newManagement.createOrEditModal.code')}
              rules={generateRules(RULE_TYPE.CODE)}
              initialValue={code}
            >
              <Input
                placeholder={intl.get('adminManagement.newManagement.createOrEditModal.codePlaceHold')}
                disabled={!!initData?.id}
                onChange={onCodeChanged}
                autoComplete="off"
              ></Input>
            </Form.Item>

            <Form.Item
              name="create-edit-res-modal-content-sort"
              style={{
                display: menuType === MENU_TYPE.MENU ? undefined : 'none',
                flex: 1,
                paddingLeft: 20
              }}
              label={intl.get('adminManagement.newManagement.createOrEditModal.sort')}
              rules={[{ required: true, message: intl.get('adminManagement.newManagement.errorMsg.emptyError') }]}
              initialValue={sortOrder}
              tooltip={intl.get('adminManagement.newManagement.createOrEditModal.sortTooltip')}
            >
              <InputNumber
                placeholder={intl.get('adminManagement.newManagement.createOrEditModal.sortPlaceHold')}
                onChange={onSortChanged}
                min={0}
                step={1}
                autoComplete="off"
                precision={0}
              ></InputNumber>
            </Form.Item>
          </div>

          <Form.Item
            name="create-edit-res-modal-content-route"
            style={{ display: menuType === MENU_TYPE.MENU ? undefined : 'none' }}
            label={intl.get('adminManagement.newManagement.createOrEditModal.route')}
            rules={generateRules(RULE_TYPE.PATH)}
            initialValue={path}
          >
            <Input
              placeholder={intl.get('adminManagement.newManagement.createOrEditModal.routePlaceHold')}
              onChange={onPathChanged}
              autoComplete="off"
            ></Input>
          </Form.Item>

          <Form.Item
            name="create-edit-res-modal-content-component"
            style={{ display: menuType === MENU_TYPE.MENU ? undefined : 'none' }}
            label={intl.get('adminManagement.newManagement.createOrEditModal.component')}
            rules={generateRules(RULE_TYPE.COMPONENT)}
            initialValue={component}
          >
            <Input
              placeholder={intl.get('adminManagement.newManagement.createOrEditModal.componentPlaceHold')}
              onChange={onComponentChanged}
              autoComplete="off"
            ></Input>
          </Form.Item>

          <Form.Item
            name="create-edit-res-modal-content-visible"
            label={intl.get('adminManagement.newManagement.createOrEditModal.visible')}
            rules={[{ required: true }]}
            initialValue={visible}
          >
            <Radio.Group onChange={radioIsShowChanged} value={visible}>
              <Radio value={INT_BOOLEAN.TRUE}>{intl.get('adminManagement.newManagement.createOrEditModal.yes')}</Radio>
              <Radio value={INT_BOOLEAN.FALSE}>{intl.get('adminManagement.newManagement.createOrEditModal.no')}</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </div>
    </TemplateModal>
  );
};

export default CreateOrEditModal;
