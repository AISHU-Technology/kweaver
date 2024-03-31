from common.errorcode.errors.graph_error import errDict as graphErrors
from common.errorcode.errors.graphdb_error import errDict as graphdbErrors
from common.errorcode.errors.lexicon_error import errDict as lexiconErrors
from common.errorcode.errors.intelligence_error import errDict as intelligenceErrors
from common.errorcode.errors.network_error import errDict as networkErrors
from common.errorcode.errors.ontology_error import errDict as ontologyErrors
from common.errorcode.errors.subgraph_error import errDict as subgraphErrors
from common.errorcode.errors.celery_error import errDict as celeryErrors
from common.errorcode.errors.function_error import errDict as functionErrors
from common.errorcode.errors.data_source_error import errDict as dataSourceErrors
from common.errorcode.errors.taxonomy_error import errDict as taxonomyErrors



errDict = {}
errDict.update(graphErrors)
errDict.update(graphdbErrors)
errDict.update(lexiconErrors)
errDict.update(intelligenceErrors)
errDict.update(networkErrors)
errDict.update(ontologyErrors)
errDict.update(subgraphErrors)
errDict.update(celeryErrors)
errDict.update(functionErrors)
errDict.update(dataSourceErrors)
errDict.update(taxonomyErrors)

