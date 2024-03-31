import intl from 'react-intl-universal';

export const getPlaceholder = () => `${intl.get('function.place1')}
${intl.get('function.place2')}
${intl.get('function.place3')}
${intl.get('function.place4')}
match (v1:person{book:3,name:\${name}})-[]->(v2:person{book:\${book},name:"Aegon-I-Targaryen"}) return v1, v2 limit 2

${intl.get('function.place5')}
${intl.get('function.place6')}
${intl.get('function.place7')}
`;
