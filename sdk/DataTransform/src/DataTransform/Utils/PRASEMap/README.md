# PRASEMap 
A Probability Reasoning and Semantic Embedding-based Knowledge Graph Alignment System

The online demonstration is available at https://prasemap.qizhy.com/, which is also accepted by CIKM 2021. 

Z. Qi, Z. Zhang, et al., "[PRASEMap: A probabilistic reasoning and semantic embedding based knowledge graph alignment
system](https://dl.acm.org/doi/abs/10.1145/3459637.3481972 "PRASEMap: A probabilistic reasoning and semantic embedding based knowledge graph alignment
system")," in Proceedings of the 30th ACM International Conference on Information & Knowledge Management (CIKM), 2021,
pp. 4779–4783.

## Overview
We use C++ and Python to develop an open-source knowledge graph alignment system termed PRASEMap. 
### Architecture
The architecture is shown below. 

![](https://github.com/qizhyuan/PRASEMap/blob/58830dd9add8898f1adf39f406f4e87a538e810f/docs/architecture.png) 

There are two core modules in PRASEMap, i.e., Probability Reasoning (PR) Module and Semantic Embedding (SE) Module. PRASEMap absorbs the strengths of both the reasoning-based
and the embedding-based approaches and can also work in an unsupervised (fully automatic) mode. PRASEMap can also be performed in a semi-automatic mode that allows users to feed mapping annotations back such that the system can eventually output more complete and accurate mappings.

### Package
The packages of PRASEMap is presented below. 

	├─PRASEMap
	│  ├─pr: probability reasoning module
	│  ├─se: semantic embedding modules
	│  ├─prase: KG/KGs objects of PRASEMap
	│  ├─test: containing a test script
	│  └─utils: utilities of PRASEMap 


The pr package currently contains a famous reasoning-based knowledge alignment system termed PARIS. PARIS
was originally implemented in Java (http://webdam.inria.fr/paris/). To be compatible with many embedding-based KG alignment algorithms implemented in Python, we re-implement PARIS in C++ and create its Python bindings using the PyBind11 library.

The se package contains the embedding-based approaches (e.g., GCNAlign).

The prase package contains the KG/KGs classes used to wrap and manipulate KG/KGs.

The utils package contains several utilities (e.g., construct a KG object from file, save or load a PRASEMap model).

### PR and SE Modules
*The PR module has integrated the following reasoning-based systems:*

**PARIS:** PARIS: Probabilistic Alignment of Relations, Instances, and Schema. VLDB 2012.

*The SE module has integrated the following embedding-based models:*

**GCNAlign** Cross-lingual Knowledge Graph Alignment via Graph Convolutional Networks. EMNLP 2018.


## Installation
To install PRASEMap, you should install the following dependencies.

### Dependencies
To install the C++ libaray of PRASEMap, you should first download the C++ libraies that PRASEMap relies on.

- PyBind11: [https://github.com/pybind/pybind11](https://github.com/pybind/pybind11 "https://github.com/pybind/pybind11")

- Eigen: [https://eigen.tuxfamily.org/](https://eigen.tuxfamily.org/ "https://eigen.tuxfamily.org/")

Revise the pybind\_path and the eigen\_path in the file setup.py accordingly.

##### Other Dependencies

- Python 3.x
- TensorFlow 2.x
- Scipy
- Numpy

### Install
	python setup.py install

If there is a failure during compilation, please check the version of your C++ compiler. See the **Supported compilers** Section of [PyBind11](https://github.com/pybind/pybind11 "PyBind11").


## Usage
The pipline of PRASEMap is presented as follows.

- **[Step 1. Initialization]** Parse the KG files and constructs two KG objects that contain standardized relation and attribute triples.
- **[Step 2. Running PR]** The PR module receives the KG objects, and iteratively discovers cross-KG literal mappings, entity mappings, and relation mappings.
- **[Step 3. Running SE]** The SE module uses the entity mappings from the PR module as the seeds for training, and then calculates the entity embeddings and more entity mappings as the output.
- **[Step 4. Running PR]** The PR module is performed
again with the entity embeddings and mappings from the SE module.
Given a task, Step 1 and Step 2 are executed once, while Step 3 and Step 4 can be repeated for several times.

The following code shows how to use PRASEMap to perform a knowledge alignment task.

	import utils.PRASEUtils as pu

	kg1 = pu.construct_kg(kg1_rel_path, kg1_attr_path)
	kg2 = pu.construct_kg(kg2_rel_path, kg2_attr_path)
	kgs = pu.construct_kgs(kg1, kg2)
	kgs.set_pr_module(pr.PARIS)
	kgs.set_se_module(se.GCNAlign)
	kgs.init()
	kgs.run_pr()
	for i in range(iteration):
    	kgs.run_se(embedding_feedback=True, mapping_feedback=True)
    	kgs.run_pr()
	ent_mappings = kgs.get_ent_align_name_result()

The test package contains a simple example test script for evaluating PRASEMap on [MED-BBK-9K](https://github.com/ZihengZZH/industry-eval-EA "MED-BBK-9K") dataset. You can use the following command to test PRASEMap.
	
	python test.py  

For more configuations and functions of the PR module, please refer to pr/PARIS.py for details.

### Using External Libraries
PRASEMap is compatible to different embedding-based KG alignment approaches if they can output entity embeddings and entity mappings. Users can design and implement their SE module in se package. Users can also easily adopt other embedding-based implementations from external libraries, such as [OpenEA](https://github.com/nju-websoft/OpenEA "OpenEA"), or develop their own embedding-based KG alignment approaches. You can use the following steps to adopt other embedding-based approaches into PRASEMap.

- Construct KG and KGs objects, and then run PR module.
- Get the aligned mappings and unaligned mappings via get\_ent\_align\_name\_result(), get\_kg1\_unaligned\_candidate\_name(), and get\_kg2\_unaligned\_candidate\_name() of KGs. Use these to construct seed mappings and test data.
- Save the PRASEMap model.
- Train your embedding-based model on two knowledge graphs using seed mappings. 
- Predict the embedding-based model on the test data to get more entity mappings. Save the resultant entity mappings and the trained entity embeddings into files.
- Load the PRASEMap model.
- Load entity mappings using insert\_ent\_eqv\_both\_way\_by\_name(ent1\_name, ent2\_name, prob) of KGs. 
- Load entity embeddings using insert\_ent\_embed\_by\_name(ent\_name, ent\_embed) of KG.
- Run PR module again.
- ...   
