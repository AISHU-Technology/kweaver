#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/eigen.h>
#include <iostream>
#include <thread>
#include <mutex>
#include <unordered_map>
#include <unordered_set>
#include <stack>
#include <set>
#include <tuple>
#include <queue>
#include <random>
#include <atomic>
#include <algorithm>
#include <functional>

namespace py = pybind11;

class SpinLock {
public:
    SpinLock() : flag_(false) {}
    void lock();
    void unlock();

private:
    std::atomic<bool> flag_;
};

void SpinLock::lock() {
    bool expect = false;
    while (!flag_.compare_exchange_weak(expect, true)) {
        expect = false;
    }
}

void SpinLock::unlock() {
    flag_.store(false);
}

struct pair_hash {
    template<class T1, class T2>
    std::size_t operator() (const std::pair<T1, T2>& p) const {
        auto h1 = std::hash<T1>{}(p.first);
        auto h2 = std::hash<T2>{}(p.second);
        return h1 ^ h2;
    }
};

struct PARISParams {
    bool ENABLE_EMB_EQV;
    double ENT_EQV_THRESHOLD;
    double REL_EQV_THRESHOLD;
    double REL_EQV_FACTOR_THRESHOLD;
    double REL_INIT_EQV;
    double HIGH_CONF_THRESHOLD;
    double OUTPUT_THRESHOLD;
    double PENALTY_VALUE;
    double ENT_REGISTER_THRESHOLD;
    double EMB_EQV_TRADE_OFF;
    double INV_FUNCTIONALITY_THRESHOLD;
    int INIT_ITERATION;
    int SMOOTH_NORM;
    int THREAD_NUM;
    int MAX_THREAD_NUM;
    int MIN_THREAD_NUM;
    int MAX_ITERATION_NUM;
    uint64_t ENT_CANDIDATE_NUM;
    uint64_t MAX_EMB_EQV_CACHE_NUM;
    PARISParams();
};

PARISParams::PARISParams() {
    ENABLE_EMB_EQV = true;
    ENT_EQV_THRESHOLD = 0.1;
    REL_EQV_THRESHOLD = 0.1;
    REL_EQV_FACTOR_THRESHOLD = 0.01;
    REL_INIT_EQV = 0.1;
    HIGH_CONF_THRESHOLD = 0.9;
    OUTPUT_THRESHOLD = 0.1;
    PENALTY_VALUE = 1.01;
    ENT_REGISTER_THRESHOLD = 0.01;
    INIT_ITERATION = 2;
    ENT_CANDIDATE_NUM = 1;
    SMOOTH_NORM = 10;
    THREAD_NUM = std::thread::hardware_concurrency();
    MAX_THREAD_NUM = INT_MAX;
    MIN_THREAD_NUM = 1;
    MAX_ITERATION_NUM = 10;
    MAX_EMB_EQV_CACHE_NUM = 1000000;
    EMB_EQV_TRADE_OFF = 0.2;
    INV_FUNCTIONALITY_THRESHOLD = 0.05;
}


class KG {
public:
    static bool is_emb_empty(Eigen::VectorXd&);
    void insert_rel_triple(uint64_t, uint64_t, uint64_t);
    void insert_rel_inv_triple(uint64_t, uint64_t, uint64_t);
    void insert_attr_triple(uint64_t, uint64_t, uint64_t);
    void insert_attr_inv_triple(uint64_t, uint64_t, uint64_t);
    bool is_attribute(uint64_t);
    bool is_literal(uint64_t);
    bool is_embs_filled();
    void test();
    std::set<std::pair<uint64_t, uint64_t>>* get_rel_tail_pairs_ptr(uint64_t);
    std::set<std::pair<uint64_t, uint64_t>>* get_rel_head_pairs_ptr(uint64_t);
    std::set<std::pair<uint64_t, uint64_t>>* get_rel_ent_head_pairs_ptr(uint64_t);
    std::set<uint64_t>& get_ent_set();
    std::set<uint64_t>& get_lite_set();
    std::set<uint64_t>& get_rel_set();
    std::set<uint64_t>& get_attr_set();
    std::map<uint64_t, uint64_t>& get_attr_frequency_mp();
    std::set<std::tuple<uint64_t, uint64_t, uint64_t>>& get_relation_triples();
    std::set<std::tuple<uint64_t, uint64_t, uint64_t>>& get_attribute_triples();
    double get_functionality(uint64_t);
    double get_inv_functionality(uint64_t);
    void init_functionalities();
    void set_ent_embed(uint64_t, Eigen::VectorXd &);
    void clear_ent_embeds();
    Eigen::VectorXd& get_ent_embed(uint64_t);
    std::set<std::tuple<uint64_t, uint64_t>>& get_rel_ent_tuples_by_ent(uint64_t);
    std::set<std::tuple<uint64_t, uint64_t>>& get_attr_lite_tuples_by_ent(uint64_t);
private:
    std::set<uint64_t> ent_set;
    std::set<uint64_t> lite_set;
    std::set<uint64_t> attr_set;
    std::set<uint64_t> rel_set;
    std::unordered_map<uint64_t, Eigen::VectorXd> ent_emb_mp;
    std::unordered_map<uint64_t, std::set<std::pair<uint64_t, uint64_t>>> h_r_t_mp;
    std::unordered_map<uint64_t, std::set<std::pair<uint64_t, uint64_t>>> t_r_h_mp;
    std::unordered_map<uint64_t, std::set<std::pair<uint64_t, uint64_t>>> t_r_h_ent_mp;
    std::unordered_map<uint64_t, std::set<std::tuple<uint64_t, uint64_t>>> ent_rel_ent_mp;
    std::unordered_map<uint64_t, std::set<std::tuple<uint64_t, uint64_t>>> ent_attr_lite_mp;
    std::set<std::tuple<uint64_t, uint64_t, uint64_t>> relation_triples;
    std::set<std::tuple<uint64_t, uint64_t, uint64_t>> attribute_triples;
    std::map<uint64_t, uint64_t> attr_frequent_mp;
    std::unordered_map<uint64_t, double> functionality_mp;
    std::unordered_map<uint64_t, double> inv_functionality_mp;
    static std::set<std::pair<uint64_t, uint64_t>> EMPTY_PAIR_SET;
    static std::set<std::tuple<uint64_t, uint64_t>> EMPTY_TWO_TUPLE_SET;
    static void insert_triple(std::unordered_map<uint64_t, std::set<std::pair<uint64_t, uint64_t>>>&, uint64_t, uint64_t, uint64_t);
    static Eigen::VectorXd EMPTY_EMB;
};

std::set<std::pair<uint64_t, uint64_t>> KG::EMPTY_PAIR_SET = std::set<std::pair<uint64_t, uint64_t>>();
std::set<std::tuple<uint64_t, uint64_t>> KG::EMPTY_TWO_TUPLE_SET = std::set<std::tuple<uint64_t, uint64_t>>();
Eigen::VectorXd KG::EMPTY_EMB(1, 1);

void KG::insert_triple(std::unordered_map<uint64_t, std::set<std::pair<uint64_t, uint64_t>>>& target, uint64_t head, uint64_t relation, uint64_t tail) {
    if (!target.count(head)) {
        target[head] = std::set<std::pair<uint64_t, uint64_t>>();
    }
    target[head].insert(std::make_pair(relation, tail));
}

