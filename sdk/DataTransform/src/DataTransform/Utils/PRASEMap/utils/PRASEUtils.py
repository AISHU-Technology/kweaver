import os
import sys
import json
import torch
from DataTransform.Utils.PRASEMap.prase import KGs, KG
import numpy as np
import scipy.sparse as sp
from time import strftime, localtime


def to_tensor(batch):
    """Change an array to a tensor.
    """
    return torch.from_numpy(np.array(batch))

def sparse_to_tensor(sparse_mx):
    def to_tuple(mx):
        if not sp.isspmatrix_coo(mx):
            mx = mx.tocoo()
        coords = []
        coords.append(mx.row)
        coords.append(mx.col)
        # coords = np.vstack((mx.row, mx.col)).transpose()
        values = mx.data
        shape = mx.shape
        return torch.sparse_coo_tensor(to_tensor(coords), values, size=shape)
        # return coords, values, shape

    if isinstance(sparse_mx, list):
        for i in range(len(sparse_mx)):
            sparse_mx[i] = to_tuple(sparse_mx[i])
    else:
        sparse_mx = to_tuple(sparse_mx)

    return sparse_mx

def get_time_str():
    return str(strftime("[%Y-%m-%d %H:%M:%S]: ", localtime()))


def print_kgs_stat(kgs_obj):
    print(get_time_str() + "Discovered entity mapping : ")
    ent_align_result = kgs_obj.get_ent_align_name_result()
    print(ent_align_result)
    print(get_time_str() + "Discovered entity mapping number: " + str(len(ent_align_result)))
    sys.stdout.flush()
    sub_align_result, sup_align_result = kgs_obj.get_rel_align_name_result()
    print(get_time_str() + "Discovered relation mapping : ")
    print(sub_align_result)
    print(sup_align_result)
    print(get_time_str() + "Discovered relation mapping number: " + str(len(sub_align_result) + len(sup_align_result)))
    sys.stdout.flush()
    print(get_time_str() + "Discovered relation mapping : ")
    attr_align_a, attr_align_b = kgs_obj.get_attr_align_name_result()
    print(attr_align_a)
    print(attr_align_b)
    print(get_time_str() + "Discovered attribute mapping number: " + str(len(attr_align_a) + len(attr_align_b)))
    sys.stdout.flush()


def print_kg_stat(kg_obj):
    print(get_time_str() + "Entity Number: " + str(len(kg_obj.get_ent_id_set())))
    print(get_time_str() + "Relation Number: " + str(int(len(kg_obj.get_rel_id_set()) / 2)))
    print(get_time_str() + "Attribute Number: " + str(int(len(kg_obj.get_attr_id_set()) / 2)))
    print(get_time_str() + "Literal Number: " + str(int(len(kg_obj.get_lite_id_set()) / 2)))
    print(get_time_str() + "Relation Triple Number: " + str(int(len(kg_obj.get_relation_id_triples()) / 2)))
    print(get_time_str() + "Attribute Triple Number: " + str(int(len(kg_obj.get_attribute_id_triples()) / 2)))
    sys.stdout.flush()


def construct_kg(rel_dataset, attr_dataset=None, sep='\t'):
    kg = KG()

    for line in rel_dataset:
        if len(line) != 3:
            continue
        h, r, t = (value.strip() for value in line.values())
        kg.insert_rel_triple(h, r, t)

    for line in attr_dataset:
        if len(line) != 3:
            continue
        e, a, v = (str(value).strip() for value in line.values())
        kg.insert_attr_triple(e, a, v)

    return kg


def construct_kgs(kg1, kg2, se_module=None, **kwargs):
    kgs = KGs(kg1, kg2, se_module, **kwargs)
    return kgs


