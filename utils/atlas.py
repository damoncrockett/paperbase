import pandas as pd
from PIL import Image
import os, glob
HOME = os.path.expanduser("~") + "/"
import sys
sys.path.append(HOME + "ivpy/src")
from ivpy import *
import numpy as np
import math
import json

df = pd.read_csv(HOME + "phenome/src/assets/csv/tiles_clean_reduce.csv")

IMGDIR = HOME + "phenome/src/assets/json/img/"

for f in glob.glob(os.path.join(IMGDIR,"*.*")):
    try:
        os.remove(f)
    except Exception as e:
        print(e)

#-------------------------------------------------------------------------------

max_atlas = int(sys.argv[1])
thumb = int(sys.argv[2])
max_side = int( max_atlas / thumb )

def make_atlases(df,max_atlas,thumb):
    max_side = int( max_atlas / thumb )
    max_per_atlas = int( max_side * max_side )

    n = len(df)
    atlas_groups = math.ceil( n / max_per_atlas )
    group_list = list(np.repeat(range(atlas_groups),max_per_atlas))
    df['atlasgrp'] = group_list[:n]

    return df

df = make_atlases(df,max_atlas,thumb)

PRE = "/Volumes/expak/genome_texture/2021_PP_tiles_JPG/"
df['localpath_jpg'] = [PRE + '/'.join(item.split("/")[-2:])[:-4] + '.jpg' for item in df.localpath]

for atlasgrp in df.atlasgrp.unique():
    tmp = df[df.atlasgrp==atlasgrp]
    montage(tmp.localpath_jpg,thumb=thumb,shape='square').save(IMGDIR+str(atlasgrp)+'.jpg')

#-------------------------------------------------------------------------------

image_size = {"width": thumb, "height": thumb}
multiplier = int(sys.argv[3])
rcolx = sys.argv[4]
rcoly = sys.argv[5]

def create_vertices(tmp,i,ncols,multiplier):
    jitter_range = multiplier / 10
    jitter_increment = jitter_range / 100
    jitter = np.random.choice(np.arange(0,jitter_range,jitter_increment))

    if np.random.binomial(1,0.5)==1:
        jitter_sign = 1
    else:
        jitter_sign = -1

    coords = {
        "x":int(tmp[rcolx].iloc[i] * multiplier),
        "y":int(tmp[rcoly].iloc[i] * multiplier),
        "z":int(multiplier * -0.13) + (jitter * jitter_sign)
        }

    # remainder here gives you the column
    grid_x = i % ncols

    # this gives you the row
    # we subtract from max row position (nrows minus 1, and ncols==nrows) because in uv mapping high y vals go up not down
    grid_y = ( ncols - 1 ) - int( i / ncols )

    # we then multiply by the proportion of the atlas side that each individual image represents
    iprop = 1 / ncols
    uvgrid_x = iprop * grid_x
    uvgrid_y = iprop * grid_y

    vertices = [
      {
        "pos":[coords["x"],coords["y"],coords["z"]],
        "norm":[0,0,1],
        "uv":[uvgrid_x,uvgrid_y]
      },
      {
        "pos":[coords["x"]+image_size["width"],coords["y"],coords["z"]],
        "norm":[0,0,1],
        "uv":[uvgrid_x + iprop,uvgrid_y]
      },
      {
        "pos":[coords["x"]+image_size["width"],coords["y"]+image_size["height"],coords["z"]],
        "norm":[0,0,1],
        "uv":[uvgrid_x + iprop, uvgrid_y + iprop]
      },
      {
        "pos":[coords["x"]+image_size["width"],coords["y"]+image_size["height"],coords["z"]],
        "norm":[0,0,1],
        "uv":[uvgrid_x + iprop,uvgrid_y + iprop]
      },
      {
        "pos":[coords["x"],coords["y"]+image_size["height"],coords["z"]],
        "norm":[0,0,1],
        "uv":[uvgrid_x,uvgrid_y + iprop]
      },
      {
        "pos":[coords["x"],coords["y"],coords["z"]],
        "norm":[0,0,1],
        "uv":[uvgrid_x,uvgrid_y]
      },
    ]

    return vertices

#-------------------------------------------------------------------------------

JSONDIR = HOME + "phenome/src/assets/json/"

atlasgrps = []
for atlasgrp in df.atlasgrp.unique():
    tmp = df[df.atlasgrp==atlasgrp]
    n = len(tmp)
    ncols = math.ceil(np.sqrt(n))

    imgvertices = []
    for i in range(len(tmp)):
        vertices = create_vertices(tmp,i,ncols,multiplier)
        imgvertices.append(vertices)

    allpos = list(np.array([[i['pos'] for i in item] for item in imgvertices]).flatten())
    allnorm = list(np.array([[i['norm'] for i in item] for item in imgvertices]).flatten())
    alluv = list(np.array([[i['uv'] for i in item] for item in imgvertices]).flatten())

    d = {
    "pos":[int(item) for item in allpos],
    "norm":[int(item) for item in allnorm],
    "uv":[float(item) for item in alluv]
    }

    atlasgrps.append(d)

with open(JSONDIR + rcolx[1:] + ".json","w") as f:
    json.dump(atlasgrps,f)