void KG::insert_rel_triple(uint64_t head, uint64_t relation, uint64_t tail) {
    ent_set.insert(head);
    ent_set.insert(tail);
    rel_set.insert(relation);
    relation_triples.insert(std::make_tuple(head, relation, tail));
    insert_triple(this -> h_r_t_mp, head, relation, tail);
    insert_triple(this -> t_r_h_mp, tail, relation, head);
    insert_triple(this -> t_r_h_ent_mp, tail, relation, head);

    if (!ent_rel_ent_mp.count(head)) {
        ent_rel_ent_mp[head] = std::set<std::tuple<uint64_t, uint64_t>>();
    }
    ent_rel_ent_mp[head].insert(std::make_tuple(relation, tail));
}

void KG::insert_rel_inv_triple(uint64_t head, uint64_t relation_inv, uint64_t tail) {
    insert_rel_triple(tail, relation_inv, head);
}

void KG::insert_attr_triple(uint64_t entity, uint64_t attribute, uint64_t literal) {
    ent_set.insert(entity);
    lite_set.insert(literal);
    attr_set.insert(attribute);
    attribute_triples.insert(std::make_tuple(entity, attribute, literal));
    insert_triple(this -> h_r_t_mp, entity, attribute, literal);
    insert_triple(this -> t_r_h_mp, literal, attribute, entity);
    insert_triple(this -> t_r_h_ent_mp, literal, attribute, entity);

    if (!ent_attr_lite_mp.count(entity)) {
        ent_attr_lite_mp[entity] = std::set<std::tuple<uint64_t, uint64_t>>();
    }
    ent_attr_lite_mp[entity].insert(std::make_tuple(attribute, literal)); 
    
    if (!attr_frequent_mp.count(attribute)) {
        attr_frequent_mp[attribute] = 0;
    }
    attr_frequent_mp[attribute] += 1;
}

std::map<uint64_t, uint64_t>& KG::get_attr_frequency_mp() {
    return attr_frequent_mp;
}

void KG::insert_attr_inv_triple(uint64_t entity, uint64_t attribute_inv, uint64_t literal) {
    ent_set.insert(entity);
    lite_set.insert(literal);
    attr_set.insert(attribute_inv);
    attribute_triples.insert(std::make_tuple(literal, attribute_inv, entity));
    insert_triple(this -> h_r_t_mp, literal, attribute_inv, entity);
    insert_triple(this -> t_r_h_mp, entity, attribute_inv, literal);
}


bool KG::is_attribute(uint64_t rel_id) {
    return !rel_set.count(rel_id);
}

bool KG::is_literal(uint64_t ent_id) {
    return !ent_set.count(ent_id);
}

std::set<std::pair<uint64_t, uint64_t>>* KG::get_rel_tail_pairs_ptr(uint64_t head_id) {
    if (!h_r_t_mp.count(head_id)) {
        return &EMPTY_PAIR_SET;
    }
    return &h_r_t_mp[head_id];
}

std::set<std::pair<uint64_t, uint64_t>>* KG::get_rel_head_pairs_ptr(uint64_t tail_id) {
    if (!t_r_h_mp.count(tail_id)) {
        return &EMPTY_PAIR_SET;
    }
    return &t_r_h_mp[tail_id];
}

std::set<std::pair<uint64_t, uint64_t>>* KG::get_rel_ent_head_pairs_ptr(uint64_t tail_id) {
    if (!t_r_h_ent_mp.count(tail_id)) {
        return &EMPTY_PAIR_SET;
    }
    return &t_r_h_ent_mp[tail_id];
}


 std::set<std::tuple<uint64_t, uint64_t>>& KG::get_rel_ent_tuples_by_ent(uint64_t head_id) {
    if (!ent_rel_ent_mp.count(head_id)) {
         return EMPTY_TWO_TUPLE_SET;
    }
    return ent_rel_ent_mp[head_id]; 
 }

std::set<std::tuple<uint64_t, uint64_t>>& KG::get_attr_lite_tuples_by_ent(uint64_t ent_id) {
    if (!ent_attr_lite_mp.count(ent_id)) {
        return EMPTY_TWO_TUPLE_SET;
    }
    return ent_attr_lite_mp[ent_id];
}

std::set<uint64_t>& KG::get_ent_set() {
    return ent_set;
}

std::set<uint64_t>& KG::get_lite_set() {
    return lite_set;
}

std::set<uint64_t>& KG::get_rel_set() {
    return rel_set;
}

std::set<uint64_t>& KG::get_attr_set() {
    return attr_set;
}

double KG::get_functionality(uint64_t rel_id) {
    if (functionality_mp.empty()) {
        init_functionalities();
    }

    double functionality = 0.0;
    if (functionality_mp.count(rel_id)) {
        functionality = functionality_mp[rel_id];
    }
    return functionality;
}

double KG::get_inv_functionality(uint64_t rel_id) {
    if (inv_functionality_mp.empty()) {
        init_functionalities();
    }
    
    double inv_functionality = 0.0;
    if (inv_functionality_mp.count(rel_id)) {
        inv_functionality = inv_functionality_mp[rel_id];
    }
    return inv_functionality;
}

std::set<std::tuple<uint64_t, uint64_t, uint64_t>>& KG::get_relation_triples() {
    return relation_triples;
}

std::set<std::tuple<uint64_t, uint64_t, uint64_t>>& KG::get_attribute_triples() {
    return attribute_triples;
}


void KG::test() {
    init_functionalities();
    for (auto iter = inv_functionality_mp.begin(); iter != inv_functionality_mp.end(); ++iter) {
        std::cout<<"relation id: "<<iter -> first<<" inv-functionality: "<<iter -> second<<std::endl;
    }
}

void KG::init_functionalities() {
    std::unordered_map<uint64_t, uint64_t> rel_id_triple_num_mp;
    std::unordered_map<uint64_t, std::set<uint64_t>> rel_id_head_set;
    std::unordered_map<uint64_t, std::set<uint64_t>> rel_id_tail_set;
    for (auto iter = h_r_t_mp.begin(); iter != h_r_t_mp.end(); ++iter) {
        uint64_t head = iter -> first;
        std::set<std::pair<uint64_t, uint64_t>> rel_tail_set = iter -> second;
        for (auto sub_iter = rel_tail_set.begin(); sub_iter != rel_tail_set.end(); ++sub_iter) {
             uint64_t relation = sub_iter -> first;
             uint64_t tail = sub_iter -> second;
             if (!rel_id_triple_num_mp.count(relation)) {
                 rel_id_triple_num_mp[relation] = 0;
             }
             if (!rel_id_head_set.count(relation)) {
                 rel_id_head_set[relation] = std::set<uint64_t>();
             }
             if (!rel_id_tail_set.count(relation)) {
                 rel_id_tail_set[relation] = std::set<uint64_t>();
             }
             ++rel_id_triple_num_mp[relation];
             rel_id_head_set[relation].insert(head);
             rel_id_tail_set[relation].insert(tail);
        }
    }
    for (auto iter = rel_id_triple_num_mp.begin(); iter != rel_id_triple_num_mp.end(); ++iter) {
        uint64_t rel_id = iter -> first;
        uint64_t head_num = rel_id_head_set.count(rel_id) > 0 ? rel_id_head_set[rel_id].size() : 0;
        uint64_t tail_num = rel_id_tail_set.count(rel_id) > 0 ? rel_id_tail_set[rel_id].size() : 0;
        uint64_t total_num = rel_id_triple_num_mp.count(rel_id) ? rel_id_triple_num_mp[rel_id] : 0;
        double functionality = 0.0, inv_functionality = 0.0;
        if (total_num > 0) {
            functionality = ((double) head_num) / ((double) total_num);
            inv_functionality = ((double) tail_num) / ((double) total_num);
        }
        functionality_mp[rel_id] = functionality;
        inv_functionality_mp[rel_id] = inv_functionality;
    }

}

