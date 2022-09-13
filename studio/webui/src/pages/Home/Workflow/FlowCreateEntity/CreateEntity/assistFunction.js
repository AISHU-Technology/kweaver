/**
 * @description  将图谱数据配置成保存数据
 */
const setSaveData = (nodes, edges) => {
  let entity = [];
  let edge = [];

  entity = nodes.map((item, index) => {
    let properties = [];

    item.properties.forEach((ditem, index) => {
      properties = [...properties, [ditem[0], ditem[1]]];
    });

    return {
      entity_id: item.entity_id,
      colour: item.colour,
      ds_name: item.ds_name,
      dataType: item.dataType,
      data_source: item.data_source,
      ds_path: item.ds_path,
      ds_id: item.ds_id.toString(),
      extract_type: item.extract_type,
      name: item.name,
      source_table: item.source_table,
      source_type: item.source_type,
      properties,
      file_type: item.file_type,
      task_id: item.task_id.toString(),
      properties_index: item.properties_index,
      model: item.model,
      ds_address: item.ds_address,
      alias: item.alias || ''
    };
  });

  edge = edges.map((item, index) => {
    let properties = [];

    item.properties.forEach((ditem, index) => {
      properties = [...properties, [ditem[0], ditem[1]]];
    });

    return {
      edge_id: item.edge_id,
      colour: item.colour,
      ds_name: item.ds_name,
      dataType: item.dataType,
      data_source: item.data_source,
      ds_path: item.ds_path,
      ds_id: item.ds_id.toString(),
      extract_type: item.extract_type,
      name: item.name,
      source_table: item.source_table,
      source_type: item.source_type,
      properties,
      file_type: item.file_type,
      task_id: item.task_id,
      properties_index: item.properties_index,
      model: item.model,
      relations: [item.source.name, item.name, item.target.name],
      ds_address: item.ds_address,
      alias: item.alias || ''
    };
  });

  return { entity, edge };
};

/**
 * @description 解析url
 */
const analyUrl = url => {
  if (isFlow()) {
    return { name: '', type: '' };
  }

  if (url === '') {
    return { name: '', type: '' };
  }

  return { name: url.split('&')[0].substring(13), type: url.split('&')[1].substring(5) };
};

const getCopyId = url => {
  if (url.split('&')[2]) {
    return url.split('&')[2].substring(8);
  }

  return '';
};

/**
 * @description 是否在流程中
 */
const isFlow = () => {
  if (window.location.pathname === '/home/workflow/edit' || window.location.pathname === '/home/workflow/create') {
    return true;
  }

  return false;
};

/**
 * @description 处理任务id，转化为number类型
 */
const handleTaskId = (nodes, edges) => {
  const Hentity = nodes.map((item, index) => {
    if (item.task_id) {
      item.task_id = parseInt(item.task_id);
    }

    return item;
  });

  const Hedge = edges.map((item, index) => {
    if (item.task_id) {
      item.task_id = parseInt(item.task_id);
    }

    return item;
  });

  return { Hentity, Hedge };
};

export { setSaveData, analyUrl, isFlow, handleTaskId, getCopyId };
