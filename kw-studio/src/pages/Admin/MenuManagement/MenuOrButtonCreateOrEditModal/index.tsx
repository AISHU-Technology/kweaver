/* eslint-disable max-lines */
import _ from 'lodash';
import intl from 'react-intl-universal';
import React, { useState, useEffect } from 'react';
import { Select, Form, Input, Radio, TreeSelect, InputNumber } from 'antd';

import HOOKS from '@/hooks';
import { DownOutlined } from '@ant-design/icons';
import TemplateModal from '@/components/TemplateModal';
import servicesPermission, { addSourceDataType, updateSourceDataType } from '@/services/rbacPermission';

import './style.less';
import { RESOURCE_TYPE } from '..';

// 正则匹配
const nameRegex = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
const iconRegex = /^[!-~a-zA-Z0-9！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
const codeRegex = /^[a-zA-Z0-9-]+$/;
const routeRegex = /^[a-zA-Z0-9<>/_-]+$/;

// create or edit modal props
export interface MenuOrButtonCreateOrEditModalProps {
  menuOrButtonInitData: MenuOrButtonCreateOrEditDataType | undefined;
  resModalVisible: boolean;
  closeResModal: (needRefresh?: boolean) => void;
  comparedData: any[];
  // 前置条件：编辑、菜单
  // 字段说明：被编辑菜单的所属的根目录id
  // 业务类：实际id
  // 系统类：0
  optionalRootId: string | undefined;
}

export interface MenuOrButtonCreateOrEditDataType {
  id?: string; // 资源id，如果存在则为编辑
  interfaceElements: ELEMENTS_TYPE; // 界面元素
  businessType: BUSINESS_TYPE; // 领域类型
  parentMenu: string; // 父资源
  basicIcon: string; // 常规图标
  selectIcon: string; // 选中图标
  cName: string; // 中文资源名
  eName: string; // 英文资源名
  code: string; // 资源编码
  sort: number; // 排序
  route: string; // 路由
  isShow: INT_BOOLEAN; // 是否显示
}

// form validator rule
export enum RULE_TYPE {
  BASIC_ICON = 'basicIcon',
  SELECT_ICON = 'selectIcon',
  C_NAME = 'cName',
  E_NAME = 'eName',
  CODE = 'code',
  ROUTE = 'route',
  PARENT = 'parent',
  DATA_PERMISSION = 'Permission'
}

// int as boolean
export enum INT_BOOLEAN {
  FALSE = 2,
  TRUE = 1
}

export enum ELEMENTS_TYPE {
  MENU = 1,
  BUTTON = 2
}

export enum BUSINESS_TYPE {
  BUSINESS = 2,
  SYSTEM = 1
}

// select options
const interfaceElementsOptions = [
  { value: ELEMENTS_TYPE.MENU, label: intl.get('adminManagement.newManagement.createOrEditModal.menu') },
  { value: ELEMENTS_TYPE.BUTTON, label: intl.get('adminManagement.newManagement.createOrEditModal.button') }
];

// select options
const businessTypeOptions = [
  { value: BUSINESS_TYPE.BUSINESS, label: intl.get('adminManagement.newManagement.createOrEditModal.domainTypeBus') },
  { value: BUSINESS_TYPE.SYSTEM, label: intl.get('adminManagement.newManagement.createOrEditModal.domainTypeSys') }
];

// modal
const MenuOrButtonCreateOrEditModal = (props: MenuOrButtonCreateOrEditModalProps) => {
  const reqPage = 1;
  const reqSize = -1;
  const reqIsTree = 1;

  // props
  const { menuOrButtonInitData, resModalVisible, closeResModal, comparedData, optionalRootId } = props;
  // antd form ref
  const [formRef] = Form.useForm();
  // 当前的语言
  const language = HOOKS.useLanguage();
  // 界面元素
  const [interfaceElements, setInterfaceElements] = useState<ELEMENTS_TYPE | undefined>(
    menuOrButtonInitData?.interfaceElements
  );
  // 类型
  const [businessType, setBusinessType] = useState<BUSINESS_TYPE | undefined>(menuOrButtonInitData?.businessType);
  // 上级菜单
  const [parentMenu, setParentMenu] = useState<string | undefined>(menuOrButtonInitData?.parentMenu);
  // 基础图标
  const [basicIcon, setBasicIcon] = useState<string | undefined>(menuOrButtonInitData?.basicIcon);
  // 激活图标
  const [selectIcon, setSelectIcon] = useState<string | undefined>(menuOrButtonInitData?.selectIcon);
  // 中文名称
  const [cName, setCName] = useState<string | undefined>(menuOrButtonInitData?.cName);
  // 英文名称
  const [eName, setEName] = useState<string | undefined>(menuOrButtonInitData?.eName);
  // 资源编码
  const [code, setCode] = useState<string | undefined>(menuOrButtonInitData?.code);
  // 排序
  const [sort, setSort] = useState<number | undefined>(menuOrButtonInitData?.sort);
  // 路由
  const [route, setRoute] = useState<string | undefined>(menuOrButtonInitData?.route);
  // 是否显示
  const [isShow, setIsShow] = useState<INT_BOOLEAN | undefined>(menuOrButtonInitData?.isShow);
  // 属性选择数据源
  const [treeSelectData, setTreeSelectData] = useState<Record<string, any>[]>([]);
  // 设置字段是否验证
  const [isFieldValidating, setIsFieldValidating] = useState<boolean>(
    menuOrButtonInitData?.interfaceElements === ELEMENTS_TYPE.MENU
  );

  const fetchResourceTreeData = async () => {};

  const handlingRecursiveData = (processedTreeData: any[], fetchedTreeData: any) => {
    if (!fetchedTreeData.children.length) {
      processedTreeData.push({
        value: fetchedTreeData.id,
        title: language === 'en-US' ? fetchedTreeData.desc : fetchedTreeData.name
      });
      return;
    }
    const children: any[] = [];
    fetchedTreeData.children.forEach((item: any) => {
      handlingRecursiveData(children, item);
    });
    processedTreeData.push({
      value: fetchedTreeData.id,
      title: language === 'en-US' ? fetchedTreeData.desc : fetchedTreeData.name,
      children
    });
  };

  useEffect(() => {
    fetchResourceTreeData();
  }, [businessType]);

  // ok button clicked event
  const createOrEditResource = () => {
    formRef
      .validateFields()
      .then(async value => {
        const result = await sendResThenGetResp();
        if (result.res) {
          closeResModal(true);
          // 如果新增或编辑系统类菜单，自动刷新界面
          if (interfaceElements === ELEMENTS_TYPE.MENU && businessType === BUSINESS_TYPE.SYSTEM) {
            window.location.reload();
          }
        }
      })
      .catch(error => {});
  };

  // 界面元素变更
  const onInterfaceElementsChanged = (e: any) => {
    // 变更界面元素时，校验上级菜单
    formRef.validateFields(['create-edit-res-modal-content-parentMenu']);
    // 变更界面元素时，变更校验项
    setIsFieldValidating(e === ELEMENTS_TYPE.MENU);
    // 变更界面元素
    setInterfaceElements(e);
  };

  // 类型变更
  const onBusinessTypeChanged = (e: any) => {
    // 变更类型时，校验上级菜单
    formRef.validateFields(['create-edit-res-modal-content-parentMenu']);
    // 变更类型
    setBusinessType(e);
    // 切换系统类/业务类时，上级菜单选项切换至根菜单
    formRef.setFieldsValue({ 'create-edit-res-modal-content-parentMenu': 0 });
    // 切换系统类/业务类时，上级菜单值切换至根菜单
    setParentMenu('0');
  };

  // 上级菜单变更
  const onTreeSelectChanged = (e: any) => {
    setParentMenu(e);
  };
  // 基础图标变更
  const onBasicIconChanged = (e: any) => {
    setBasicIcon(e.target.value);
  };

  // 激活图标变更
  const onSelectIconChanged = (e: any) => {
    setSelectIcon(e.target.value);
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
    setSort(e);
  };

  // 路由变更
  const onRouteChanged = (e: any) => {
    setRoute(e.target.value);
  };

  // 是否显示变更
  const radioIsShowChanged = (e: any) => {
    setIsShow(e.target.value);
  };

  // generate forms rule
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
      case RULE_TYPE.BASIC_ICON:
      case RULE_TYPE.SELECT_ICON:
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
      case RULE_TYPE.ROUTE:
        max_len_or_number = 100;
        reg_pattern = routeRegex;
        error_msg = intl.get('adminManagement.newManagement.errorMsg.wrongRouteError');
        validator_error_msg = intl.get('adminManagement.newManagement.errorMsg.existedError', {
          content: intl.get('adminManagement.newManagement.errorMsg.content')
        });
        break;
      case RULE_TYPE.PARENT:
        if (menuOrButtonInitData?.id === parentMenu) {
          validator_error_msg = intl.get('adminManagement.newManagement.errorMsg.parentSameSelfError');
        } else {
          validator_error_msg = intl.get('adminManagement.newManagement.errorMsg.parentError');
        }
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
          case RULE_TYPE.PARENT: {
            // 界面类型为菜单时，上级菜单不能选择根菜单
            // 编辑时，上级菜单不能选择自己本身
            if (
              (interfaceElements === ELEMENTS_TYPE.MENU &&
                businessType === BUSINESS_TYPE.BUSINESS &&
                [treeSelectData[0].value].includes(parentMenu)) ||
              menuOrButtonInitData?.id === parentMenu
            ) {
              throw new Error(validator_error_msg);
            }
            // const resultArr = comparedData.filter(item => item.code === value);
            // if (resultArr.length) {
            //   throw new Error(validator_error_msg);
            // }
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
      case RULE_TYPE.ROUTE:
        return [notEmpty(isFieldValidating), maxRule, pattern];
      case RULE_TYPE.BASIC_ICON:
      case RULE_TYPE.SELECT_ICON:
        return [notEmpty(setIconIsShow() !== 'none' && isFieldValidating), maxRule, pattern];
      case RULE_TYPE.PARENT:
        return [notEmpty(), validatorErrorFieldValue];
      default:
        break;
    }
  };

  const setIconIsShow = () => {
    // icon的隐藏规则：
    // 界面元素为button
    // 业务类：根菜单或一级菜单
    // 系统类：根菜单
    let elementDisplay = 'flex';
    if (treeSelectData.length) {
      let rootIdArr: any[] = [];
      if (businessType === BUSINESS_TYPE.SYSTEM) {
        rootIdArr = [treeSelectData[0].value];
      } else if (businessType === BUSINESS_TYPE.BUSINESS) {
        rootIdArr = treeSelectData[0].children.map((item: any) => item.value).concat([treeSelectData[0].value]);
      }
      if (interfaceElements === ELEMENTS_TYPE.BUTTON) {
        elementDisplay = 'none';
      } else if (rootIdArr.includes(parentMenu)) {
        elementDisplay = 'none';
      }
    }
    return elementDisplay;
  };

  // send request and get response
  const sendResThenGetResp = async () => {
    let resData;
    if (menuOrButtonInitData?.id) {
      const requestData: updateSourceDataType = {
        permissionId: menuOrButtonInitData?.id,
        resourceType: interfaceElements!,
        domainType: businessType,
        parentId: parentMenu,
        icon: basicIcon,
        selectedIcon: selectIcon,
        cName: cName!,
        eName: eName!,
        sortOrder: sort,
        content: route,
        status: isShow
      };
      resData = await servicesPermission.updateSource(requestData);
    } else {
      const requestData: addSourceDataType = {
        resourceType: interfaceElements!,
        domainType: businessType,
        parentId: parentMenu,
        icon: basicIcon,
        selectedIcon: selectIcon,
        cName: cName!,
        eName: eName!,
        code: code!,
        sortOrder: sort,
        content: route,
        status: isShow
      };
      resData = await servicesPermission.addSource(requestData);
    }
    return resData;
  };

  return (
    <TemplateModal
      className="create-edit-res-modal"
      width={640}
      title={
        menuOrButtonInitData?.id
          ? intl.get('adminManagement.newManagement.createOrEditModal.titleEdit')
          : intl.get('adminManagement.newManagement.createOrEditModal.titleCreate')
      }
      visible={resModalVisible}
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
            initialValue={interfaceElements}
          >
            <Select
              onChange={onInterfaceElementsChanged}
              options={interfaceElementsOptions}
              disabled={menuOrButtonInitData?.id !== undefined} // 设计和测试让添加的编辑时不能更改
            ></Select>
          </Form.Item>

          <Form.Item
            name="create-edit-res-modal-content-type"
            label={intl.get('adminManagement.newManagement.createOrEditModal.type')}
            rules={[{ required: true }]}
            initialValue={businessType}
          >
            <Select
              onChange={onBusinessTypeChanged}
              options={businessTypeOptions}
              disabled={menuOrButtonInitData?.id !== undefined} // 设计和测试让添加的编辑时不能更改
            ></Select>
          </Form.Item>

          <Form.Item
            name="create-edit-res-modal-content-parentMenu"
            label={intl.get('adminManagement.newManagement.createOrEditModal.parentMenu')}
            rules={generateRules(RULE_TYPE.PARENT)}
            initialValue={parentMenu}
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
              rules={generateRules(RULE_TYPE.BASIC_ICON)}
              validateFirst={true}
              initialValue={basicIcon}
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
              rules={generateRules(RULE_TYPE.SELECT_ICON)}
              initialValue={selectIcon}
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
                disabled={!!menuOrButtonInitData?.id}
                onChange={onCodeChanged}
                autoComplete="off"
              ></Input>
            </Form.Item>

            <Form.Item
              name="create-edit-res-modal-content-sort"
              style={{
                display: interfaceElements === ELEMENTS_TYPE.MENU ? undefined : 'none',
                flex: 1,
                paddingLeft: 20
              }}
              label={intl.get('adminManagement.newManagement.createOrEditModal.sort')}
              rules={[{ required: true, message: intl.get('adminManagement.newManagement.errorMsg.emptyError') }]}
              initialValue={sort}
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
            style={{ display: interfaceElements === ELEMENTS_TYPE.MENU ? undefined : 'none' }}
            label={intl.get('adminManagement.newManagement.createOrEditModal.route')}
            rules={generateRules(RULE_TYPE.ROUTE)}
            initialValue={route}
          >
            <Input
              placeholder={intl.get('adminManagement.newManagement.createOrEditModal.routePlaceHold')}
              onChange={onRouteChanged}
              autoComplete="off"
            ></Input>
          </Form.Item>

          <Form.Item
            name="create-edit-res-modal-content-visible"
            label={intl.get('adminManagement.newManagement.createOrEditModal.visible')}
            rules={[{ required: true }]}
            initialValue={isShow}
          >
            <Radio.Group onChange={radioIsShowChanged} value={isShow}>
              <Radio value={INT_BOOLEAN.TRUE}>{intl.get('adminManagement.newManagement.createOrEditModal.yes')}</Radio>
              <Radio value={INT_BOOLEAN.FALSE}>{intl.get('adminManagement.newManagement.createOrEditModal.no')}</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </div>
    </TemplateModal>
  );
};

export default MenuOrButtonCreateOrEditModal;