bool KG::is_embs_filled() {
    return !ent_emb_mp.empty();
}

bool KG::is_emb_empty(Eigen::VectorXd& emb) {
    return emb == KG::EMPTY_EMB;
}

void KG::clear_ent_embeds() {
    ent_emb_mp.clear();
}

void KG::set_ent_embed(uint64_t ent_id, Eigen::VectorXd &embeds) {
    ent_emb_mp[ent_id] = embeds;
}

Eigen::VectorXd& KG::get_ent_embed(uint64_t ent_id) {
    if (ent_emb_mp.count(ent_id)) {
        return ent_emb_mp[ent_id];
    }
    return EMPTY_EMB;
}


class EmbedEquiv {
public:
    EmbedEquiv(KG*, KG*, uint64_t);
    double get_emb_eqv(uint64_t, uint64_t);
    bool has_emb_eqv();
    void init(uint64_t);
private:
    KG *kg_a, *kg_b;
    uint64_t capacity;
    std::mutex cache_lock;
    std::unordered_map<std::pair<uint64_t, uint64_t>, double, pair_hash> cache;
    double calculate_emb_eqv(uint64_t, uint64_t);
};

EmbedEquiv::EmbedEquiv(KG* kg_a, KG* kg_b, uint64_t capacity) {
    this -> kg_a = kg_a;
    this -> kg_b = kg_b;
    this -> capacity = capacity;
    cache.reserve(capacity);
}

void EmbedEquiv::init(uint64_t capacity) {
    this -> capacity = capacity;
    cache.clear();
    cache.reserve(capacity);
}

bool EmbedEquiv::has_emb_eqv() {
    if (kg_a -> is_embs_filled() && kg_b -> is_embs_filled()) {
        return true;
    }
    return false;
}

double EmbedEquiv::calculate_emb_eqv(uint64_t id, uint64_t cp_id) {
    Eigen::VectorXd& emb_a = kg_a -> get_ent_embed(id);
    Eigen::VectorXd& emb_b = kg_b -> get_ent_embed(cp_id);

    if (KG::is_emb_empty(emb_a) || KG::is_emb_empty(emb_b)) {
        return 0.0;
    }

    double eqv = emb_a.dot(emb_b) / (emb_a.norm() * emb_b.norm());
    return eqv;
}

double EmbedEquiv::get_emb_eqv(uint64_t id, uint64_t cp_id) {
    double eqv = 0.0;
    if (cache_lock.try_lock()) {
        std::pair<uint64_t, uint64_t> cp_pair = std::make_pair(id, cp_id);
        if (cache.count(cp_pair)) {
            eqv = cache[cp_pair];
        } else {
            eqv = calculate_emb_eqv(id, cp_id);
        }
        if (cache.size() < capacity) {
            cache[cp_pair] = eqv;
        }
        cache_lock.unlock();
    } else {
        eqv = calculate_emb_eqv(id, cp_id);
        if (cache.size() < capacity) {
            if (cache_lock.try_lock()) {
                cache[std::make_pair(id, cp_id)] = eqv;
                cache_lock.unlock();
            }
        } 
    }
    return eqv;
}


class PARISEquiv {
public:
    PARISEquiv(KG*, KG*, PARISParams*);
    void update_lite_equiv(uint64_t, uint64_t, double);
    void update_ent_equiv(uint64_t, uint64_t, double);
    void update_rel_equiv(uint64_t, uint64_t, double);
    bool remove_forced_equiv(uint64_t, uint64_t);
    double get_ent_equiv(KG*, uint64_t, KG*, uint64_t);
    double get_rel_equiv(uint64_t, uint64_t);
    void insert_ongoing_rel_norm(std::unordered_map<uint64_t, double>&);
    void insert_ongoing_rel_deno(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>&);
    void insert_ongoing_ent_eqv(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>&);
    void update_rel_eqv_from_ongoing(int);
    void update_ent_eqv_from_ongoing(bool, double);
    void reset_ongoing_mp();
    void init_loaded_data(double);
    std::vector<std::tuple<uint64_t, uint64_t, double>>& get_ent_eqv_result();
    std::vector<std::tuple<uint64_t, uint64_t, double>> get_rel_eqv_result();
    std::vector<std::tuple<uint64_t, uint64_t, double>> get_forced_eqv_result();
    std::mutex rel_norm_lock;
    std::mutex rel_deno_lock;
    std::mutex ent_eqv_lock;
    std::vector<uint64_t>& get_kg_a_unaligned_ents();
    std::vector<uint64_t>& get_kg_b_unaligned_ents();
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>& get_lite_eqv_mp();
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>& get_forced_eqv_mp();
    std::unordered_map<uint64_t, double>* get_ent_cp_map_ptr(KG*, uint64_t);
private:
    KG *kg_a, *kg_b;
    PARISParams *paris_params;
    double get_entity_equiv(uint64_t, uint64_t);
    double get_literal_equiv(uint64_t, uint64_t);
    void init_unaligned_set();
    static double get_value_from_mp_mp(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>&, uint64_t, uint64_t);
    static void insert_value_to_mp_mp(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>&, uint64_t, uint64_t, double);
    static std::vector<std::tuple<uint64_t, uint64_t, double>> mp_mp_to_tuple(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>&);
    static std::unordered_map<uint64_t, double> EMPTY_EQV_MAP;
    std::vector<std::tuple<uint64_t, uint64_t, double>> ent_eqv_tuples;
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> forced_eqv_mp;
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> ent_eqv_mp;
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> rel_eqv_mp;
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> lite_eqv_mp;
    std::unordered_map<uint64_t, double> ongoing_rel_norm;
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> ongoing_rel_deno;
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> ongoing_ent_eqv_mp;
    std::vector<uint64_t> kg_a_unaligned_ents;
    std::vector<uint64_t> kg_b_unaligned_ents;
};

PARISEquiv::PARISEquiv(KG* kg_a, KG* kg_b, PARISParams* paris_params) {
    this -> kg_a = kg_a;
    this -> kg_b = kg_b;
    this -> paris_params = paris_params;

    uint64_t min_lite_num = std::min(kg_a -> get_lite_set().size(), kg_b -> get_lite_set().size());
    uint64_t reserve_space = (uint64_t) (0.2 * (double) min_lite_num);
    lite_eqv_mp.reserve(reserve_space);

    uint64_t kg_a_ent_num = kg_a -> get_ent_set().size();
    uint64_t kg_b_ent_num = kg_b -> get_ent_set().size();
    ent_eqv_mp.reserve(kg_a_ent_num + kg_b_ent_num);
    ongoing_ent_eqv_mp.reserve(kg_a_ent_num);

    uint64_t min_ent_num = std::min(kg_a_ent_num, kg_b_ent_num);
    ent_eqv_tuples.reserve(min_ent_num + 1);

    uint64_t kg_a_rel_num = kg_a -> get_rel_set().size();
    uint64_t kg_b_rel_num = kg_b -> get_rel_set().size();
    uint64_t kg_a_attr_num = kg_a -> get_attr_set().size();
    uint64_t kg_b_attr_num = kg_b -> get_attr_set().size();
    uint64_t total_rel_nums = kg_a_rel_num + kg_a_attr_num + kg_b_rel_num + kg_b_attr_num;
    rel_eqv_mp.reserve(total_rel_nums);

    ongoing_rel_norm.reserve(total_rel_nums);
    ongoing_rel_deno.reserve(total_rel_nums);
}

