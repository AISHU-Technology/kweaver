import React, { useEffect, useState } from 'react';

import { message, Select, Checkbox } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';

import NoDataBox from '@/components/NoDataBox';
import UniversalModal from '@/components/UniversalModal';
import HELPER from '@/utils/helper';
import servicesThesaurus from '@/services/thesaurus';
import servicesPermission from '@/services/rbacPermission';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import { getParam } from '@/utils/handleFunction';
import kongImage from '@/assets/images/kong.svg';

import { ERROR_CODE } from '../../enum';

import { onDefaultData, onSelectAndTableFormat, onHandleTableFormat } from './assistFunction';

import './style.less';

const CreateThesaurusModal = (props: any) => {
  const { visible, setVisibleThesaurus, thesaurusTableData, onChangeTableData, setIsChange } = props;
  const [thesaurusList, setThesaurusList] = useState<any>([]); // 词库列表
  const [thesaurusName, setThesaurusName] = useState(''); // 选择的词库名
  const [selectedThesaurus, setSelectedThesaurus] = useState<any>([]); // 选中的词库
  const [selectedThesaurusId, setSelectedThesaurusId] = useState<any>(0); // 选中的词库id
  const [checkedList, setCheckedList] = useState<any>([]);
  const [checkedKeys, setCheckedKeys] = useState<any>([]); // 勾选的词库

  useEffect(() => {
    if (visible) {
      onGetThesaurusList();
    }
  }, [visible]);

  /**
   * 获取词库列表
   */
  const onGetThesaurusList = async () => {
    const { knw_id, thesaurus_id } = getParam(['knw_id', 'thesaurus_id']);
    const data = { knowledge_id: knw_id, page: 1, size: 10000, order: 'desc', word: '', rule: 'create_time' };

    try {
      const response = await servicesThesaurus.thesaurusList(data);
      const { res, ErrorCode } = response || {};

      if (ErrorCode) {
        ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(response?.Description);
        return;
      }
      setThesaurusList(res?.df);
      // if (res?.df?.length) {
      //   const dataIds = _.map(res?.df, (item: any) => String(item.id));
      //   const postData = { dataType: PERMISSION_KEYS.TYPE_LEXICON, dataIds };
      //   servicesPermission.dataPermission(postData).then(result => {
      //     const codesData = _.keyBy(result?.res, 'dataId');
      //     const newTableData = _.map(res?.df, (item: any) => {
      //       const codes = codesData?.[item.id]?.codes;
      //       item.__codes = codes;
      //       item.isDisable = !HELPER.getAuthorByUserInfo({
      //         roleType: PERMISSION_CODES.ADF_KN_LEXICON_EDIT,
      //         userType: PERMISSION_KEYS.LEXICON_EDIT,
      //         userTypeDepend: codes
      //       });
      //       return item;
      //     });
      //     const filterList = _.filter(
      //       newTableData,
      //       (item: any) => item?.status === 'success' && item?.id !== Number(thesaurus_id)
      //     );
      //     setThesaurusList(filterList);
      //   });
      // }
    } catch (err) {
      //
    }
  };

  /**
   * 词库名称
   */
  const OPTION = _.map(thesaurusList, (item: any) => ({ value: item?.name, label: item?.name, key: item?.id }));

  /**
   * 资源
   */
  const onSelectionchange = (value: string, e: any) => {
    setCheckedList([]);
    setCheckedKeys([]);
    const cloneData = _.cloneDeep(thesaurusList);
    const thesaurusName = _.filter(cloneData, (item: any) => item?.id === e?.key);
    setThesaurusName(thesaurusName?.[0]?.name);
    onGetThesaurusInfo(e?.key);
  };

  /**
   * 复选框禁止使用过的实体类的属性
   */
  const onUsedPropDisabled = (data: any, thesaurusId: any) => {
    const result = onCurrentGraphProp(thesaurusId);
    if (_.isEmpty(result)) {
      const handleData = _.map(_.cloneDeep(data?.columns), (item: any) => {
        return { value: item, key: item, defaultChecked: false };
      });
      setSelectedThesaurus(handleData);
    } else {
      const graphChecked: any = [];
      _.map(_.cloneDeep(data?.columns), (item: any) => {
        // 被使用的实体类属性名
        if (result.includes(item)) {
          graphChecked.push({ value: item, key: item, defaultChecked: true });
        } else {
          graphChecked.push({ value: item, key: item, defaultChecked: false });
        }
      });

      const filterName: any = [];
      _.map(_.cloneDeep(graphChecked), (item: any) => {
        if (item?.defaultChecked) {
          filterName.push(item?.key);
        }
      });
      setCheckedKeys(filterName);
      setCheckedList(filterName);
      setSelectedThesaurus(graphChecked);
    }
  };

  /**
   * 当前词库下已被使用的列名
   */
  const onCurrentGraphProp = (thesaurusId: any) => {
    const cloneData = _.cloneDeep(thesaurusTableData);
    const filterData = _.filter(cloneData, (item: any) => item.thesaurus_id === thesaurusId);
    if (_.isEmpty(filterData)) return {};
    const result = filterData?.[0]?.props;
    return result;
  };

  /**
   * 某一词库信息
   */
  const onGetThesaurusInfo = async (id: any) => {
    setSelectedThesaurusId(id);
    try {
      const data = { id, page: 1, size: 10000 };
      const response = await servicesThesaurus.thesaurusInfoBasic(data);
      const { ErrorCode, res } = response || {};
      if (ErrorCode) {
        ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(response?.Description);
        return;
      }
      onUsedPropDisabled(res, id);
    } catch (err) {
      //
    }
  };

  /**
   * 确定
   */
  const onHandleOk = () => {
    const filterName = _.filter(_.cloneDeep(checkedKeys), (item: any) => !checkedList.includes(item));
    if (_.isEmpty(filterName)) {
      message.error(intl.get('ThesaurusManage.checked'));
      return;
    }
    const data = onHandleFormat();
    const setIdToTableData = _.map(data, (item: any, index: any) => {
      item.id = index;
      return item;
    });
    // 图谱名 实体类名还要做去除;
    setIsChange(true);
    onChangeTableData({ page: 1 }, setIdToTableData);
    onCancel();
  };

  /**
   * 处理选中数据的格式(整理成table使用的数据格式)
   */
  const onHandleFormat = () => {
    // const reduceData = onDefaultData(checkedList, thesaurusName, selectedThesaurusId);
    const filterName = _.filter(_.cloneDeep(checkedKeys), (item: any) => !checkedList.includes(item));
    const reduceData = onDefaultData(checkedKeys, thesaurusName, selectedThesaurusId, filterName);
    const { reduceValues, values } = onSelectAndTableFormat(
      _.cloneDeep(reduceData),
      checkedKeys,
      // checkedList,
      thesaurusTableData,
      selectedThesaurusId,
      thesaurusName
    );
    const result = onHandleTableFormat(reduceValues, values);
    return result;
  };

  /**
   * 取消
   */
  const onCancel = () => {
    setVisibleThesaurus(false);
    setThesaurusList([]);
    setSelectedThesaurus([]);
    setCheckedKeys([]);
    setCheckedList([]);
  };

  const onChange = (e: any) => {
    const value = e?.target?.value;
    const checked = e?.target?.checked;
    const allData: any = checked
      ? [...new Set([...checkedKeys, value])]
      : _.filter(_.cloneDeep(checkedKeys), (item: any) => item !== value);
    setCheckedKeys([...new Set(allData)]);
  };

  return (
    <UniversalModal
      className="thesaurus-mode-create-UniversalModal-root"
      title={intl.get('ThesaurusManage.add')}
      width={'640px'}
      visible={visible}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: onHandleOk }
      ]}
    >
      <div className="kw-mb-6">
        <div className="kw-mb-2 kw-c-header title">{intl.get('cognitiveSearch.resource.resourceName')}</div>
        <Select
          className="select"
          listHeight={32 * 5}
          showSearch
          placeholder={intl.get('exploreAnalysis.inputOrSelect')}
          options={OPTION}
          onChange={onSelectionchange}
        />
      </div>

      <div className="kw-mb-2 kw-c-header title">{intl.get('ThesaurusManage.createMode.configurationColumn')}</div>
      <div className="disposition-box kw-p-4">
        {!thesaurusName ? (
          <NoDataBox
            style={{ marginTop: 35 }}
            imgSrc={require('@/assets/images/clickView.svg').default}
            desc={intl.get('ThesaurusManage.createMode.select')}
          />
        ) : (
          <>
            {_.isEmpty(selectedThesaurus) ? (
              <div className="kw-flex no-data-box">
                <div className="kw-center">
                  <img src={kongImage} alt="nodata" />
                </div>
                <div className="kw-center">{intl.get('adminManagement.noData')}</div>
              </div>
            ) : (
              _.map(selectedThesaurus, (item: any, index: any) => {
                return (
                  <div key={index} className="kw-mb-2">
                    <Checkbox
                      onChange={onChange}
                      value={item?.value}
                      defaultChecked={item?.defaultChecked && checkedKeys.includes(item.key)}
                      disabled={item?.defaultChecked && checkedKeys.includes(item.key)}
                      checked={checkedKeys.includes(item.key)}
                    >
                      <div className="kw-ellipsis check-box" title={item?.value}>
                        {item?.value}
                      </div>
                    </Checkbox>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </UniversalModal>
  );
};

export default CreateThesaurusModal;
