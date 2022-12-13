import prase_core as pc
import re


class KG:
    component_id = 0
    suffix_for_inv_rel = "-(inv)"

    def __init__(self, name="KG", ent_pre_func=None, rel_pre_func=None, attr_pre_func=None,
                 lite_pre_func=None):
        self.name = name
        self.ent_pre_func = ent_pre_func
        self.rel_pre_func = rel_pre_func
        self.attr_pre_func = attr_pre_func
        self.lite_pre_func = lite_pre_func

        self.kg_core = pc.KG()

        self.id_raw_name_dict = dict()

        self.ent_id_name_dict = dict()
        self.rel_id_name_dict = dict()
        self.attr_id_name_dict = dict()
        self.lite_id_name_dict = dict()

        self.name_ent_id_dict = dict()
        self.name_rel_id_dict = dict()
        self.name_attr_id_dict = dict()
        self.name_lite_id_dict = dict()

        self.rel_inv_dict = dict()

        self.__init()

    def __init(self):
        if self.ent_pre_func is None:
            self.ent_pre_func = self.default_pre_func
        if self.rel_pre_func is None:
            self.rel_pre_func = self.default_pre_func
        if self.attr_pre_func is None:
            self.attr_pre_func = self.default_pre_func
        if self.lite_pre_func is None:
            self.lite_pre_func = self.default_pre_func_for_literal

    @staticmethod
    def default_pre_func(name: str):
        pattern = r'"?<?([^">]*)>?"?.*'
        matchObj = re.match(pattern=pattern, string=name)
        if matchObj is None:
            print("Match Error: " + name)
            return name
        value = matchObj.group(1).strip()
        # if "/" in value:
        #     value = value.split(sep="/")[-1].strip()
        return value

    @staticmethod
    def default_pre_func_for_literal(name: str):
        value = name.split("^")[0].strip()
        start, end = 0, len(value) - 1
        if start < len(value) and value[start] == '<':
            start += 1
        if end > 0 and value[end] == '>':
            end -= 1
        if start < len(value) and value[start] == '"':
            start += 1
        if end > 0 and value[end] == '"':
            end -= 1
        if start > end:
            # print("Match Error: " + name)
            return name
        value = value[start: end + 1].strip()
        return value

    @staticmethod
    def get_id_from_name_helper(dictionary, inv_dictionary, name):
        if not dictionary.__contains__(name):
            generated_id = KG.component_id
            KG.component_id += 1
            dictionary[name] = generated_id
            inv_dictionary[generated_id] = name
        return dictionary[name]

    def get_or_insert_ent_id(self, name):
        return self.get_id_from_name_helper(self.name_ent_id_dict, self.ent_id_name_dict, name)

    def get_or_insert_rel_id(self, name):
        return self.get_id_from_name_helper(self.name_rel_id_dict, self.rel_id_name_dict, name)

    def get_or_insert_attr_id(self, name):
        return self.get_id_from_name_helper(self.name_attr_id_dict, self.attr_id_name_dict, name)

    def get_or_insert_lite_id(self, name):
        return self.get_id_from_name_helper(self.name_lite_id_dict, self.lite_id_name_dict, name)

    def get_ent_id_by_name(self, ent_name, pre_proc=True):
        if pre_proc:
            ent_name = self.ent_pre_func(ent_name)
        if self.name_ent_id_dict.__contains__(ent_name):
            return self.name_ent_id_dict[ent_name]

    def get_lite_id_by_name(self, lite_name, pre_proc=True):
        if pre_proc:
            lite_name = self.rel_pre_func(lite_name)
        if self.name_lite_id_dict.__contains__(lite_name):
            return self.name_rel_id_dict[lite_name]

    def get_rel_id_by_name(self, rel_name, pre_proc=True):
        if pre_proc:
            rel_name = self.rel_pre_func(rel_name)
        if self.name_rel_id_dict.__contains__(rel_name):
            return self.name_rel_id_dict[rel_name]

    def get_attr_id_by_name(self, attr_name, pre_proc=True):
        if pre_proc:
            attr_name = self.rel_pre_func(attr_name)
        if self.name_attr_id_dict.__contains__(attr_name):
            return self.name_attr_id_dict[attr_name]

    def get_or_insert_inv_rel_id(self, rel_id):
        if not self.rel_inv_dict.__contains__(rel_id):
            generated_id = KG.component_id
            KG.component_id += 1
            self.rel_inv_dict[rel_id] = generated_id
            self.rel_inv_dict[generated_id] = rel_id
        return self.rel_inv_dict[rel_id]

    def insert_rel_triple(self, head, relation, tail):
        h, r, t = self.ent_pre_func(head), self.rel_pre_func(relation), self.ent_pre_func(tail)
        h_id, r_id, t_id = self.get_or_insert_ent_id(h), self.get_or_insert_rel_id(r), self.get_or_insert_ent_id(t)
        self.kg_core.insert_rel_triple(h_id, r_id, t_id)
        r_inv_id = self.get_or_insert_inv_rel_id(r_id)
        self.kg_core.insert_rel_inv_triple(h_id, r_inv_id, t_id)

    def insert_attr_triple(self, head, attribute, tail):
        h, a, t = self.ent_pre_func(head), self.attr_pre_func(attribute), self.lite_pre_func(tail)
        h_id, a_id, t_id = self.get_or_insert_ent_id(h), self.get_or_insert_attr_id(a), self.get_or_insert_lite_id(t)
        self.kg_core.insert_attr_triple(h_id, a_id, t_id)
        a_inv_id = self.get_or_insert_inv_rel_id(a_id)
        self.kg_core.insert_attr_inv_triple(h_id, a_inv_id, t_id)

    def insert_ent_embed_by_name(self, ent_name, emb):
        ent_id = self.get_ent_id_by_name(ent_name)
        if ent_id is not None:
            self.kg_core.set_ent_embed(ent_id, emb)
        else:
            print("error")

    def insert_ent_embed_by_id(self, ent_id, emb):
        if ent_id is not None:
            self.kg_core.set_ent_embed(ent_id, emb)
        else:
            print("error")

    def get_ent_embed_by_id(self, ent_id):
        ent_emb = None
        if ent_id is not None:
            ent_emb = self.kg_core.get_ent_embed(ent_id)
        if not len(ent_emb) <= 1:
            return ent_emb

    def get_relation_id_triples(self) -> set:
        return self.kg_core.get_relation_triples()

    def get_attribute_id_triples(self) -> set:
        return self.kg_core.get_attribute_triples()

    def clear_ent_embed(self):
        self.kg_core.clear_ent_embeds()

    def get_ent_id_set(self):
        return self.kg_core.get_ent_set()

    def get_rel_id_set(self):
        return self.kg_core.get_rel_set()

    def get_lite_id_set(self):
        return self.kg_core.get_lite_set()

    def get_attr_id_set(self):
        return self.kg_core.get_attr_set()

    def get_functionality_by_id(self, idx):
        return self.kg_core.get_functionality(idx)

    def get_inv_functionality_by_id(self, idx):
        return self.kg_core.get_inv_functionality(idx)

    def get_ent_name_by_id(self, idx):
        return self.ent_id_name_dict[idx]

    def get_lite_name_by_id(self, idx):
        return self.lite_id_name_dict[idx]

    def get_rel_name_by_id(self, idx):
        if self.rel_id_name_dict.__contains__(idx):
            return self.rel_id_name_dict[idx]
        else:
            inv_idx = self.rel_inv_dict[idx]
            inv_name = self.rel_id_name_dict[inv_idx]
            if inv_name is not None:
                return inv_name + KG.suffix_for_inv_rel

    def get_attr_name_by_id(self, idx):
        if self.attr_id_name_dict.__contains__(idx):
            return self.attr_id_name_dict[idx]
        else:
            inv_idx = self.rel_inv_dict[idx]
            inv_name = self.attr_id_name_dict[inv_idx]
            if inv_name is not None:
                return inv_name + KG.suffix_for_inv_rel

    def is_inv_rel(self, idx):
        return not self.rel_id_name_dict.__contains__(idx)

    def is_inv_attr(self, idx):
        return not self.attr_id_name_dict.__contains__(idx)

    def get_inv_id(self, idx):
        return self.rel_inv_dict[idx]

    def get_attr_one_way_frequency_list(self):
        frequency_dict = self.kg_core.get_attr_frequency_mp()
        return sorted(frequency_dict.items(), key=lambda x: x[1], reverse=True)

    def get_rel_ent_id_tuples_by_ent(self, idx):
        return self.kg_core.get_rel_ent_tuples_by_ent(idx)

    def get_attr_lite_id_tuples_by_ent(self, idx):
        return self.kg_core.get_attr_lite_tuples_by_ent(idx)

    @staticmethod
    def reset_component_id():
        KG.component_id = 0
