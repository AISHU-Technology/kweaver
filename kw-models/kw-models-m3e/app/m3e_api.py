import os.path
from typing import List
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from sklearn.preprocessing import PolynomialFeatures
from sentence_transformers import SentenceTransformer
import torch

router = APIRouter()
# 检测是否有GPU可用，如果有则使用cuda设备，否则使用cpu设备
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
if torch.cuda.is_available():
    print('====本次加载模型的设备为GPU:====', torch.cuda.get_device_name(0))
else:
    print('===本次加载模型的设备为CPU.===')
parent_dir = os.path.abspath(os.path.join(os.getcwd(), ".."))
embeddings_model = SentenceTransformer('models/m3e-base', device=device)


class EmbeddingRequest(BaseModel):
    texts: List[str]


def expand_features(embedding, target_length):
    poly = PolynomialFeatures(degree=2)
    expanded_embedding = poly.fit_transform(embedding.reshape(1, -1))
    expanded_embedding = expanded_embedding.flatten()
    if len(expanded_embedding) > target_length:
        # 如果扩展后的特征超过目标长度，可以通过截断或其他方法来减少维度
        expanded_embedding = expanded_embedding[:target_length]
    elif len(expanded_embedding) < target_length:
        # 如果扩展后的特征少于目标长度，可以通过填充或其他方法来增加维度
        expanded_embedding = np.pad(expanded_embedding, (0, target_length - len(expanded_embedding)))
    return expanded_embedding

@router.post("/v1/embeddings")
async def get_embeddings(request: EmbeddingRequest):
    # 计算嵌入向量
    embeddings = [embeddings_model.encode(text) for text in request.texts]
    # 如果嵌入向量的维度不为1536，则使用插值法扩展至1536维度 
    embeddings = [expand_features(embedding, 1536) if len(embedding) < 1536 else embedding for embedding in embeddings]
    # Min-Max normalization
    embeddings = [embedding / np.linalg.norm(embedding) for embedding in embeddings]
    # 将numpy数组转换为列表
    embeddings = [embedding.tolist() for embedding in embeddings]
    return embeddings
