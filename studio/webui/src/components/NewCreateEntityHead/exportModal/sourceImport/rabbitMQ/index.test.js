import React from 'react';
import { mount } from 'enzyme';
import RabbitMQ from './index';

const testData = {
  dataType: 'structured',
  data_source: 'rabbitmq',
  ds_address: '10.4.109.191',
  ds_auth: '11',
  ds_password: 'anydata123',
  ds_path: 'test',
  ds_port: 5672,
  ds_user: 'admin',
  dsname: 'test001111',
  extract_type: 'standardExtraction',
  id: 1,
  json_schema: '{"name": "xiaoming"}',
  queue: 'test1',
  vhost: 'test'
};
const init = (props = {}) => mount(<RabbitMQ {...props} />);

describe('RabbitMQ', () => {
  it('test render', async () => {
    const wrapper = init();

    wrapper.setProps({ selectedValue: testData });

    const jsonSchema = wrapper.find('.text-area').at(0).text();

    expect(wrapper.find('.line .tent').last().text()).toBe(testData.queue);
    expect(JSON.parse(jsonSchema)).toEqual(JSON.parse(testData.json_schema));
  });
});