std::unordered_map<uint64_t, double> PARISEquiv::EMPTY_EQV_MAP = std::unordered_map<uint64_t, double>();

std::vector<uint64_t>& PARISEquiv::get_kg_a_unaligned_ents() {
    return kg_a_unaligned_ents;
}

std::vector<uint64_t>& PARISEquiv::get_kg_b_unaligned_ents() {
    return kg_b_unaligned_ents;
}

void PARISEquiv::update_lite_equiv(uint64_t lite_id_a, uint64_t lite_id_b, double prob) {
    insert_value_to_mp_mp(this -> lite_eqv_mp, lite_id_a, lite_id_b, prob);
}

void PARISEquiv::update_ent_equiv(uint64_t ent_id_a, uint64_t ent_id_b, double prob) {
    insert_value_to_mp_mp(this -> ent_eqv_mp, ent_id_a, ent_id_b, prob);
}

void PARISEquiv::update_rel_equiv(uint64_t rel_id_a, uint64_t rel_id_b, double prob) {
    insert_value_to_mp_mp(this -> rel_eqv_mp, rel_id_a, rel_id_b, prob);
}

bool PARISEquiv::remove_forced_equiv(uint64_t id_a, uint64_t id_b) {
    bool success = false;
    if (forced_eqv_mp.count(id_a)) {
        success = forced_eqv_mp[id_a].erase(id_b);
        if (forced_eqv_mp[id_a].empty()) {
            forced_eqv_mp.erase(id_a);
        }
    }
    return success;
}

double PARISEquiv::get_ent_equiv(KG* kg_a, uint64_t ent_id_a, KG* kg_b, uint64_t ent_id_b) {
    if (!kg_a -> is_literal(ent_id_a)) {
        return get_entity_equiv(ent_id_a, ent_id_b);
    }
    return get_literal_equiv(ent_id_a, ent_id_b);
}

double PARISEquiv::get_rel_equiv(uint64_t rel_id, uint64_t rel_cp_id) {
    return get_value_from_mp_mp(rel_eqv_mp, rel_id, rel_cp_id);
}

std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>& PARISEquiv::get_lite_eqv_mp() {
    return lite_eqv_mp;
}

std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>& PARISEquiv::get_forced_eqv_mp() {
    return forced_eqv_mp;
}

std::unordered_map<uint64_t, double>* PARISEquiv::get_ent_cp_map_ptr(KG *source, uint64_t ent_id) {
    if (source -> is_literal(ent_id)) {
        if (lite_eqv_mp.count(ent_id)) {
            return &lite_eqv_mp[ent_id];
        }
        return &EMPTY_EQV_MAP;
    } else {
        if (ent_eqv_mp.count(ent_id)) {
            return &ent_eqv_mp[ent_id];
        }
        return &EMPTY_EQV_MAP;
    }
}

void PARISEquiv::insert_ongoing_rel_norm(std::unordered_map<uint64_t, double>& rel_norm_map) {
    for (auto iter = rel_norm_map.begin(); iter != rel_norm_map.end(); ++iter) {
        uint64_t relation = iter -> first;
        double factor = iter -> second;
        ongoing_rel_norm[relation] += factor;
    }
}

void PARISEquiv::insert_ongoing_rel_deno(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>& rel_deno_map) {
    for (auto iter = rel_deno_map.begin(); iter != rel_deno_map.end(); ++iter) {
        uint64_t relation = iter -> first;
        std::unordered_map<uint64_t, double>& relation_cp_map = iter -> second;
        
        for (auto sub_iter = relation_cp_map.begin(); sub_iter != relation_cp_map.end(); ++sub_iter) {
            uint64_t relation_cp = sub_iter -> first;
            double factor = sub_iter -> second;
            
            if (!ongoing_rel_deno.count(relation)) {
                ongoing_rel_deno[relation] = std::unordered_map<uint64_t, double>();
            }
            ongoing_rel_deno[relation][relation_cp] += factor;
        }
    }
}

void PARISEquiv::insert_ongoing_ent_eqv(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>& ent_eqv_result) {
    for (auto iter = ent_eqv_result.begin(); iter != ent_eqv_result.end(); ++iter) {
        uint64_t ent_id = iter -> first;
        std::unordered_map<uint64_t, double>& ent_cp_map = iter -> second;

        for (auto sub_iter = ent_cp_map.begin(); sub_iter != ent_cp_map.end(); ++sub_iter) {
            uint64_t end_cp_id = sub_iter -> first;
            double prob = sub_iter -> second;
            if (!ongoing_ent_eqv_mp.count(ent_id)) {
                ongoing_ent_eqv_mp[ent_id] = std::unordered_map<uint64_t, double>();
            }
            ongoing_ent_eqv_mp[ent_id][end_cp_id] = prob;
        }
    }
}

void PARISEquiv::update_rel_eqv_from_ongoing(int norm_const) {
    rel_eqv_mp.clear();
    
    std::function<double(uint64_t)> get_rel_norm = [&](uint64_t rel_id) {
        double norm = 0.0;
        if (ongoing_rel_norm.count(rel_id)) {
            norm = ongoing_rel_norm[rel_id];
        }
        return norm;
    };

    for (auto iter = ongoing_rel_deno.begin(); iter != ongoing_rel_deno.end(); ++iter) {
        uint64_t relation = iter -> first;
        std::unordered_map<uint64_t, double>& rel_cp_map = iter -> second;
        double norm = get_rel_norm(relation) + norm_const;

        for (auto sub_iter = rel_cp_map.begin(); sub_iter != rel_cp_map.end(); ++sub_iter) {
            uint64_t relation_cp = sub_iter -> first;
            double prob = sub_iter -> second / norm;
            if (prob <= 0) {
                continue;
            }
            if (prob > 1.0) {
                prob = 1.0;
            }

            if (prob < paris_params -> REL_EQV_THRESHOLD) {
                continue;
            }

            if (!rel_eqv_mp.count(relation)) {
                rel_eqv_mp[relation] = std::unordered_map<uint64_t, double>();
            }
            rel_eqv_mp[relation][relation_cp] = prob;
        }
    }
}

