export const kmap_dict = {
  entity: [
    {
      name: 'contract',
      entity_type: 'contract',
      x: 633.5588887458305,
      y: 388.4022507177452,
      property_map: [
        { entity_prop: 'name', otl_prop: 'name' },
        { entity_prop: 'id', otl_prop: 'id' },
        { entity_prop: 'number', otl_prop: 'number' },
        { entity_prop: 'currency', otl_prop: 'currency' },
        { entity_prop: 'amount', otl_prop: 'amount' },
        { entity_prop: 'sign_date', otl_prop: 'sign_date' },
        { entity_prop: 'account_name', otl_prop: 'account_name' },
        { entity_prop: 'bank', otl_prop: 'bank' },
        { entity_prop: 'bank_number', otl_prop: 'bank_number' },
        { entity_prop: 'tax_rate', otl_prop: 'tax_rate' },
        { entity_prop: 'tax_amount', otl_prop: 'tax_amount' },
        { entity_prop: 'amount_without_tax', otl_prop: 'amount_without_tax' }
      ]
    },
    {
      name: 'company',
      entity_type: 'company',
      x: 780.6549789570037,
      y: 388.37625471129377,
      property_map: [{ entity_prop: 'name', otl_prop: 'name' }]
    },
    {
      name: 'clause',
      entity_type: 'clause',
      x: 795.9715253130779,
      y: 388.4207578905625,
      property_map: [
        { entity_prop: 'name', otl_prop: 'name' },
        { entity_prop: 'content', otl_prop: 'content' }
      ]
    }
  ],
  edge: [
    {
      relations: ['contract', 'contain', 'clause'],
      entity_type: 'contain',
      property_map: [{ entity_prop: 'name', edge_prop: 'name' }],
      relation_map: {
        begin_class_prop: '',
        equation_begin: '',
        relation_begin_pro: '',
        equation: '',
        relation_end_pro: '',
        equation_end: '',
        end_class_prop: ''
      }
    },
    {
      relations: ['contract', 'ownerSubject', 'company'],
      entity_type: 'ownerSubject',
      property_map: [{ entity_prop: 'name', edge_prop: 'name' }],
      relation_map: {
        begin_class_prop: '',
        equation_begin: '',
        relation_begin_pro: '',
        equation: '',
        relation_end_pro: '',
        equation_end: '',
        end_class_prop: ''
      }
    },
    {
      relations: ['contract', 'otherSubject', 'company'],
      entity_type: 'otherSubject',
      property_map: [{ entity_prop: 'name', edge_prop: 'name' }],
      relation_map: {
        begin_class_prop: '',
        equation_begin: '',
        relation_begin_pro: '',
        equation: '',
        relation_end_pro: '',
        equation_end: '',
        end_class_prop: ''
      }
    }
  ],
  files: [
    {
      ds_id: 10,
      data_source: 'as7',
      ds_path: '部门文档库1',
      extract_type: 'modelExtraction',
      extract_rules: [
        {
          entity_type: 'contract',
          property: [
            { column_name: 'name', property_field: 'name' },
            { column_name: 'id', property_field: 'id' },
            { column_name: 'number', property_field: 'number' },
            { column_name: 'currency', property_field: 'currency' },
            { column_name: 'amount', property_field: 'amount' },
            { column_name: 'sign_date', property_field: 'sign_date' },
            { column_name: 'account_name', property_field: 'account_name' },
            { column_name: 'bank', property_field: 'bank' },
            { column_name: 'bank_number', property_field: 'bank_number' },
            { column_name: 'tax_rate', property_field: 'tax_rate' },
            { column_name: 'tax_amount', property_field: 'tax_amount' },
            { column_name: 'amount_without_tax', property_field: 'amount_without_tax' }
          ]
        },
        { entity_type: 'company', property: [{ column_name: 'name', property_field: 'name' }] },
        {
          entity_type: 'clause',
          property: [
            { column_name: 'name', property_field: 'name' },
            { column_name: 'content', property_field: 'content' }
          ]
        },
        {
          entity_type: 'contain',
          property: [
            { column_name: 'name', property_field: 'name' },
            { column_name: 'subject', property_field: 'subject' },
            { column_name: 'object', property_field: 'object' }
          ]
        },
        {
          entity_type: 'ownerSubject',
          property: [
            { column_name: 'name', property_field: 'name' },
            { column_name: 'subject', property_field: 'subject' },
            { column_name: 'object', property_field: 'object' }
          ]
        },
        {
          entity_type: 'otherSubject',
          property: [
            { column_name: 'name', property_field: 'name' },
            { column_name: 'subject', property_field: 'subject' },
            { column_name: 'object', property_field: 'object' }
          ]
        }
      ],
      files: [
        {
          file_name: '2007年华为传输设备采购框架协议采购订单（审批版） (5).doc',
          file_path: '部门文档库1/合同数据集/5000/2007年华为传输设备采购框架协议采购订单（审批版） (5).doc',
          file_source:
            'gns://CBBB3180731847DA9CE55F262C7CD3D8/D4C286E11B734E3EBFD757944C3770EB/CB6A9BC1025E4D9598DE710B42DA0FE2/A3FC2C4D35BE418D861F60E8E46ED18B',
          file_type: 'file'
        }
      ],
      x: 0,
      y: 0,
      extract_model: 'Contractmodel'
    }
  ]
};