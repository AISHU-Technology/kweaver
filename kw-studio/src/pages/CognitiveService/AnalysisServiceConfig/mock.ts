// 新建服务
export const analysisServiceCreate = (param: any): Promise<any> => {
  return Promise.resolve({ res: 'create success' });
};

// 编辑服务
export const analysisServiceEdit = (param: any): Promise<any> => {
  return Promise.resolve({ res: 'edit success' });
};

// 获取单个服务详情
export const analysisServiceGet = (id: number): Promise<any> => {
  return Promise.resolve({
    res: {
      service_id: 1,
      create_time: 'string',
      name: '服务名称服务名称服务名称服务名称服务名称',
      knw_id: 1,
      kg_id: 1,
      kg_name: 'aaaaaaaaaaaaaaaaaa',
      operation_type: 'custom-search',
      description: '<p>我随手一打就是十个字</p>',
      access_method: ['restAPI'],
      document: 'string',
      permission: '免登录访问',
      canvas_config: 'string',
      canvas_body:
        '{"layoutConfig":{"default":{}},"nodes":[{"x":276.69742201018084,"y":227.91375617217776,"uid":"vid0","alias":"alias0","color":"#b2502b","showLabels":[{"key":"#id","value":"vid0","isChecked":false,"isDisabled":false},{"key":"#alias","value":"alias0","isChecked":false,"isDisabled":false},{"key":"#class","value":"kom_customer_info","isChecked":false,"isDisabled":false},{"key":"industry_id","value":"180","isChecked":false,"isDisabled":false},{"key":"name","value":"云南中医学院0","isChecked":true,"isDisabled":false},{"key":"subindustry_id","value":"206","isChecked":false,"isDisabled":false}],"class":"kom_customer_info","id":"vid0","icon":"graph-model","default_property":{"n":"name","v":"嗡嗡嗡0"}},{"x":504.88574917990456,"y":227.44452995383986,"uid":"vid1","alias":"alias1","color":"#2dfa38","showLabels":[{"key":"#id","value":"vid1","isChecked":false,"isDisabled":false},{"key":"#alias","value":"alias1","isChecked":false,"isDisabled":false},{"key":"#class","value":"kom_customer_info","isChecked":false,"isDisabled":false},{"key":"industry_id","value":"180","isChecked":false,"isDisabled":false},{"key":"name","value":"云南中医学院1","isChecked":true,"isDisabled":false},{"key":"subindustry_id","value":"206","isChecked":false,"isDisabled":false}],"class":"kom_customer_info","id":"vid1","icon":"graph-model","default_property":{"n":"name","v":"嗡嗡嗡1"}},{"x":730.2482848946285,"y":234.7267800840756,"uid":"vid2","alias":"alias2","color":"#172d1b","showLabels":[{"key":"#id","value":"vid2","isChecked":false,"isDisabled":false},{"key":"#alias","value":"alias2","isChecked":false,"isDisabled":false},{"key":"#class","value":"kom_customer_info","isChecked":false,"isDisabled":false},{"key":"industry_id","value":"180","isChecked":false,"isDisabled":false},{"key":"name","value":"云南中医学院2","isChecked":true,"isDisabled":false},{"key":"subindustry_id","value":"206","isChecked":false,"isDisabled":false}],"class":"kom_customer_info","id":"vid2","icon":"graph-model","default_property":{"n":"name","v":"嗡嗡嗡2"}},{"x":280.5867864592083,"y":567.1965148050109,"uid":"vid3","alias":"alias3","color":"#f7ddad","showLabels":[{"key":"#id","value":"vid3","isChecked":false,"isDisabled":false},{"key":"#alias","value":"alias3","isChecked":false,"isDisabled":false},{"key":"#class","value":"kom_customer_info","isChecked":false,"isDisabled":false},{"key":"industry_id","value":"180","isChecked":false,"isDisabled":false},{"key":"name","value":"云南中医学院3","isChecked":true,"isDisabled":false},{"key":"subindustry_id","value":"206","isChecked":false,"isDisabled":false}],"class":"kom_customer_info","id":"vid3","icon":"graph-model","default_property":{"n":"name","v":"嗡嗡嗡3"}},{"x":521.7848096078365,"y":570.5700328856375,"uid":"vid4","alias":"alias4","color":"#ce7854","showLabels":[{"key":"#id","value":"vid4","isChecked":false,"isDisabled":false},{"key":"#alias","value":"alias4","isChecked":false,"isDisabled":false},{"key":"#class","value":"kom_customer_info","isChecked":false,"isDisabled":false},{"key":"industry_id","value":"180","isChecked":false,"isDisabled":false},{"key":"name","value":"云南中医学院4","isChecked":true,"isDisabled":false},{"key":"subindustry_id","value":"206","isChecked":false,"isDisabled":false}],"class":"kom_customer_info","id":"vid4","icon":"graph-model","default_property":{"n":"name","v":"嗡嗡嗡4"}}],"edges":[]}',
      config_info: {
        statements: ['aaa哇哇哇哇哇哇哇哇'],
        params: [
          {
            description: '',
            example: 'aaa',
            name: 'bbb',
            alias: '显示名',
            position: [0, 0, 3]
          }
        ]
      }
    }
  });
};

// 测试服务
export const analysisServiceTest = (param: any): Promise<any> => {
  const tables = Array.from({ length: 5 }, (_, i) => {
    return {
      v: `vid${i}`,
      vertices_parsed_list: [
        {
          vid: `vid${i}`,
          tags: ['kom_customer_info'],
          color: `#${Math.random().toString(16).slice(2, 8)}`,
          alias: `alias${i}`,
          icon: 'graph-model',
          properties: {
            kom_customer_info: {
              industry_id: '180',
              _timestamp_: 1675920249,
              name: `云南中医学院${i}`,
              _name_: '_name_',
              subindustry_id: '206',
              _ds_id_: ''
            }
          },
          default_property: {
            n: 'name',
            v: `嗡嗡嗡${i}`
          }
        }
      ]
    };
  });

  return Promise.resolve({
    res: [
      {
        data: {
          headers: ['v'],
          tables
        }
      }
    ]
  });
};
