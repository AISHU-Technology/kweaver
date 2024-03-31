import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Modal, Form, Select, Input, ConfigProvider, Button, message, Divider } from 'antd';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import AdSpin from '@/components/AdSpin';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';
import cognitiveSearchService from '@/services/cognitiveSearch';
import servicesPermission from '@/services/rbacPermission';
import servicesSearchConfig from '@/services/searchConfig';
import { PERMISSION_KEYS } from '@/enums';
import { onAddGraph } from '../../assistFunction';
import { convertData } from '../../../SecondSearchTest/SearchRange/assistFunction';
import './style.less';

import UniversalModal from '@/components/UniversalModal';

const { TextArea } = Input;
const { Option } = Select;
const DES_REG = /^[\s\n\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；：“”‘'（）《》【】～￥—]+$/;
export const CreateSourceContent = forwardRef((props: any, ref) => {
  const { onHandleCancel, setTestData, onChangeTable, basicData, testData, setIsAddModal } = props;
  const [form] = Form.useForm();
  const currentValue = useRef<any>();
  const language = HOOKS.useLanguage();
  const [graphList, setGraphList] = useState<any>([]); // 图谱选择(跟随选择框变化)
  const [graphListAll, setGraphListAll] = useState<any>([]); // 图谱选择(不发生变化)
  const graphListAllRef = useRef<any>(); // 图谱选择(不发生变化)
  const [sourceName, setSourceName] = useState(''); // 下拉框选择的资源名
  const [graphNumber, setGraphNumber] = useState([0]);
  const [loading, setLoading] = useState(false);
  const [selectGraphShow, setSelectGraphShow] = useState<any>([{ key: 0 }]); // 存储每一个下拉框里的图谱和描述

  useEffect(() => {
    if (!basicData?.knw_id) return;
    setLoading(true);
    getGraphList(basicData?.knw_id);
  }, []);
  // }, [testData?.props?.data_source_scope]);

  useImperativeHandle(ref, () => ({
    handleOk
  }));

  /**
   * 查询图谱
   * @param id 知识网络id
   */
  const getGraphList = async (id: number) => {
    try {
      const { res } = (await cognitiveSearchService.getKgList(id)) || {};

      const dataIds = _.map(res?.df, item => String(item.id));
      const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds };
      // servicesPermission.dataPermission(postData).then(result => {
      //   const codesData = _.keyBy(result?.res, 'dataId');

      //   const newGraphData = _.filter(res?.df, item => {
      //     const hasAuth = _.includes(codesData?.[item.id]?.codes, 'KG_VIEW');
      //     return hasAuth;
      //   });
      //   setGraphList(newGraphData);
      //   graphListAllRef.current = newGraphData;
      //   // setGraphListAll(newGraphData);
      //   // setLoading(false);
      // });
      setGraphList(res?.df);
      graphListAllRef.current = res?.df;
    } catch (error) {
      setLoading(false);
      error?.ErrorDetails && message.error(error?.ErrorDetails[0].detail);
    }
  };

  /**
   * 确定 分开添加后图谱的数量没有减少
   * P_BUTTON 流程一添加图谱
   */
  const handleOk = () => {
    const isSelectGraph: any = [];
    _.map(selectGraphShow, (item: any) => {
      if (item?.[`graph_${item.key}`]) {
        isSelectGraph.push(item[`graph_${item.key}`]);
      }
    });

    if (isSelectGraph.length === 0) {
      message.warning(intl.get('cognitiveSearch.resource.pleaseAdd'));
    }
    form.validateFields().then(async values => {
      // 没有添加资源
      if (!_.isEmpty(isSelectGraph)) {
        const addTableList = onAddGraph(selectGraphShow, testData);
        onChangeTable({ page: 1 }, addTableList);
        setTestData(addTableList);
        onHandleCancel();
      }
    });
  };

  /**
   * 资源类型选择-暂时固定
   */
  const onSelectChange = (e: any) => {
    if (sourceName !== e) {
      form.setFieldsValue({ graph: '' });
    }
    setSourceName(e);
    getGraphList(basicData?.knw_id);
  };

  /**
   * 切换图谱
   */
  const handleGraphChange = async (e: any, number: any) => {
    // 选择的图谱id
    const filterId = _.filter(_.cloneDeep(graphListAllRef.current), (item: any) => item.name === String(e));
    // const filterId = _.filter(graphListAll, (item: any) => item.name === String(e));
    // 选择的图谱实体类信息
    let entitiesAllSelected: any = {};
    try {
      const { res, Description } = (await servicesSearchConfig.fetchCanvasData(filterId?.[0]?.id)) || {};
      const graphData = convertData(res);
      const entitiesAll = _.map(graphData?.nodes, (i: any) => {
        return `${i.alias} (${i.id})`;
      });
      entitiesAllSelected = { entities: entitiesAll, allEntities: entitiesAll };

      Description && message.error(Description);
    } catch (err) {
      //
    }
    const handleSelect = _.map(selectGraphShow, (item: any) => {
      if (item.key === number) {
        item[`graph_${number}`] = e;
        item.kg_id = filterId?.[0]?.id;
        item.entities = entitiesAllSelected.entities;
        item.allEntities = entitiesAllSelected.allEntities;
      }
      return item;
    });
    setSelectGraphShow(handleSelect);
  };

  /**
   * 描述
   */
  const onGraphDes = (e: any, number: any) => {
    const handleSelect = _.map(selectGraphShow, (item: any) => {
      if (item.key === number) {
        item[`des_${number}`] = e?.target?.value;
      }
      return item;
    });
    setSelectGraphShow(handleSelect);
  };

  /**
   * 搜索
   */
  const onSearch = (e: any) => {};

  /**
   * 添加资源范围
   */
  const onAddSourceRange = () => {
    const nowNumber = graphNumber[graphNumber.length - 1] + 1;
    setGraphNumber([...graphNumber, nowNumber]);
    // 每新建一个 就新增一个存储的对象
    const newSelectGraphShow = [...selectGraphShow, { key: nowNumber }];
    setSelectGraphShow(newSelectGraphShow);
  };

  /**
   * 删除资源范围
   */
  const onDeleteSourceRange = (number: number) => {
    // 图谱 -- 个数
    const filterNumber = _.filter(graphNumber, (item: any) => item !== number);
    setGraphNumber(filterNumber);
    // 去除删除的
    const filterGraphShow = _.filter(selectGraphShow, (item: any) => item.key !== number);
    // 删除的
    const deleteGraph = _.filter(selectGraphShow, (item: any) => item.key === number);
    setSelectGraphShow(filterGraphShow);
    const newGraphList = deleteGraph?.[0]?.kg_id ? [...graphList, ...deleteGraph] : graphList;
    // 重置被删除的资源的值，防止再次添加时，配置未被清空
    form.resetFields([`graph_${number}`, `des_${number}`]);
    setGraphList([...newGraphList]);
  };

  /**
   * 下拉框展示的图谱
   */
  const onGraphShow = (number: any) => {
    // 选出当前被选择的图谱名
    const currentSelect = _.filter(_.cloneDeep(selectGraphShow), (item: any) => item.key === number);
    const currentName = currentSelect[0][`graph_${number}`];
    // 选出表格中已存在的图谱名
    const tableExistsName = _.map(_.cloneDeep(testData?.props?.data_source_scope), (item: any) => item?.kg_name);
    // 剔除已被选择过的图谱名（但不包含当前选择框中的）
    const alreadySelect: any = [];
    _.map(selectGraphShow, (item: any) => {
      const name = item[`graph_${item.key}`];
      if (name !== currentName) {
        alreadySelect.push(item[`graph_${item.key}`]);
      }
    });
    // 去除已被选择过图谱名后的下拉框数据
    const filterGraphAll = _.filter(
      _.cloneDeep(graphListAllRef.current),
      // _.cloneDeep(graphListAll),
      (item: any) => ![...alreadySelect, ...tableExistsName].includes(item.name)
    );
    setGraphList(filterGraphAll);
    setLoading(false);
  };

  return (
    <>
      <div>
        <div className="kw-flex kw-mb-6" style={{ marginLeft: language === 'zh-CN' ? '0px' : '15px' }}>
          <div className="source-type" style={{ marginRight: language === 'zh-CN' ? '20px' : '30px' }}>
            {intl.get('cognitiveSearch.resource.resourceType')}
          </div>
          <Select
            className="graph-select graph-type"
            disabled={true}
            defaultValue={intl.get('cognitiveSearch.resource.know')}
            onChange={value => onSelectChange(value)}
          >
            <Option key={'知识图谱'} value={'知识图谱'}>
              {'知识图谱'}
            </Option>
          </Select>
        </div>

        <div className="kw-flex create-graph-select">
          <div className="form-label">{intl.get('cognitiveSearch.resource.resourceRange')}</div>
          <div className="modal-graph-select">
            <Form layout="inline" form={form} className="kw-pr-6">
              {_.map(graphNumber, (item: any, index: any) => {
                return (
                  <div key={index} className="kw-flex">
                    <Form.Item
                      name={`graph_${item}`}
                      colon={false}
                      rules={[{ required: true, message: intl.get('cognitiveSearch.resource.pleaseAdd') }]}
                    >
                      <Select
                        showSearch
                        onSearch={onSearch}
                        // value={currentValue}
                        className="graph-select"
                        placeholder={intl.get('cognitiveSearch.resource.selectResource')}
                        listHeight={32 * 4}
                        onChange={(e: any) => {
                          if (loading) return;
                          currentValue.current = e;
                          handleGraphChange(e, item);
                        }}
                        onClick={() => {
                          // if (loading) return;
                          setLoading(true);
                          setTimeout(() => {
                            onGraphShow(item);
                          }, 1000);
                        }}
                      >
                        {loading ? (
                          <Option disabled={true} key="loading" style={{ height: '128px', background: '#fff' }}>
                            <div className="loading-mask kw-h-100 kw-center" style={{ flexFlow: 'column' }}>
                              <AdSpin />
                              <div className="kw-mt-3">{intl.get('cognitiveSearch.loading')}</div>
                            </div>
                          </Option>
                        ) : (
                          _.map(graphList, (item: any) => {
                            return (
                              <Option key={item.id} value={item.name}>
                                {item.name}
                              </Option>
                            );
                          })
                        )}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name={`des_${item}`}
                      rules={[
                        {
                          max: 50,
                          message: intl.get('subscription.maxLength')
                        },
                        {
                          pattern: DES_REG,
                          message: intl.get('cognitiveSearch.codeRule')
                        }
                      ]}
                    >
                      <TextArea
                        placeholder={intl.get('cognitiveSearch.resource.resourceDescription')}
                        onChange={(e: any) => onGraphDes(e, item)}
                        className="graph-textarea kw-ellipsis"
                        showCount={false}
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        style={{ height: '33px' }}
                      />
                    </Form.Item>
                    <Button
                      className="delete-icon"
                      disabled={graphNumber.length === 1}
                      onClick={() => onDeleteSourceRange(item)}
                    >
                      <IconFont type="icon-lajitong" className="kw-pointer" />
                    </Button>
                  </div>
                );
              })}
            </Form>

            {/* 添加 */}
            {/* {graphList.length > 1 ? ( */}
            <Button
              disabled={graphList.length === 0}
              type="default"
              className="add-btn kw-c-primary"
              onClick={onAddSourceRange}
            >
              <IconFont type="icon-Add" />
              {intl.get('cognitiveSearch.resource.add')}
            </Button>
            {/* ) : null} */}
          </div>
        </div>
      </div>
    </>
  );
});

