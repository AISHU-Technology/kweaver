export const getListData = {
  count: 2,
  df: [
    {
      createUser: 'test',
      create_time: '2023-12-19 14:21:41',
      export: true,
      graph_db_name: 'udfc0077a9e3611eea3e5966bfe9ec6d2',
      id: 2,
      is_import: true,
      kgDesc: '',
      knowledge_type: 'kg',
      knw_id: 1,
      name: '国泰君安',
      otl_id: '2',
      rabbitmqDs: 0,
      status: 'normal',
      step_num: 4,
      taskstatus: 'normal',
      updateTime: '2023-12-19 16:50:40',
      updateUser: 'test'
    },
    {
      createUser: 'test',
      create_time: '2023-12-18 10:28:01',
      export: true,
      graph_db_name: 'u10abdeda9d4d11eea9cc966bfe9ec6d2',
      id: 1,
      is_import: true,
      kgDesc: '',
      knowledge_type: 'kg',
      knw_id: 1,
      name: '化工与工艺反应知识图谱_new',
      otl_id: '1',
      rabbitmqDs: 0,
      status: 'normal',
      step_num: 6,
      taskstatus: 'normal',
      updateTime: '2023-12-18 10:31:25',
      updateUser: 'test'
    }
  ]
};

export const getInfoData = {
  dbname: 'udfc0077a9e3611eea3e5966bfe9ec6d2',
  edge: [
    {
      alias: '违反的政策是',
      color: 'rgba(217,112,76,1)',
      edge_id: 7,
      name: 'enterprise_2_policy',
      properties: [],
      relation: ['enterprise', 'enterprise_2_policy', 'policy'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '违反的政策是',
      color: 'rgba(227,150,64,1)',
      edge_id: 8,
      name: 'Illegal_event_2_policy',
      properties: [],
      relation: ['Illegal_event', 'Illegal_event_2_policy', 'policy'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '包含',
      color: 'rgba(240,227,79,1)',
      edge_id: 9,
      name: 'policy_2_term',
      properties: [],
      relation: ['policy', 'policy_2_term', 'term'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '违反的条例是',
      color: 'rgba(227,150,64,1)',
      edge_id: 10,
      name: 'Illegal_event_2_term',
      properties: [],
      relation: ['Illegal_event', 'Illegal_event_2_term', 'term'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '违反的条例',
      color: 'rgba(217,112,76,1)',
      edge_id: 11,
      name: 'enterprise_2_term',
      properties: [],
      relation: ['enterprise', 'enterprise_2_term', 'term'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '依据的条例是',
      color: 'rgba(227,150,64,1)',
      edge_id: 12,
      name: 'Illegal_event_2_term1',
      properties: [],
      relation: ['Illegal_event', 'Illegal_event_2_term1', 'term'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '股东',
      color: 'rgba(217,112,76,1)',
      edge_id: 13,
      name: 'enterprise_2_person4',
      properties: [],
      relation: ['enterprise', 'enterprise_2_person4', 'person'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '董事会秘书',
      color: 'rgba(217,112,76,1)',
      edge_id: 14,
      name: 'enterprise_2_person3',
      properties: [],
      relation: ['enterprise', 'enterprise_2_person3', 'person'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '财务负责人',
      color: 'rgba(217,112,76,1)',
      edge_id: 15,
      name: 'enterprise_2_person2',
      properties: [],
      relation: ['enterprise', 'enterprise_2_person2', 'person'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '董事长',
      color: 'rgba(217,112,76,1)',
      edge_id: 16,
      name: 'enterprise_2_person1',
      properties: [],
      relation: ['enterprise', 'enterprise_2_person1', 'person'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '实际控制人',
      color: 'rgba(217,112,76,1)',
      edge_id: 17,
      name: 'enterprise_2_person',
      properties: [],
      relation: ['enterprise', 'enterprise_2_person', 'person'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '违规人员',
      color: 'rgba(227,150,64,1)',
      edge_id: 18,
      name: 'event_2_person',
      properties: [],
      relation: ['Illegal_event', 'event_2_person', 'person'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '监管机构',
      color: 'rgba(227,150,64,1)',
      edge_id: 19,
      name: 'event_2_regulatory_authorities',
      properties: [],
      relation: ['Illegal_event', 'event_2_regulatory_authorities', 'regulators'],
      shape: 'line',
      width: '0.25x'
    },
    {
      alias: '违规企业',
      color: 'rgba(227,150,64,1)',
      edge_id: 20,
      name: 'event_2_enterprise',
      properties: [],
      relation: ['Illegal_event', 'event_2_enterprise', 'enterprise'],
      shape: 'line',
      width: '0.25x'
    }
  ],
  entity: [
    {
      alias: '政策',
      color: 'rgba(240,227,79,1)',
      default_tag: 'name',
      entity_id: 1,
      fill_color: 'rgba(240,227,79,1)',
      icon: 'graph-document',
      icon_color: '#ffffff',
      name: 'policy',
      properties: [
        { alias: '状态', name: 'status', type: 'string' },
        { alias: '文件gns', name: 'gns', type: 'string' },
        { alias: '政策文件', name: 'file', type: 'string' },
        { alias: '时间', name: 'time', type: 'string' },
        { alias: '政令号', name: 'order_number', type: 'string' },
        { alias: '政策名', name: 'name', type: 'string' },
        { alias: '序号', name: 'id', type: 'string' }
      ],
      shape: 'circle',
      size: '0.5x',
      stroke_color: 'rgba(240,227,79,1)',
      text_color: 'rgba(0,0,0,1)',
      text_position: 'top',
      text_type: 'adaptive',
      text_width: 15,
      x: 942.6300000000001,
      y: 218.25
    },
    {
      alias: '人',
      color: 'rgba(165,173,173,1)',
      default_tag: 'name',
      entity_id: 2,
      fill_color: 'rgba(165,173,173,1)',
      icon: 'graph-bussiness-man',
      icon_color: '#ffffff',
      name: 'person',
      properties: [{ alias: '名字', name: 'name', type: 'string' }],
      shape: 'circle',
      size: '0.5x',
      stroke_color: 'rgba(104,121,142,1)',
      text_color: 'rgba(0,0,0,1)',
      text_position: 'top',
      text_type: 'adaptive',
      text_width: 15,
      x: 762.5,
      y: 658.5
    },
    {
      alias: '监管机构',
      color: 'rgba(47,181,54,1)',
      default_tag: 'name',
      entity_id: 3,
      fill_color: 'rgba(47,181,54,1)',
      icon: 'graph-medical-institutions',
      icon_color: '#ffffff',
      name: 'regulators',
      properties: [
        { alias: '序号', name: 'id', type: 'string' },
        { alias: '机构名称', name: 'name', type: 'string' }
      ],
      shape: 'circle',
      size: '0.5x',
      stroke_color: 'rgba(123,186,160,1)',
      text_color: 'rgba(0,0,0,1)',
      text_position: 'top',
      text_type: 'adaptive',
      text_width: 15,
      x: 277.90999999999997,
      y: 482.08
    },
    {
      alias: '条例',
      color: 'rgba(42,144,143,1)',
      default_tag: 'content',
      entity_id: 4,
      fill_color: 'rgba(42,144,143,1)',
      icon: 'graph-text',
      icon_color: '#ffffff',
      name: 'term',
      properties: [
        { alias: '政策名称', name: 'policy_name', type: 'string' },
        { alias: '条款编号', name: 'number', type: 'string' },
        { alias: '序号', name: 'id', type: 'string' },
        { alias: '条款内容', name: 'content', type: 'string' }
      ],
      shape: 'circle',
      size: '0.5x',
      stroke_color: 'rgba(42,144,143,1)',
      text_color: 'rgba(0,0,0,1)',
      text_position: 'top',
      text_type: 'adaptive',
      text_width: 15,
      x: 702.45,
      y: 210.01000000000005
    },
    {
      alias: '企业',
      color: 'rgba(217,112,76,1)',
      default_tag: 'name',
      entity_id: 5,
      fill_color: 'rgba(217,112,76,1)',
      icon: 'graph-company',
      icon_color: '#ffffff',
      name: 'enterprise',
      properties: [
        { alias: '序号', name: 'id', type: 'string' },
        { alias: '简称', name: 'short_form', type: 'string' },
        { alias: '地址', name: 'address', type: 'string' },
        { alias: '企业名称', name: 'name', type: 'string' }
      ],
      shape: 'circle',
      size: '0.5x',
      stroke_color: 'rgba(217,112,76,1)',
      text_color: 'rgba(0,0,0,1)',
      text_position: 'top',
      text_type: 'adaptive',
      text_width: 15,
      x: 1000.6300000000001,
      y: 444.25
    },
    {
      alias: '违规事件',
      color: 'rgba(227,150,64,1)',
      default_tag: 'name',
      entity_id: 6,
      fill_color: 'rgba(227,150,64,1)',
      icon: 'graph-warning',
      icon_color: '#ffffff',
      name: 'Illegal_event',
      properties: [
        { alias: '文件gns', name: 'gns', type: 'string' },
        { alias: '时间', name: 'time', type: 'string' },
        { alias: '整改内容', name: 'rectification_content', type: 'string' },
        { alias: '违规行为', name: 'irregular_behavior', type: 'string' },
        { alias: '通告文件', name: 'announcement_file', type: 'string' },
        { alias: '序号', name: 'id', type: 'string' },
        { alias: '事件名称', name: 'name', type: 'string' }
      ],
      shape: 'circle',
      size: '0.5x',
      stroke_color: 'rgba(227,150,64,1)',
      text_color: 'rgba(0,0,0,1)',
      text_position: 'top',
      text_type: 'adaptive',
      text_width: 15,
      x: 470.28999999999996,
      y: 519.8399999999999
    }
  ]
};

export const getListThesaurusData = {
  res: {
    columns: ['word', 'homoionym'],
    count: 7,
    create_time: '2023-12-20 13:43:10',
    create_user: 'test',
    description: '',
    error_info:
      'Project-Id-Version: PROJECT VERSION\nReport-Msgid-Bugs-To: EMAIL@ADDRESS\nPOT-Creation-Date: 2023-10-17 13:27+0800\nPO-Revision-Date: 2022-12-28 13:28+0800\nLast-Translator: \nLanguage: zh\nLanguage-Team: zh <LL@li.org>\nPlural-Forms: nplurals=1; plural=0;\nMIME-Version: 1.0\nContent-Type: text/plain; charset=utf-8\nContent-Transfer-Encoding: 8bit\nGenerated-By: Babel 2.11.0\n',
    extract_info: '',
    id: 3,
    knowledge_id: 1,
    lexicon_name: 'test',
    mode: '',
    operate_user: 'test',
    status: 'success',
    update_time: '2023-12-20 13:43:10',
    word_info: [
      { homoionym: '模模糊糊', word: '迷迷糊糊' },
      { homoionym: '聚精会神', word: '全神贯注' },
      { homoionym: '漂亮', word: '美丽' },
      { homoionym: '生气', word: '气愤' },
      { homoionym: '悲伤', word: '伤心' },
      { homoionym: '开心', word: '兴奋' },
      { homoionym: '高兴', word: '开心' }
    ]
  }
};

export const getThesaurusInfoData = {
  count: 2,
  df: [
    { columns: ['words'], error_info: '', id: 2, name: '嘎嘎嘎', status: 'edit' },
    { columns: ['words', 'vid', 'ent_name', 'graph_id'], error_info: '', id: 1, name: '呃呃呃', status: 'edit' }
  ]
};

export const thesaurusTableData = [
  { name: 'test', thesaurus_id: 3, prop: 'word', props: [], separator: '', thesaurusSpan: 2, id: 0, errorTip: '' },
  { name: 'test', thesaurus_id: 3, prop: 'homoionym', props: [], separator: '', thesaurusSpan: 0, id: 1, errorTip: '' }
];