void PARISEquiv::update_ent_eqv_from_ongoing(bool update_unaligned_ents, double threshold) {
    std::vector<std::tuple<uint64_t, uint64_t, double>> new_ent_eqv_tuples;
    std::unordered_set<uint64_t> visited;

    for (auto iter = ongoing_ent_eqv_mp.begin(); iter != ongoing_ent_eqv_mp.end(); ++iter) {
        uint64_t id = iter -> first;
        std::unordered_map<uint64_t, double>& cp_map = iter -> second;

        for (auto sub_iter = cp_map.begin(); sub_iter != cp_map.end(); ++sub_iter) {
            uint64_t cp_id = sub_iter -> first;
            double prob = sub_iter -> second;
            new_ent_eqv_tuples.emplace_back(std::make_tuple(id, cp_id, prob));
        }
    }

    for (auto iter = forced_eqv_mp.begin(); iter != forced_eqv_mp.end(); ++iter) {
        uint64_t id = iter -> first;
        if (!kg_a -> get_ent_set().count(id)) {
            continue;
        }

        std::unordered_map<uint64_t, double>& cp_map = iter -> second;

        for (auto sub_iter = cp_map.begin(); sub_iter != cp_map.end(); ++sub_iter) {
            uint64_t cp_id = sub_iter -> first;
            double prob = sub_iter -> second;
            new_ent_eqv_tuples.emplace_back(std::make_tuple(id, cp_id, prob));
        }
    }

    std::function<bool(std::tuple<uint64_t, uint64_t, double>&, std::tuple<uint64_t, uint64_t, double>&)> eqv_comp = 
    [](std::tuple<uint64_t, uint64_t, double>& a, std::tuple<uint64_t, uint64_t, double>& b) {
        return std::get<2>(a) > std::get<2>(b);
    };

    std::sort(new_ent_eqv_tuples.begin(), new_ent_eqv_tuples.end(), eqv_comp);

    ent_eqv_mp.clear();
    ent_eqv_tuples.clear();

    for (auto &eqv_tuple : new_ent_eqv_tuples) {
        uint64_t id = std::get<0>(eqv_tuple);
        uint64_t cp_id = std::get<1>(eqv_tuple);
        if (!visited.count(id) && !visited.count(cp_id)) {
            double prob = std::get<2>(eqv_tuple);
            if (prob < threshold) {
                continue;
            }
            update_ent_equiv(id, cp_id, prob);
            update_ent_equiv(cp_id, id, prob);
            ent_eqv_tuples.push_back(eqv_tuple);
            visited.insert(id);
            visited.insert(cp_id);
        }
    }

    if (update_unaligned_ents) {
        init_unaligned_set();
    }

}

void PARISEquiv::init_unaligned_set() {
    kg_a_unaligned_ents.clear();
    kg_b_unaligned_ents.clear();

    for (auto ent_id : kg_a -> get_ent_set()) {
        if (!ent_eqv_mp.count(ent_id)) {
            kg_a_unaligned_ents.push_back(ent_id);
        }
    }

    for (auto ent_id : kg_b -> get_ent_set()) {
        if (!ent_eqv_mp.count(ent_id)) {
            kg_b_unaligned_ents.push_back(ent_id);
        }
    }
}

void PARISEquiv::init_loaded_data(double threshold) {
    std::vector<std::tuple<uint64_t, uint64_t, double>> new_ent_eqv_tuples;
    std::unordered_set<uint64_t> visited;
    
    for (auto iter = ent_eqv_mp.begin(); iter != ent_eqv_mp.end(); ++iter) {
        uint64_t id = iter -> first;
        if (!kg_a -> get_ent_set().count(id)) {
            continue;
        }
        std::unordered_map<uint64_t, double>& cp_map = iter -> second;
        for (auto sub_iter = cp_map.begin(); sub_iter != cp_map.end(); ++sub_iter) {
            uint64_t cp_id = sub_iter -> first;
            double prob = sub_iter -> second;
            new_ent_eqv_tuples.emplace_back(std::make_tuple(id, cp_id, prob));
        }
    }

    std::function<bool(std::tuple<uint64_t, uint64_t, double>&, std::tuple<uint64_t, uint64_t, double>&)> eqv_comp = 
    [](std::tuple<uint64_t, uint64_t, double>& a, std::tuple<uint64_t, uint64_t, double>& b) {
        return std::get<2>(a) > std::get<2>(b);
    };

    std::sort(new_ent_eqv_tuples.begin(), new_ent_eqv_tuples.end(), eqv_comp);

    ent_eqv_mp.clear();
    ent_eqv_tuples.clear();

    for (auto &eqv_tuple : new_ent_eqv_tuples) {
        uint64_t id = std::get<0>(eqv_tuple);
        uint64_t cp_id = std::get<1>(eqv_tuple);
        if (!visited.count(id) && !visited.count(cp_id)) {
            double prob = std::get<2>(eqv_tuple);
            if (prob < threshold) {
                continue;
            }
            update_ent_equiv(id, cp_id, prob);
            update_ent_equiv(cp_id, id, prob);
            ent_eqv_tuples.push_back(eqv_tuple);
            visited.insert(id);
            visited.insert(cp_id);
        }
    }

    init_unaligned_set();
}

void PARISEquiv::reset_ongoing_mp() {
    ongoing_ent_eqv_mp.clear();
    ongoing_rel_deno.clear();
    ongoing_rel_norm.clear();
}

std::vector<std::tuple<uint64_t, uint64_t, double>>& PARISEquiv::get_ent_eqv_result() {
    return ent_eqv_tuples;
}

std::vector<std::tuple<uint64_t, uint64_t, double>> PARISEquiv::mp_mp_to_tuple(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>& mp) {
    std::vector<std::tuple<uint64_t, uint64_t, double>> result_tuples;
    
    for (auto iter = mp.begin(); iter != mp.end(); ++iter) {
        uint64_t id = iter -> first;
        std::unordered_map<uint64_t, double>& mapper = iter -> second;
        for (auto sub_iter = mapper.begin(); sub_iter != mapper.end(); ++sub_iter) {
            uint64_t cp_id = sub_iter -> first;
            double prob = sub_iter -> second;
            result_tuples.emplace_back(std::make_tuple(id, cp_id, prob));
        }
    }
    return result_tuples;
}

std::vector<std::tuple<uint64_t, uint64_t, double>> PARISEquiv::get_rel_eqv_result() {
    return mp_mp_to_tuple(rel_eqv_mp);
}

std::vector<std::tuple<uint64_t, uint64_t, double>> PARISEquiv::get_forced_eqv_result() {
    return mp_mp_to_tuple(forced_eqv_mp);
}

double PARISEquiv::get_value_from_mp_mp(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> &mp, uint64_t id_a, uint64_t id_b) {
    if (!mp.count(id_a)) {
        return 0.0;
    }
    if (!mp[id_a].count(id_b)) {
        return 0.0;
    }
    return mp[id_a][id_b];
}

void PARISEquiv::insert_value_to_mp_mp(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> &mp, uint64_t id_a, uint64_t id_b, double prob) {
    if (!mp.count(id_a)) {
        mp[id_a] = std::unordered_map<uint64_t, double>();
    }
    mp[id_a][id_b] = prob;
}

double PARISEquiv::get_entity_equiv(uint64_t entity_id_a, uint64_t entity_id_b) {
    return get_value_from_mp_mp(this -> ent_eqv_mp, entity_id_a, entity_id_b);
}

double PARISEquiv::get_literal_equiv(uint64_t literal_id_a, uint64_t literal_id_b) {
    return get_value_from_mp_mp(this -> lite_eqv_mp, literal_id_a, literal_id_b);
}

class PRModule {
public:
    PRModule(KG &, KG &);
    void update_ent_eqv(uint64_t, uint64_t, double, bool);
    void update_lite_eqv(uint64_t, uint64_t, double, bool);
    void update_rel_eqv(uint64_t, uint64_t, double, bool);
    void enable_rel_init(bool);
    void enable_emb_eqv(bool);
    void set_worker_num(int);
    void set_emb_cache_capacity(uint64_t);
    void set_ent_candidate_num(uint64_t);
    void set_rel_func_bar(double);
    void set_ent_eqv_bar(double);
    void set_rel_eqv_bar(double);
    void set_se_trade_off(double);
    void init_loaded_data();
    void init();
    void reset_emb_eqv();
    void run();
    bool remove_forced_eqv(uint64_t, uint64_t);
    std::vector<std::tuple<uint64_t, uint64_t, double>> & get_ent_eqv_result();
    std::vector<std::tuple<uint64_t, uint64_t, double>> get_rel_eqv_result();
    std::vector<std::tuple<uint64_t, uint64_t, double>> get_forced_eqv_result();
    std::vector<uint64_t>& get_kg_a_unaligned_ents();
    std::vector<uint64_t>& get_kg_b_unaligned_ents();
private:
    int iteration;
    bool enable_relation_init;
    PARISEquiv* paris_eqv;
    PARISParams* paris_params;
    EmbedEquiv* emb_eqv;
    KG *kg_a, *kg_b;
    SpinLock queue_lock;
    static void insert_value_to_mp_mp(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>&, uint64_t, uint64_t, double);
    double get_filtered_prob(uint64_t, uint64_t, double);
    bool is_rel_init();
    static void one_iteration_one_way_per_thread(PRModule*, std::queue<uint64_t> &, KG*, KG*, bool);
    void one_iteration_one_way(std::queue<uint64_t> &, KG*, KG*, bool);
    void one_iteration();
    void iterations();
};

