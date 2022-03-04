import pandas as pd
import os
HOME = os.path.expanduser("~") + "/"
import sys
sys.path.append(HOME + "ivpy/src")
from ivpy import *
from ivpy.reduce import pca,tsne,umap
from ivpy.extract import norm

print("reading data...")
df = pd.read_csv(HOME + "yente/src/assets/csv/tiles_clean.csv")
X = pd.read_csv(HOME + "yente/src/assets/csv/X_tiles_clean.csv")
print("[DONE]")

print("normalizing steerable pyramid features...")
X = norm(X)
print("[DONE]")

print("analyzing principal components...")
df[['xp','yp']] = pca(X,n_components=2)
print("[DONE]")

print("building t-SNE embedding...")
df[['xt','yt']] = tsne(X)
print("[DONE]")

print("building UMAP projection...")
df[['xu','yu']] = umap(X)
print("[DONE]")

def symnorm(col):
    colmin = min(col)
    colmax = max(col)
    colrange = colmax - colmin

    adjcol = [2 * ( (item - colmin) / colrange) - 1 for item in col]

    return adjcol

df['xpn'] = symnorm(df.xp)
df['ypn'] = symnorm(df.yp)

df['xtn'] = symnorm(df.xt)
df['ytn'] = symnorm(df.yt)

df['xun'] = symnorm(df.xu)
df['yun'] = symnorm(df.yu)

df.to_csv(HOME + "phenome/src/assets/csv/tiles_clean_reduce.csv",index=False)