def save_prase_model(kgs, target_path, save_emb=False):
    base, file_name = os.path.split(target_path)
    if not os.path.exists(base):
        os.makedirs(base)
    save_dict = dict()
    save_dict["data"] = dict()
    save_dict["data"]["ent_mappings"] = set()
    save_dict["data"]["sub_rel_mappings"] = set()
    save_dict["data"]["sup_rel_mappings"] = set()
    save_dict["data"]["sub_attr_mappings"] = set()
    save_dict["data"]["sup_attr_mappings"] = set()
    save_dict["forced_mappings"] = dict()
    save_dict["forced_mappings"]["ent_mappings"] = set()
    save_dict["forced_mappings"]["lite_mappings"] = set()
    save_dict["forced_mappings"]["sub_rel_mappings"] = set()
    save_dict["forced_mappings"]["sup_rel_mappings"] = set()
    save_dict["forced_mappings"]["sub_attr_mappings"] = set()
    save_dict["forced_mappings"]["sup_attr_mappings"] = set()
    save_dict["data"]["embedding"] = dict()
    save_dict["data"]["ent_embeddings"] = dict()

    for (ent_name, ent_cp_name, prob) in kgs.get_ent_align_name_result():
        save_dict["data"]["ent_mappings"].add((ent_name, ent_cp_name, prob))

    for (rel_id, rel_cp_id, prob) in kgs.pr.get_rel_eqv_result():
        is_attribute = True if rel_id in kgs.kg1.get_attr_id_set() | kgs.kg2.get_attr_id_set() else False
        if is_attribute:
            if rel_id in kgs.kg1.get_attr_id_set():
                is_inv_1 = kgs.kg1.is_inv_attr(rel_id)
                is_inv_2 = kgs.kg2.is_inv_attr(rel_cp_id)
                rel_id = kgs.kg1.get_inv_id(rel_id) if is_inv_1 else rel_id
                rel_cp_id = kgs.kg2.get_inv_id(rel_cp_id) if is_inv_2 else rel_cp_id
                rel_1_name = kgs.kg1.attr_id_name_dict[rel_id]
                rel_2_name = kgs.kg2.attr_id_name_dict[rel_cp_id]
                save_dict["data"]["sub_attr_mappings"].add((rel_1_name, rel_2_name, is_inv_1, is_inv_2, prob))
            else:
                is_inv_2 = kgs.kg2.is_inv_attr(rel_id)
                is_inv_1 = kgs.kg1.is_inv_attr(rel_cp_id)
                rel_id = kgs.kg2.get_inv_id(rel_id) if is_inv_2 else rel_id
                rel_cp_id = kgs.kg1.get_inv_id(rel_cp_id) if is_inv_1 else rel_cp_id
                rel_2_name = kgs.kg2.attr_id_name_dict[rel_id]
                rel_1_name = kgs.kg1.attr_id_name_dict[rel_cp_id]
                save_dict["data"]["sup_attr_mappings"].add((rel_1_name, rel_2_name, is_inv_1, is_inv_2, prob))
        else:
            if rel_id in kgs.kg1.get_rel_id_set():
                is_inv_1 = kgs.kg1.is_inv_rel(rel_id)
                is_inv_2 = kgs.kg2.is_inv_rel(rel_cp_id)
                rel_id = kgs.kg1.get_inv_id(rel_id) if is_inv_1 else rel_id
                rel_cp_id = kgs.kg2.get_inv_id(rel_cp_id) if is_inv_2 else rel_cp_id
                rel_1_name = kgs.kg1.rel_id_name_dict[rel_id]
                rel_2_name = kgs.kg2.rel_id_name_dict[rel_cp_id]
                save_dict["data"]["sub_rel_mappings"].add((rel_1_name, rel_2_name, is_inv_1, is_inv_2, prob))
            else:
                is_inv_2 = kgs.kg2.is_inv_rel(rel_id)
                is_inv_1 = kgs.kg1.is_inv_rel(rel_cp_id)
                rel_id = kgs.kg2.get_inv_id(rel_id) if is_inv_2 else rel_id
                rel_cp_id = kgs.kg1.get_inv_id(rel_cp_id) if is_inv_1 else rel_cp_id
                rel_2_name = kgs.kg2.rel_id_name_dict[rel_id]
                rel_1_name = kgs.kg1.rel_id_name_dict[rel_cp_id]
                save_dict["data"]["sup_rel_mappings"].add((rel_1_name, rel_2_name, is_inv_1, is_inv_2, prob))

    for (id_l, id_r, prob) in kgs.get_inserted_forced_mappings():
        reverse = True if id_l in kgs.kg2.get_ent_id_set() or id_l in kgs.kg2.get_lite_id_set() \
                          or id_l in kgs.kg2.get_attr_id_set() or id_l in kgs.kg2.get_rel_id_set() else False
        if reverse:
            if id_l in kgs.kg2.get_ent_id_set():
                name_l, name_r = kgs.kg2.get_ent_name_by_id(id_l), kgs.kg1.get_ent_name_by_id(id_r)
                save_dict["forced_mappings"]["ent_mappings"].add((name_r, name_l, prob))
            elif id_l in kgs.kg2.get_lite_id_set():
                name_l, name_r = kgs.kg2.get_lite_name_by_id(id_l), kgs.kg1.get_lite_name_by_id(id_r)
                save_dict["forced_mappings"]["lite_mappings"].add((name_r, name_l, prob))
            elif id_l in kgs.kg2.get_rel_id_set():
                inv_l, inv_r = kgs.kg2.is_inv_rel(id_l), kgs.kg1.is_inv_rel(id_r)
                id_l = kgs.kg2.get_inv_id(id_l) if inv_l else id_l
                id_r = kgs.kg1.get_inv_id(id_r) if inv_r else id_r
                name_l, name_r = kgs.kg2.rel_id_name_dict[id_l], kgs.kg1.rel_id_name_dict[id_r]
                save_dict["forced_mappings"]["sup_rel_mappings"].add((name_r, name_l, inv_r, inv_l, prob))
            else:
                inv_l, inv_r = kgs.kg2.is_inv_attr(id_l), kgs.kg1.is_inv_attr(id_r)
                id_l = kgs.kg2.get_inv_id(id_l) if inv_l else id_l
                id_r = kgs.kg1.get_inv_id(id_r) if inv_r else id_r
                name_l, name_r = kgs.kg2.attr_id_name_dict[id_l], kgs.kg1.attr_id_name_dict[id_r]
                save_dict["forced_mappings"]["sup_attr_mappings"].add((name_r, name_l, inv_r, inv_l, prob))
        else:
            if id_l in kgs.kg1.get_ent_id_set():
                name_l, name_r = kgs.kg1.get_ent_name_by_id(id_l), kgs.kg2.get_ent_name_by_id(id_r)
                save_dict["forced_mappings"]["ent_mappings"].add((name_l, name_r, prob))
            elif id_l in kgs.kg1.get_lite_id_set():
                name_l, name_r = kgs.kg1.get_lite_name_by_id(id_l), kgs.kg2.get_lite_name_by_id(id_r)
                save_dict["forced_mappings"]["lite_mappings"].add((name_l, name_r, prob))
            elif id_l in kgs.kg1.get_rel_id_set():
                inv_l, inv_r = kgs.kg1.is_inv_rel(id_l), kgs.kg2.is_inv_rel(id_r)
                id_l = kgs.kg1.get_inv_id(id_l) if inv_l else id_l
                id_r = kgs.kg2.get_inv_id(id_r) if inv_r else id_r
                name_l, name_r = kgs.kg1.rel_id_name_dict[id_l], kgs.kg2.rel_id_name_dict[id_r]
                save_dict["forced_mappings"]["sub_rel_mappings"].add((name_l, name_r, inv_l, inv_r, prob))
            else:
                inv_l, inv_r = kgs.kg1.is_inv_attr(id_l), kgs.kg2.is_inv_attr(id_r)
                id_l = kgs.kg1.get_inv_id(id_l) if inv_l else id_l
                id_r = kgs.kg2.get_inv_id(id_r) if inv_r else id_r
                name_l, name_r = kgs.kg1.attr_id_name_dict[id_l], kgs.kg2.attr_id_name_dict[id_r]
                save_dict["forced_mappings"]["sub_attr_mappings"].add((name_l, name_r, inv_l, inv_r, prob))

    def transform_set_to_list(dictionary):
        for (key, value) in dictionary.items():
            if isinstance(value, dict):
                transform_set_to_list(dictionary[key])
            if isinstance(value, set):
                new_list = list(value)
                dictionary[key] = new_list

    transform_set_to_list(save_dict)

    save_dict["data"]["ent_embeddings"]["KG1"] = dict()
    save_dict["data"]["ent_embeddings"]["KG2"] = dict()

    if save_emb:
        for ent_id in kgs.kg1.get_ent_id_set():
            ent_name = kgs.kg1.get_ent_name_by_id(ent_id)
            ent_emb = kgs.kg1.get_ent_embed_by_id(ent_id)
            if ent_emb is not None:
                save_dict["data"]["ent_embeddings"]["KG1"][ent_name] = ent_emb.tolist()

        for ent_id in kgs.kg2.get_ent_id_set():
            ent_name = kgs.kg2.get_ent_name_by_id(ent_id)
            ent_emb = kgs.kg2.get_ent_embed_by_id(ent_id)
            if ent_emb is not None:
                save_dict["data"]["ent_embeddings"]["KG2"][ent_name] = ent_emb.tolist()

    with open(target_path, "w", encoding="utf8") as f:
        json.dump(save_dict, f, indent=4)