PRModule::PRModule(KG &kg_a, KG &kg_b) {
    this -> kg_a = &kg_a;
    this -> kg_b = &kg_b;
    paris_params = new PARISParams();
    paris_eqv = new PARISEquiv(this -> kg_a, this -> kg_b, paris_params);
    emb_eqv = new EmbedEquiv(this -> kg_a, this -> kg_b, paris_params -> ENT_CANDIDATE_NUM);
    iteration = 0;
    enable_relation_init = true;
}

void PRModule::set_worker_num(int workers) {
    paris_params -> THREAD_NUM = workers;
}

void PRModule::set_emb_cache_capacity(uint64_t capacity) {
    paris_params -> MAX_EMB_EQV_CACHE_NUM = capacity;
}

void PRModule::enable_emb_eqv(bool flag) {
    paris_params -> ENABLE_EMB_EQV = flag;
}

void PRModule::set_ent_candidate_num(uint64_t num) {
    paris_params -> ENT_CANDIDATE_NUM = num;
}

void PRModule::set_se_trade_off(double trade_off) {
    paris_params -> EMB_EQV_TRADE_OFF = trade_off;
}

void PRModule::set_rel_func_bar(double threshold) {
    paris_params -> INV_FUNCTIONALITY_THRESHOLD = threshold;
}

void PRModule::set_ent_eqv_bar(double threshold) {
    paris_params -> ENT_EQV_THRESHOLD = threshold;
}

void PRModule::set_rel_eqv_bar(double threshold) {
    paris_params -> REL_EQV_THRESHOLD = threshold;
}

std::vector<uint64_t>& PRModule::get_kg_a_unaligned_ents() {
    return paris_eqv -> get_kg_a_unaligned_ents();
}


std::vector<uint64_t>& PRModule::get_kg_b_unaligned_ents() {
    return paris_eqv -> get_kg_b_unaligned_ents();
}

void PRModule::init() {
    kg_a -> init_functionalities();
    kg_b -> init_functionalities();

}

void PRModule::init_loaded_data() {
    paris_eqv -> init_loaded_data(paris_params -> ENT_EQV_THRESHOLD);
}

void PRModule::reset_emb_eqv() {
    emb_eqv -> init(paris_params -> MAX_EMB_EQV_CACHE_NUM);
    
}

void PRModule::insert_value_to_mp_mp(std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> &mp, uint64_t id_a, uint64_t id_b, double prob) {
    if (!mp.count(id_a)) {
        mp[id_a] = std::unordered_map<uint64_t, double>();
    }
    mp[id_a][id_b] = prob;
}

void PRModule::update_ent_eqv(uint64_t id_a, uint64_t id_b, double prob, bool forced) {
    if (forced) {
        insert_value_to_mp_mp(this -> paris_eqv -> get_forced_eqv_mp(), id_a, id_b, prob);
    } else {
        prob = get_filtered_prob(id_a, id_b, prob);
        paris_eqv -> update_ent_equiv(id_a, id_b, prob);
    }
}

void PRModule::update_lite_eqv(uint64_t id_a, uint64_t id_b, double prob, bool forced) {
    if (forced) {
        insert_value_to_mp_mp(this -> paris_eqv -> get_forced_eqv_mp(), id_a, id_b, prob);
    } else {
        prob = get_filtered_prob(id_a, id_b, prob);
        paris_eqv -> update_lite_equiv(id_a, id_b, prob);
    }
}

void PRModule::update_rel_eqv(uint64_t id_a, uint64_t id_b, double prob, bool forced) {
    if (forced) {
        insert_value_to_mp_mp(this -> paris_eqv -> get_forced_eqv_mp(), id_a, id_b, prob);
    } else {
        prob = get_filtered_prob(id_a, id_b, prob);
        paris_eqv -> update_rel_equiv(id_a, id_b, prob);
    }
}

bool PRModule::remove_forced_eqv(uint64_t id_a, uint64_t id_b) {
    return paris_eqv -> remove_forced_equiv(id_a, id_b);
}

void PRModule::enable_rel_init(bool flag) {
    enable_relation_init = flag;
}

std::vector<std::tuple<uint64_t, uint64_t, double>> & PRModule::get_ent_eqv_result() {
    return paris_eqv -> get_ent_eqv_result();
}

std::vector<std::tuple<uint64_t, uint64_t, double>> PRModule::get_rel_eqv_result() {
    return paris_eqv -> get_rel_eqv_result();
}

std::vector<std::tuple<uint64_t, uint64_t, double>> PRModule::get_forced_eqv_result() {
    return paris_eqv -> get_forced_eqv_result();
}

void PRModule::run() {
    iterations();
}

double PRModule::get_filtered_prob(uint64_t id_a, uint64_t id_b, double prob) {
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>>& forced_eqv_mp = paris_eqv -> get_forced_eqv_mp();
    if (forced_eqv_mp.count(id_a)) {
        if (forced_eqv_mp[id_a].count(id_b)) {
            prob = forced_eqv_mp[id_a][id_b];
        }
    }
    return prob;
}

bool PRModule::is_rel_init() {
    if (enable_relation_init) {
        if (iteration <= paris_params ->INIT_ITERATION) {
            return true;
        }
    }
    return false;
}