const CreateResourceModal = (props: any) => {
  const {
    visible,
    testData,
    onChangeTable,
    setTestData,
    onHandleCancel,
    setIsAddModal,
    editMes,
    basicData,
    operationType
  } = props;
  const CreateSourceContentRef = useRef(null);

  return (
    <>
      <UniversalModal
        className="search-create-edit-modal"
        visible={visible}
        onCancel={() => setIsAddModal(false)}
        title={intl.get('cognitiveSearch.resource.addResource')}
        width={'800px'}
        destroyOnClose={true}
        footerData={
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button
              className="ant-btn-default btn normal"
              onClick={() => {
                setIsAddModal(false);
              }}
            >
              {intl.get('cognitiveSearch.cancel')}
            </Button>

            <Button
              type="primary"
              className="btn primary"
              onClick={() => (CreateSourceContentRef.current as any).handleOk()}
            >
              {intl.get('cognitiveSearch.save')}
            </Button>
          </ConfigProvider>
        }
        maskClosable={false}
      >
        <CreateSourceContent
          ref={CreateSourceContentRef}
          operationType={operationType}
          basicData={basicData}
          setIsAddModal={setIsAddModal}
          testData={testData}
          editMes={editMes}
          setTestData={setTestData}
          onHandleCancel={onHandleCancel}
          onChangeTable={onChangeTable}
        />
      </UniversalModal>
    </>
  );
};

export default CreateResourceModal;
