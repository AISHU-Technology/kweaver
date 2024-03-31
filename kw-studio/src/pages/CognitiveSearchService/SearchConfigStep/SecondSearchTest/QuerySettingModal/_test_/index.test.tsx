import React from 'react';
import QuerySettingModal from '..';
import { mount } from 'enzyme';
import { act } from '@/tests';

const defaultProps = {
  visible: true,
  testData: {
    props: {
      full_text: {
        upstream_links: [],
        search_config: [
          {
            class_name: '全部资源',
            class_id: 1,
            kgs: [
              {
                kg_id: '2',
                entities: [
                  '政策 (policy)',
                  '人 (person)',
                  '监管机构 (regulators)',
                  '条例 (term)',
                  '企业 (enterprise)',
                  '违规事件 (Illegal_event)'
                ],
                resource_type: 'kg',
                description: '',
                creator: '1932e4ca-976e-11ee-856b-fa99f060fc32',
                create_time: '1702879162140',
                editor: '1932e4ca-976e-11ee-856b-fa99f060fc32',
                edit_time: '1702879162140',
                category: [],
                kg_name: '国泰君安',
                creater_name: '魏旺',
                editor_name: '魏旺'
              }
            ]
          }
        ],
        switch: true
      },
      kgqa: {
        limit: 5,
        threshold: 0.6,
        confs: [
          {
            kg_id: '2',
            selected: true,
            entity_name_props: [
              { entity: 'policy', selected: true, std: 'name', synonyms: [] },
              { entity: 'person', selected: true, std: 'name', synonyms: [] },
              { entity: 'regulators', selected: true, std: 'name', synonyms: [] },
              { entity: 'term', selected: true, std: 'content', synonyms: [] },
              { entity: 'enterprise', selected: true, std: 'name', synonyms: [] },
              { entity: 'Illegal_event', selected: true, std: 'name', synonyms: [] }
            ]
          }
        ],
        ans_organize: {
          type: 'default',
          prompt: '',
          model: '',
          api_key: '',
          api_type: '',
          api_version: '',
          api_endpoint: ''
        },
        switch: true,
        exploration_switch: true,
        adv_config: {
          intent_config: {
            model_type: 'openai',
            intent_list: [
              {
                intent: '查询企业的竞争对手',
                description: '查询和该企业有相同产品、相同领域的企业',
                slots: [{ name: '企业', description: '企业名称' }]
              },
              {
                intent: '某区域生产某产品的企业',
                description: '查询某个区域生产某个产品的所有企业',
                slots: [
                  { name: '区域', description: '区域，省市县' },
                  { name: '产品', description: '产品名称，如电池、新能源' }
                ]
              }
            ],
            intent_prompt:
              " Determine the user's most likely search intent based on the user's query.\nUser issue: {{query}}.\n Search intent: {{intent_map}}. \n The most likely intent name for the question is given and returned with a list, When the intention is unclear, return ['Unclear ']. which is returned in a strict range according to what is included in the search intent.",
            entity_prompt:
              'Please identify the entity specified by the user based on their description. \n If you want to extract an entity of the specified type, return it in JSON format, with key as the entity type and value as the entity description.。\n User issue: {{query}}。\nEntity Type: {{entity_info}}。',
            intent_pool_id: null
          },
          ga_config: {
            intent_binding: [
              {
                intent_name: '查询企业的竞争对手',
                binding_info: [{ param: 'name', slot: '企业', alias: '企业名称', type: 'string', example: 'name' }],
                graph_info: {
                  name: '企业违反的政策',
                  statements:
                    'match p=(v4:Illegal_event)-->(v:enterprise) --> (v2:term) <-- (v3:policy) where v.enterprise.name == "name" or v.enterprise.short_form =="name" return p',
                  params: [
                    {
                      name: 'name',
                      alias: '企业名称',
                      param_type: 'string',
                      options: null,
                      position: [
                        { pos: [0, 102, 106], example: 'name' },
                        { pos: [0, 138, 142], example: 'name' }
                      ],
                      desccription: null,
                      entity_classes: null
                    }
                  ]
                },
                kg_id: '2',
                canvas_body:
                  '{"graphStyle":{"node":{"policy":{"_class":"policy","alias":"政策","icon":"graph-document","iconColor":"rgba(255,255,255,1)","fillColor":"rgba(240,227,79,1)","strokeColor":"rgba(240,227,79,1)","type":"customCircle","scope":"all","size":36,"position":"top","labelLength":15,"labelFixLength":160,"labelType":"adapt","labelFill":"#000000","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#entity_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"name","alias":"政策名","value":"","type":"string","isChecked":true,"isDisabled":false},{"key":"status","alias":"状态","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"gns","alias":"文件gns","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"file","alias":"政策文件","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"time","alias":"时间","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"order_number","alias":"政令号","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"id","alias":"序号","value":"","type":"string","isChecked":false,"isDisabled":false}]},"person":{"_class":"person","alias":"人","icon":"graph-bussiness-man","iconColor":"rgba(255,255,255,1)","fillColor":"rgba(165,173,173,1)","strokeColor":"rgba(165,173,173,1)","type":"customCircle","scope":"all","size":36,"position":"top","labelLength":15,"labelFixLength":160,"labelType":"adapt","labelFill":"#000000","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#entity_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"name","alias":"名字","value":"","type":"string","isChecked":true,"isDisabled":false}]},"regulators":{"_class":"regulators","alias":"监管机构","icon":"graph-medical-institutions","iconColor":"rgba(255,255,255,1)","fillColor":"rgba(47,181,54,1)","strokeColor":"rgba(47,181,54,1)","type":"customCircle","scope":"all","size":36,"position":"top","labelLength":15,"labelFixLength":160,"labelType":"adapt","labelFill":"#000000","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#entity_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"name","alias":"机构名称","value":"","type":"string","isChecked":true,"isDisabled":false},{"key":"id","alias":"序号","value":"","type":"string","isChecked":false,"isDisabled":false}]},"term":{"_class":"term","alias":"条例","icon":"graph-text","iconColor":"rgba(255,255,255,1)","fillColor":"rgba(42,144,143,1)","strokeColor":"rgba(42,144,143,1)","type":"customCircle","scope":"all","size":36,"position":"top","labelLength":15,"labelFixLength":160,"labelType":"adapt","labelFill":"#000000","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#entity_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"content","alias":"条款内容","value":"","type":"string","isChecked":true,"isDisabled":false},{"key":"policy_name","alias":"政策名称","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"number","alias":"条款编号","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"id","alias":"序号","value":"","type":"string","isChecked":false,"isDisabled":false}]},"enterprise":{"_class":"enterprise","alias":"企业","icon":"graph-company","iconColor":"rgba(255,255,255,1)","fillColor":"rgba(217,112,76,1)","strokeColor":"rgba(217,112,76,1)","type":"customCircle","scope":"all","size":36,"position":"top","labelLength":15,"labelFixLength":160,"labelType":"adapt","labelFill":"#000000","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#entity_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"name","alias":"企业名称","value":"","type":"string","isChecked":true,"isDisabled":false},{"key":"id","alias":"序号","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"short_form","alias":"简称","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"address","alias":"地址","value":"","type":"string","isChecked":false,"isDisabled":false}]},"Illegal_event":{"_class":"Illegal_event","alias":"违规事件","icon":"graph-warning","iconColor":"rgba(255,255,255,1)","fillColor":"rgba(227,150,64,1)","strokeColor":"rgba(227,150,64,1)","type":"customCircle","scope":"all","size":36,"position":"top","labelLength":15,"labelFixLength":160,"labelType":"adapt","labelFill":"#000000","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#entity_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"name","alias":"事件名称","value":"","type":"string","isChecked":true,"isDisabled":false},{"key":"gns","alias":"文件gns","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"time","alias":"时间","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"rectification_content","alias":"整改内容","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"irregular_behavior","alias":"违规行为","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"announcement_file","alias":"通告文件","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"id","alias":"序号","value":"","type":"string","isChecked":false,"isDisabled":false}]}},"edge":{"enterprise_2_policy":{"_class":"enterprise_2_policy","alias":"违反的政策是","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(217,112,76,1)","strokeColor":"rgba(217,112,76,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"Illegal_event_2_policy":{"_class":"Illegal_event_2_policy","alias":"违反的政策是","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(227,150,64,1)","strokeColor":"rgba(227,150,64,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"policy_2_term":{"_class":"policy_2_term","alias":"包含","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(240,227,79,1)","strokeColor":"rgba(240,227,79,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"Illegal_event_2_term":{"_class":"Illegal_event_2_term","alias":"违反的条例是","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(227,150,64,1)","strokeColor":"rgba(227,150,64,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"enterprise_2_term":{"_class":"enterprise_2_term","alias":"违反的条例","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(217,112,76,1)","strokeColor":"rgba(217,112,76,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"Illegal_event_2_term1":{"_class":"Illegal_event_2_term1","alias":"依据的条例是","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(227,150,64,1)","strokeColor":"rgba(227,150,64,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"enterprise_2_person4":{"_class":"enterprise_2_person4","alias":"股东","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(217,112,76,1)","strokeColor":"rgba(217,112,76,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"enterprise_2_person3":{"_class":"enterprise_2_person3","alias":"董事会秘书","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(217,112,76,1)","strokeColor":"rgba(217,112,76,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"enterprise_2_person2":{"_class":"enterprise_2_person2","alias":"财务负责人","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(217,112,76,1)","strokeColor":"rgba(217,112,76,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"enterprise_2_person1":{"_class":"enterprise_2_person1","alias":"董事长","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(217,112,76,1)","strokeColor":"rgba(217,112,76,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"enterprise_2_person":{"_class":"enterprise_2_person","alias":"实际控制人","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(217,112,76,1)","strokeColor":"rgba(217,112,76,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"event_2_person":{"_class":"event_2_person","alias":"违规人员","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(227,150,64,1)","strokeColor":"rgba(227,150,64,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"event_2_regulatory_authorities":{"_class":"event_2_regulatory_authorities","alias":"监管机构","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(227,150,64,1)","strokeColor":"rgba(227,150,64,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]},"event_2_enterprise":{"_class":"event_2_enterprise","alias":"违规企业","type":"line","scope":"all","size":0.75,"position":"top","labelLength":15,"labelFill":"rgba(227,150,64,1)","strokeColor":"rgba(227,150,64,1)","showLabels":[{"key":"#id","alias":"Id","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#edge_class","alias":"类名","value":"","type":"string","isChecked":false,"isDisabled":false},{"key":"#alias","alias":"类的显示名","value":"","type":"string","isChecked":true,"isDisabled":false}]}},"more":{"__more":{"class":"__more","alias":"More","fillColor":"rgba(0,0,0,.25)","strokeColor":"rgba(0,0,0,.25)","icon":"","scope":"all","type":"customCircle","size":36,"position":"top","labelLength":15,"labelFill":"#000000","showLabels":[{"key":"more","alias":"more","value":"More","isChecked":true}]}}},"layoutConfig":{"key":"dagre","default":{"direction":"LR","align":"MM","nodesep":20,"ranksep":50},"dagre":{"direction":"LR","align":"MM","nodesep":20,"ranksep":50}},"graphConfig":{"hasLegend":true,"color":"white","image":"empty"},"nodes":[],"edges":[]}',
                complete_config: true
              },
              {
                intent_name: '某区域生产某产品的企业',
                binding_info: [],
                graph_info: null,
                kg_id: '',
                canvas_body: '',
                complete_config: false
              }
            ]
          },
          ans_config: {
            type: 'openai',
            prompt:
              'Answer based on subgraph data.\nSubgraph data: {{subgraph}}, where entity_list represents entity information and edge_list represents the relationship between entities.\nUser question: {{query}};\nIf the answer can be found in the subgraph, please return the answer without redundant content.\nIf the answer cannot be found in the subgraph, return No Answer Found in the subgraph, and explain the information available in the subgraph in one sentence, allowing the questioner to view the relevant information in the subgraph.No need to go back to the reasoning process.'
          }
        }
      },
      data_source_scope: [
        {
          kg_id: '2',
          sub_type: null,
          resource_type: 'kg',
          model_conf: null,
          description: '',
          creator: '1932e4ca-976e-11ee-856b-fa99f060fc32',
          create_time: '1702879162140',
          editor: '1932e4ca-976e-11ee-856b-fa99f060fc32',
          edit_time: '1702879162140',
          category: [],
          creater_name: '魏旺',
          editor_name: '魏旺',
          kg_name: '国泰君安'
        },
        {
          kg_id: null,
          sub_type: 'openai',
          resource_type: 'model',
          model_conf: {
            model: 'gpt-35-turbo-16k',
            api_type: 'azure',
            api_key: '16ff5cd7654c4ae9a9dd36059198a15d',
            api_version: '2023-03-15-preview',
            api_endpoint: 'https://kweaver-dev.openai.azure.com/'
          },
          description: '',
          creator: '1932e4ca-976e-11ee-856b-fa99f060fc32',
          create_time: '1702879154239',
          editor: '1932e4ca-976e-11ee-856b-fa99f060fc32',
          edit_time: '1702879154239',
          category: [],
          creater_name: '魏旺',
          editor_name: '魏旺'
        },
        {
          kg_id: null,
          sub_type: 'embbeding_model',
          resource_type: 'model',
          model_conf: { device: 'cpu' },
          description: '',
          creator: '1932e4ca-976e-11ee-856b-fa99f060fc32',
          create_time: '1702879173498',
          editor: '1932e4ca-976e-11ee-856b-fa99f060fc32',
          edit_time: '1702879173498',
          category: [],
          creater_name: '魏旺',
          editor_name: '魏旺'
        }
      ]
    }
  },
  checked: { checked: false, sortChecked: false, queryChecked: false },
  setTestData: jest.fn(),
  onHandleCancel: jest.fn(),
  setOperateFail: jest.fn(),
  onSaveDefault: jest.fn(),
  setOperateSave: jest.fn(),
  intentionRef: {},
  operateFail: false
};
const init = (props = defaultProps) => mount(<QuerySettingModal {...props} />);

describe('test UI', () => {
  it('test exist', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