def load_prase_model(kgs, source_path):
    if not os.path.exists(source_path):
        return

    with open(source_path, "r", encoding="utf8") as f:
        load_dict = json.load(f)

    ent_mappings = load_dict["data"]["ent_mappings"]
    sub_rel_mappings = load_dict["data"]["sub_rel_mappings"]
    sup_rel_mappings = load_dict["data"]["sup_rel_mappings"]
    sub_attr_mappings = load_dict["data"]["sub_attr_mappings"]
    sup_attr_mappings = load_dict["data"]["sup_attr_mappings"]

    forced_ent_mappings = load_dict["forced_mappings"]["ent_mappings"]
    forced_lite_mappings = load_dict["forced_mappings"]["lite_mappings"]
    forced_sub_rel_mappings = load_dict["forced_mappings"]["sub_rel_mappings"]
    forced_sup_rel_mappings = load_dict["forced_mappings"]["sup_rel_mappings"]
    forced_sub_attr_mappings = load_dict["forced_mappings"]["sub_attr_mappings"]
    forced_sup_attr_mappings = load_dict["forced_mappings"]["sup_attr_mappings"]

    for (ent_l, ent_r, prob) in ent_mappings:
        kgs.insert_ent_eqv_both_way_by_name(ent_l, ent_r, prob)

    for (ent_l, ent_r, prob) in forced_ent_mappings:
        kgs.insert_forced_ent_eqv_both_way_by_name(ent_l, ent_r, prob)

    for (lite_l, lite_r, prob) in forced_lite_mappings:
        lite_l_id, lite_r_id = kgs.kg1.get_lite_id_by_name(lite_l, False), kgs.kg2.get_lite_id_by_name(lite_r, False)
        if lite_l_id is not None and lite_r_id is not None:
            kgs.insert_lite_eqv_by_id(lite_l_id, lite_r_id, prob)

    for (rel_l, rel_r, inv_l, inv_r, prob) in sub_rel_mappings:
        rel_l_id = kgs.kg1.get_rel_id_by_name(rel_l)
        rel_r_id = kgs.kg2.get_rel_id_by_name(rel_r)
        rel_l_id = kgs.kg1.get_inv_id(rel_l_id) if inv_l else rel_l_id
        rel_r_id = kgs.kg2.get_inv_id(rel_r_id) if inv_r else rel_r_id
        kgs.insert_rel_eqv_by_id(rel_l_id, rel_r_id, prob)

    for (rel_l, rel_r, inv_l, inv_r, prob) in sup_rel_mappings:
        rel_l_id = kgs.kg1.get_rel_id_by_name(rel_l)
        rel_r_id = kgs.kg2.get_rel_id_by_name(rel_r)
        rel_l_id = kgs.kg1.get_inv_id(rel_l_id) if inv_l else rel_l_id
        rel_r_id = kgs.kg2.get_inv_id(rel_r_id) if inv_r else rel_r_id
        kgs.insert_rel_eqv_by_id(rel_r_id, rel_l_id, prob)

    for (attr_l, attr_r, inv_l, inv_r, prob) in sub_attr_mappings:
        attr_l_id = kgs.kg1.get_attr_id_by_name(attr_l)
        attr_r_id = kgs.kg2.get_attr_id_by_name(attr_r)
        attr_l_id = kgs.kg1.get_inv_id(attr_l_id) if inv_l else attr_l_id
        attr_r_id = kgs.kg2.get_inv_id(attr_r_id) if inv_r else attr_r_id
        kgs.insert_rel_eqv_by_id(attr_l_id, attr_r_id, prob)

    for (attr_l, attr_r, inv_l, inv_r, prob) in sup_attr_mappings:
        attr_l_id = kgs.kg1.get_attr_id_by_name(attr_l)
        attr_r_id = kgs.kg2.get_attr_id_by_name(attr_r)
        attr_l_id = kgs.kg1.get_inv_id(attr_l_id) if inv_l else attr_l_id
        attr_r_id = kgs.kg2.get_inv_id(attr_r_id) if inv_r else attr_r_id
        kgs.insert_rel_eqv_by_id(attr_r_id, attr_l_id, prob)

    for (rel_l, rel_r, inv_l, inv_r, prob) in forced_sub_rel_mappings:
        rel_l_id = kgs.kg1.get_rel_id_by_name(rel_l)
        rel_r_id = kgs.kg2.get_rel_id_by_name(rel_r)
        rel_l_id = kgs.kg1.get_inv_id(rel_l_id) if inv_l else rel_l_id
        rel_r_id = kgs.kg2.get_inv_id(rel_r_id) if inv_r else rel_r_id
        kgs.insert_forced_rel_eqv_by_id(rel_l_id, rel_r_id, prob)

    for (rel_l, rel_r, inv_l, inv_r, prob) in forced_sup_rel_mappings:
        rel_l_id = kgs.kg1.get_rel_id_by_name(rel_l)
        rel_r_id = kgs.kg2.get_rel_id_by_name(rel_r)
        rel_l_id = kgs.kg1.get_inv_id(rel_l_id) if inv_l else rel_l_id
        rel_r_id = kgs.kg2.get_inv_id(rel_r_id) if inv_r else rel_r_id
        kgs.insert_forced_rel_eqv_by_id(rel_r_id, rel_l_id, prob)

    for (attr_l, attr_r, inv_l, inv_r, prob) in forced_sub_attr_mappings:
        attr_l_id = kgs.kg1.get_attr_id_by_name(attr_l)
        attr_r_id = kgs.kg2.get_attr_id_by_name(attr_r)
        attr_l_id = kgs.kg1.get_inv_id(attr_l_id) if inv_l else attr_l_id
        attr_r_id = kgs.kg2.get_inv_id(attr_r_id) if inv_r else attr_r_id
        kgs.insert_forced_rel_eqv_by_id(attr_l_id, attr_r_id, prob)

    for (attr_l, attr_r, inv_l, inv_r, prob) in forced_sup_attr_mappings:
        attr_l_id = kgs.kg1.get_attr_id_by_name(attr_l)
        attr_r_id = kgs.kg2.get_attr_id_by_name(attr_r)
        attr_l_id = kgs.kg1.get_inv_id(attr_l_id) if inv_l else attr_l_id
        attr_r_id = kgs.kg2.get_inv_id(attr_r_id) if inv_r else attr_r_id
        kgs.insert_forced_rel_eqv_by_id(attr_r_id, attr_l_id, prob)

    kg1_ent_emb = load_dict["data"]["ent_embeddings"]["KG1"]
    kg2_ent_emb = load_dict["data"]["ent_embeddings"]["KG2"]

    for (ent_name, emb_list) in kg1_ent_emb.items():
        ent_id = kgs.kg1.get_ent_id_by_name(ent_name, False)
        embed = np.array(emb_list)
        kgs.kg1.insert_ent_embed_by_id(ent_id, embed)

    for (ent_name, emb_list) in kg2_ent_emb.items():
        ent_id = kgs.kg2.get_ent_id_by_name(ent_name, False)
        embed = np.array(emb_list)
        kgs.kg2.insert_ent_embed_by_id(ent_id, embed)

    kgs.pr.init_loaded_data()

