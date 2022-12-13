import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import RuleList from '../ruleList/index';

const props = {
  infoExtrData: [
    {
      data_source: 'as7',
      ds_id: 1,
      ds_name: '123',
      ds_path: 'test',
      extract_model: 'Anysharedocumentmodel',
      extract_rules: [
        { entity_type: 'folder', is_model: 'from_model', property: { property_field: 'name', property_func: 'All' } },
        { entity_type: 'folder', is_model: 'from_model', property: { property_field: 'path', property_func: 'All' } }
      ],
      extract_type: 'modelExtraction',
      file_name: 'test_contract',
      file_path: 'test/test_contract',
      file_source: 'gns://D15B4AC09E534D779A481AEF4CF30575/020717136517444895FE9EDD37A318AB',
      file_type: 'dir'
    },
    {
      data_source: 'hive',
      ds_id: 1,
      ds_name: '123',
      ds_path: 'test',
      extract_model: 'Contractmodel',
      extract_rules: [
        { entity_type: 'folder', is_model: 'from_model', property: { property_field: 'name', property_func: 'All' } },
        { entity_type: 'folder', is_model: 'from_model', property: { property_field: 'path', property_func: 'All' } }
      ],
      extract_type: 'modelExtraction',
      file_name: 'test_contract',
      file_path: 'test/test_contract',
      file_source: 'gns://D15B4AC09E534D779A481AEF4CF30575/020717136517444895FE9EDD37A318AB',
      file_type: 'dir'
    },
    {
      data_source: 'as',
      ds_id: 1,
      ds_name: '123',
      ds_path: 'test',
      extract_model: 'AImodel',
      extract_rules: [
        { entity_type: 'folder', is_model: 'from_model', property: { property_field: 'name', property_func: 'All' } },
        { entity_type: 'folder', is_model: 'from_model', property: { property_field: 'path', property_func: 'All' } }
      ],
      extract_type: 'modelExtraction',
      file_name: 'test_contract',
      file_path: 'test/test_contract',
      file_source: 'gns://D15B4AC09E534D779A481AEF4CF30575/020717136517444895FE9EDD37A318AB',
      file_type: 'dir'
    },
    {
      data_source: 'mysql',
      ds_id: 1,
      ds_name: '123',
      ds_path: 'test',
      extract_model: 'Generalmodel',
      extract_rules: [
        { entity_type: 'folder', is_model: 'from_model', property: { property_field: 'name', property_func: 'All' } },
        { entity_type: 'folder', is_model: 'from_model', property: { property_field: 'path', property_func: 'All' } }
      ],
      extract_type: 'modelExtraction',
      file_name: 'test_contract',
      file_path: 'test/test_contract',
      file_source: 'gns://D15B4AC09E534D779A481AEF4CF30575/020717136517444895FE9EDD37A318AB',
      file_type: 'dir'
    }
  ]
};

const init = props => mount(<RuleList {...props} />);

describe('UI test', () => {
  it('data render', async () => {
    init(props);
    await sleep();
  });
});