void PRModule::one_iteration_one_way_per_thread(PRModule* _this, std::queue<uint64_t>& ent_queue, KG* kg_l, KG* kg_r, bool ent_align) {
    uint64_t ent_id;
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> ent_eqv_result;
    std::unordered_map<uint64_t, double> ent_ongoing_eqv;
    std::unordered_map<uint64_t, double> rel_ongoing_norm_eqv;
    std::unordered_map<uint64_t, std::unordered_map<uint64_t, double>> rel_ongoing_deno_eqv;

    std::function<std::unordered_map<uint64_t, double>*(uint64_t)> get_cp_map_ptr = [&](uint64_t id) {
        std::unordered_map<uint64_t, double>* map_ptr;

        if (ent_eqv_result.count(id)) {
            map_ptr = &(ent_eqv_result[id]);
        } else {
            map_ptr = _this -> paris_eqv -> get_ent_cp_map_ptr(kg_l, id);
        }

        return map_ptr;
    };

    std::function<void(std::unordered_map<uint64_t, double>&, uint64_t, double)> register_ongoing_rel_eqv_deno 
    = [&](std::unordered_map<uint64_t, double>& mp, uint64_t cp_id, double prob) {
        if (!mp.count(cp_id)) {
            mp[cp_id] = 1.0;
        }
        mp[cp_id] *= (1.0 - prob);
    };

    std::function<void(uint64_t, uint64_t, uint64_t, double)> register_ongoing_ent_eqv = [&](uint64_t rel_id, uint64_t rel_cp_id, uint64_t head_cp_id, double tail_cp_eqv) {
        double rel_eqv_sub = _this -> paris_eqv -> get_rel_equiv (rel_id, rel_cp_id);
        double rel_eqv_sup = _this -> paris_eqv -> get_rel_equiv (rel_cp_id, rel_id);

        rel_eqv_sub /= _this -> paris_params -> PENALTY_VALUE;
        rel_eqv_sup /= _this -> paris_params -> PENALTY_VALUE;

        rel_eqv_sub = _this -> get_filtered_prob(rel_id, rel_cp_id, rel_eqv_sub);
        rel_eqv_sup = _this -> get_filtered_prob(rel_cp_id, rel_id, rel_eqv_sup);

        if (rel_eqv_sub < _this -> paris_params -> REL_EQV_THRESHOLD && rel_eqv_sup < _this -> paris_params -> REL_EQV_THRESHOLD) {
            if (_this -> is_rel_init()) {
                rel_eqv_sup = _this -> paris_params -> REL_INIT_EQV;
                rel_eqv_sub = _this -> paris_params -> REL_INIT_EQV;
            } else {
                return;
            }
        }

        double inv_functionality_l = kg_l -> get_inv_functionality(rel_id);
        double inv_functionality_r = kg_r -> get_inv_functionality(rel_cp_id);

        double factor = 1.0;

        if (inv_functionality_r >= 0.0 && rel_eqv_sub >= 0.0) {
            factor *= (1.0 - rel_eqv_sub * inv_functionality_r * tail_cp_eqv);
        }

        if (inv_functionality_l >= 0.0 && rel_eqv_sup >= 0.0) {
            factor *= (1.0 - rel_eqv_sup * inv_functionality_l * tail_cp_eqv);
        }


        if (1.0 - factor >= _this -> paris_params -> REL_EQV_FACTOR_THRESHOLD) {
            if (!ent_ongoing_eqv.count(head_cp_id)) {
                ent_ongoing_eqv[head_cp_id] = 1.0;
            }
            ent_ongoing_eqv[head_cp_id] *= factor;
        }

    };

    while (!ent_queue.empty()) {
        _this -> queue_lock.lock();
        if (!ent_queue.empty()) {
            ent_id = ent_queue.front();
            ent_queue.pop();
        } else {
            _this -> queue_lock.unlock();
            continue;
        }
        _this -> queue_lock.unlock();

        std::set<std::pair<uint64_t, uint64_t>>* rel_tail_pairs_ptr =  kg_l -> get_rel_tail_pairs_ptr(ent_id);
        std::unordered_map<uint64_t, double>* head_cp_ptr = get_cp_map_ptr(ent_id);


        for (auto iter = rel_tail_pairs_ptr -> begin(); iter != rel_tail_pairs_ptr -> end(); ++iter) {
            uint64_t relation = iter -> first;

            if (kg_l -> get_inv_functionality(relation) < _this -> paris_params -> INV_FUNCTIONALITY_THRESHOLD) {
                continue;
            }

            uint64_t tail = iter -> second;
            std::unordered_map<uint64_t, double>* tail_cp_ptr = get_cp_map_ptr(tail);

            double rel_ongoing_norm_factor = 1.0;
            std::unordered_map<uint64_t, double> rel_ongoing_deno_factor_map;

            for (auto tail_iter = tail_cp_ptr -> begin(); tail_iter != tail_cp_ptr -> end(); ++tail_iter) {
                uint64_t tail_cp = tail_iter -> first;
                double tail_eqv_prob = _this -> get_filtered_prob(tail, tail_cp, tail_iter -> second);

                if (tail_eqv_prob < _this -> paris_params -> ENT_EQV_THRESHOLD) {
                    continue;
                }

                for (auto head_iter = head_cp_ptr -> begin(); head_iter != head_cp_ptr -> end(); ++head_iter) {
                    uint64_t head_cp = head_iter -> first;
                    double head_eqv_prob = _this -> get_filtered_prob(ent_id, head_cp, head_iter -> second);
                    rel_ongoing_norm_factor *= (1.0 - head_eqv_prob * tail_eqv_prob);
                }

                std::set<std::pair<uint64_t, uint64_t>>* rel_ent_head_pairs_ptr = kg_r -> get_rel_ent_head_pairs_ptr(tail_cp);

                for (auto sub_iter = rel_ent_head_pairs_ptr -> begin(); sub_iter != rel_ent_head_pairs_ptr -> end(); ++sub_iter) {
                    uint64_t head_cp_candidate = sub_iter -> second;

                    uint64_t relation_cp_candidate = sub_iter -> first;

                    if (head_cp_ptr -> count(head_cp_candidate)) {
                        bool same_type = (kg_l -> is_attribute(relation)) == (kg_r -> is_attribute(relation_cp_candidate));
                        if (same_type) {
                            double eqv_prob = _this -> get_filtered_prob(ent_id, head_cp_candidate, (*head_cp_ptr)[head_cp_candidate]);
                            register_ongoing_rel_eqv_deno(rel_ongoing_deno_factor_map, relation_cp_candidate, tail_eqv_prob * eqv_prob);
                        } 
                    }
                    
                    if (ent_align) {
                        register_ongoing_ent_eqv(relation, relation_cp_candidate, head_cp_candidate, tail_eqv_prob);
                    }

                }
            }

            if (!rel_ongoing_norm_eqv.count(relation)) {
                rel_ongoing_norm_eqv[relation] = 0.0;
            }
            
            rel_ongoing_norm_eqv[relation] += 1.0 - rel_ongoing_norm_factor;

            for (auto deno_iter = rel_ongoing_deno_factor_map.begin(); deno_iter != rel_ongoing_deno_factor_map.end(); ++deno_iter) {
                uint64_t relation_cp_candidate = deno_iter -> first;
                double rel_eqv_deno = 1.0 - (deno_iter -> second);
                bool same_type = (kg_l -> is_attribute(relation)) == (kg_r -> is_attribute(relation_cp_candidate));
                if (!same_type) {
                    continue;
                }
                if (!rel_ongoing_deno_eqv.count(relation)) {
                    rel_ongoing_deno_eqv[relation] = std::unordered_map<uint64_t, double>();
                }
                rel_ongoing_deno_eqv[relation][relation_cp_candidate] += rel_eqv_deno;
            }

        }


        std::function<void()> update_ent_eqv = [&]() {
            std::vector<std::pair<uint64_t, double>> st1, st2;

            for (auto iter = ent_ongoing_eqv.begin(); iter != ent_ongoing_eqv.end(); ++iter) {
                uint64_t ent_cp_candidate = iter -> first;
                double ent_cp_eqv = 1.0 - (iter -> second);
                
                if (_this -> paris_params -> ENABLE_EMB_EQV && _this -> emb_eqv -> has_emb_eqv()) {
                    double trade_off = _this -> paris_params -> EMB_EQV_TRADE_OFF;
                    double emb_eqv = _this -> emb_eqv -> get_emb_eqv(ent_id, ent_cp_candidate);
                    ent_cp_eqv = (1.0 - trade_off) * ent_cp_eqv + trade_off * emb_eqv;    
                }

                if (ent_cp_eqv < 0.0) {
                    ent_cp_eqv = 0.0;
                }

                if (ent_cp_eqv > 1.0) {
                    ent_cp_eqv = 1.0;
                }

                ent_cp_eqv = _this -> get_filtered_prob(ent_id, ent_cp_candidate, ent_cp_eqv);
                
                while (!st1.empty() && st1.back().second < ent_cp_eqv) {
                    st2.emplace_back(st1.back());
                    st1.pop_back();
                }
                
                if (st1.size() < _this -> paris_params -> ENT_CANDIDATE_NUM) {
                    st1.emplace_back(std::make_pair(ent_cp_candidate, ent_cp_eqv));
                }
                
                while (st1.size() < _this -> paris_params -> ENT_CANDIDATE_NUM && !st2.empty()) {
                    st1.emplace_back(st2.back());
                    st2.pop_back();
                }
            }
            
            while (!st1.empty()) {
                if (!ent_eqv_result.count(ent_id)) {
                    ent_eqv_result[ent_id] = std::unordered_map<uint64_t, double>();
                }
                ent_eqv_result[ent_id][st1.back().first] = st1.back().second;
                st1.pop_back();
            }

            ent_ongoing_eqv.clear();
        }; 
        
        if (ent_align) {
            update_ent_eqv();
        }
    }
    
    bool has_updated_rel_norm = false, has_updated_rel_deno = false, has_update_ent_eqv = !ent_align;

    while (!(has_updated_rel_norm && has_updated_rel_deno && has_update_ent_eqv)) {
        if (!has_updated_rel_norm) {
            if (_this -> paris_eqv -> rel_norm_lock.try_lock()) {
                has_updated_rel_norm = true;
                _this -> paris_eqv -> insert_ongoing_rel_norm(rel_ongoing_norm_eqv);
                _this -> paris_eqv -> rel_norm_lock.unlock();
            }
        } else if (!has_updated_rel_deno) {
            if (_this -> paris_eqv -> rel_deno_lock.try_lock()) {
                has_updated_rel_deno = true;
                _this -> paris_eqv -> insert_ongoing_rel_deno(rel_ongoing_deno_eqv);
                _this -> paris_eqv -> rel_deno_lock.unlock();
            }
        } else if (!has_update_ent_eqv) {
            if (_this -> paris_eqv -> ent_eqv_lock.try_lock()) {
                has_update_ent_eqv = true;
                _this -> paris_eqv -> insert_ongoing_ent_eqv(ent_eqv_result);
                _this -> paris_eqv -> ent_eqv_lock.unlock();
            }
        }
    }

}

