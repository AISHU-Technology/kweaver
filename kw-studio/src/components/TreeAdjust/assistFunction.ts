export const onHandleTree = (data: any) => {
  return {
    key: data.class_name,
    id: data.class_name,
    title: data.class_name,
    name: data.class_name,
    checkable: false,
    value: data.class_name,
    isLeaf: false
  };
};
