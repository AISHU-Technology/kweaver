import prase_core as pc


class PARIS:
    def __init__(self, kgs):
        self._pr = pc.PRModule(kgs.kg1.kg_core, kgs.kg2.kg_core)

    def init(self):
        """
            Initialize functionality of relations and attributes
        """
        self._pr.init()

    def run(self):
        """
            Run PARIS with 10 self-iterations
        """
        self._pr.run()

    def init_loaded_data(self):
        """
            Update entity mappings and unaligned candidate sets from loaded data
        """
        self._pr.init_loaded_data()

    def update_lite_eqv(self, lite_id, lite_cp_id, prob, force):
        """
            Add or update literal equivalent probability
        """
        self._pr.update_lite_eqv(lite_id, lite_cp_id, prob, force)

    def update_ent_eqv(self, ent_id, ent_cp_id, prob, force):
        """
            Add or update entity equivalent probability
            If force is True, the given probability will be frozen, and will not be updated by PARIS
        """
        self._pr.update_ent_eqv(ent_id, ent_cp_id, prob, force)

    def update_rel_eqv(self, rel_id, rel_cp_id, prob, force):
        """
            Add or update sub-relation equivalent probability
            If force is True, the given probability will be frozen, and will not be updated by PARIS
            As for sup-relation, swap the order of rel_id and rel_cp_id to update the probability
        """
        self._pr.update_rel_eqv(rel_id, rel_cp_id, prob, force)

    def remove_forced_eqv(self, idx_a, idx_b):
        """
            Remove the equivalent probability that has been updated with force being True
        """
        return self._pr.remove_forced_eqv(idx_a, idx_b)

    def get_kg_a_unaligned_ents(self):
        """
            Get the unaligned entities from KG1
        """
        return self._pr.get_kg_a_unaligned_ents()

    def get_kg_b_unaligned_ents(self):
        """
            Get the unaligned entities from KG2
        """
        return self._pr.get_kg_b_unaligned_ents()

    def reset_emb_eqv(self):
        """
            Reset cached embedding similarity results (Use if embeddings have been changed)
        """
        self._pr.reset_emb_eqv()

    def get_ent_eqv_result(self):
        """
            Get entity mappings
        """
        return self._pr.get_ent_eqv_result()

    def get_rel_eqv_result(self):
        """
            Get relation mappings
        """
        return self._pr.get_rel_eqv_result()

    def get_forced_eqv_result(self):
        """
            Get user delivered mappings with force being True
        """
        return self._pr.get_forced_eqv_result()

    def set_se_trade_off(self, tradeoff):
        """
            Set the tradeoff of the reasoning probability and the embedding similarity
            The default tradeoff is 0.1
        """
        self._pr.set_se_trade_off(tradeoff)

    def set_ent_candidate_num(self, candidate_num):
        """
            Set the candidate entity mapping number for each entity before matching
            The default candidate number is 1
        """
        self._pr.set_ent_candidate_num(candidate_num)

    def set_rel_func_bar(self, bar):
        """
            Set the inv-functionality threshold of relations and attributes
            The relation/attribute with low inv-functionality will not be used during the reasoning process
            Set a high threshold to accelerate reasoning
            The default value is 0.05
        """
        self._pr.set_rel_func_bar(bar)

    def set_worker_num(self, workers):
        """
            Set the number of threads used for performing PARIS
            The default number is determined by the number of concurrent threads supported by hardware
        """
        self._pr.set_worker_num(workers)

    def enable_rel_init(self, init):
        """
            Whether to give relations and attributes a small equivalent probability value for initialization
        """
        self._pr.enable_rel_init(init)
    
    def set_ent_eqv_bar(self, bar):
        """
            Set the threshold for entity mappings during reasoning
            The default value is 0.1
        """
        self._pr.set_ent_eqv_bar(bar)
    
    def set_rel_eqv_bar(self, bar):
        """
            Set the threshold for relation and attribute mappings during reasoning
            The default value is 0.1
        """
        self._pr.set_rel_eqv_bar(bar)
