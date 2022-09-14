class DatasetProcessorInfo(object):
    '''Store the information about data processor,including GPU requests, cluster request, memory request and any other
    requests. '''
    def __init__(self,gpu_request:bool=False,cluster_request:bool=False,cpu_core:int = 2):
        self.gpu_request = gpu_request
        self.cluster_request = cluster_request
        self.cpu_core = cpu_core