void PRModule::one_iteration_one_way(std::queue<uint64_t> &q, KG* kg_l, KG* kg_r, bool ent_align) {
    int thread_num = std::max(std::min(paris_params -> THREAD_NUM, paris_params -> MAX_THREAD_NUM), paris_params -> MIN_THREAD_NUM);
    std::vector<std::thread> threads;

    for (int i = 0; i < thread_num; ++i) {
        threads.push_back(std::thread(&PRModule::one_iteration_one_way_per_thread, this, std::ref(q), kg_l, kg_r, ent_align));
    }

    for (int i = 0; i < thread_num; ++i) {
        threads[i].join();
    }

}

void PRModule::one_iteration() {
    ++iteration;

    std::queue<uint64_t> ent_queue;
    std::function<void(KG *)> set_ent_queue = [&](KG* curr_kg) {
        while (!ent_queue.empty()) {
            ent_queue.pop();
        }
        
        std::set<uint64_t>& ent_set = curr_kg -> get_ent_set();
        std::vector<uint64_t> ents = std::vector<uint64_t>(ent_set.begin(), ent_set.end());
        std::random_device rd;
        std::mt19937 g(rd());
        std::shuffle(ents.begin(), ents.end(), g);

        for (uint64_t ent : ents) {
            ent_queue.push(ent);
        }
    };


    set_ent_queue(kg_a);
    one_iteration_one_way(ent_queue, kg_a, kg_b, true);

    bool update_unaligned_ents = iteration == paris_params -> MAX_ITERATION_NUM;
    paris_eqv -> update_ent_eqv_from_ongoing(update_unaligned_ents, paris_params -> ENT_EQV_THRESHOLD);

    set_ent_queue(kg_b);

    one_iteration_one_way(ent_queue, kg_b, kg_a, false);

    paris_eqv -> update_rel_eqv_from_ongoing(paris_params -> SMOOTH_NORM);

}

void PRModule::iterations() {
    iteration = 0;
    for (int i = 0; i < paris_params -> MAX_ITERATION_NUM; ++i) {
        one_iteration();
    }
}


PYBIND11_MODULE(prase_core, m)
{
    m.doc() = "Probabilistic Reasoning and Semantic Embedding";


    py::class_<KG>(m, "KG").def(py::init()).def("insert_rel_triple", &KG::insert_rel_triple)
    .def("insert_rel_inv_triple", &KG::insert_rel_inv_triple)
    .def("insert_attr_triple", &KG::insert_attr_triple)
    .def("insert_attr_inv_triple", &KG::insert_attr_inv_triple)
    .def("get_functionality", &KG::get_functionality)
    .def("get_inv_functionality", &KG::get_inv_functionality)
    .def("get_relation_triples", &KG::get_relation_triples)
    .def("get_attribute_triples", &KG::get_attribute_triples)
    .def("get_attr_frequency_mp", &KG::get_attr_frequency_mp)
    .def("get_ent_set", &KG::get_ent_set)
    .def("get_rel_set", &KG::get_rel_set)
    .def("get_lite_set", &KG::get_lite_set)
    .def("get_attr_set", &KG::get_attr_set)
    .def("set_ent_embed", &KG::set_ent_embed)
    .def("get_ent_embed", &KG::get_ent_embed)
    .def("clear_ent_embeds", &KG::clear_ent_embeds)
    .def("get_rel_ent_tuples_by_ent", &KG::get_rel_ent_tuples_by_ent)
    .def("get_attr_lite_tuples_by_ent", &KG::get_attr_lite_tuples_by_ent)
    .def("test", &KG::test)
    ;


    py::class_<PRModule>(m, "PRModule").def(py::init<KG&, KG&>())
    .def("init", &PRModule::init)
    .def("init_loaded_data", &PRModule::init_loaded_data)
    .def("update_ent_eqv", &PRModule::update_ent_eqv)
    .def("update_lite_eqv", &PRModule::update_lite_eqv)
    .def("update_rel_eqv", &PRModule::update_rel_eqv)
    .def("remove_forced_equiv", &PRModule::remove_forced_eqv)
    .def("set_worker_num", &PRModule::set_worker_num)
    .def("set_emb_cache_capacity", &PRModule::set_emb_cache_capacity)
    .def("set_se_trade_off", &PRModule::set_se_trade_off)
    .def("set_ent_candidate_num", &PRModule::set_ent_candidate_num)
    .def("set_rel_func_bar", &PRModule::set_rel_func_bar)
    .def("set_ent_eqv_bar", &PRModule::set_ent_eqv_bar)
    .def("set_rel_eqv_bar", &PRModule::set_rel_eqv_bar)
    .def("reset_emb_eqv", &PRModule::reset_emb_eqv)
    .def("enable_rel_init", &PRModule::enable_rel_init)
    .def("enable_emb_eqv", &PRModule::enable_emb_eqv)
    .def("get_kg_a_unaligned_ents", &PRModule::get_kg_a_unaligned_ents)
    .def("get_kg_b_unaligned_ents", &PRModule::get_kg_b_unaligned_ents)
    .def("run", &PRModule::run)
    .def("get_ent_eqv_result", &PRModule::get_ent_eqv_result)
    .def("get_rel_eqv_result", &PRModule::get_rel_eqv_result)
    .def("get_forced_eqv_result", &PRModule::get_forced_eqv_result)
    ;
}
