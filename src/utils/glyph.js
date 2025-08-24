import { valueCounts, uScale } from "./stats";
import { orderBy } from "lodash";
import { max, min } from "lodash";

// Radar used in InfoPanel, drawn by d3 instead of webGL

const d = {
  roughness: { lower: 0.005, upper: 0.373 },
  bstar_base: { lower: -6.13, upper: 31.45 },
  gloss: { lower: 0.19, upper: 123.55 },
  thickness: { lower: 0.11, upper: 0.458 },
};

export function polygonPoints(data, clickedItem, svgSide) {
  const p1 = uScale(
    d["bstar_base"]["lower"],
    d["bstar_base"]["upper"],
    data["dmin"][clickedItem]
  );
  const p2 = uScale(
    d["thickness"]["lower"],
    d["thickness"]["upper"],
    data["thickness"][clickedItem]
  );
  const p3 = uScale(
    d["roughness"]["lower"],
    d["roughness"]["upper"],
    data["roughness"][clickedItem]
  );
  const p4 =
    1 -
    uScale(
      d["gloss"]["lower"],
      d["gloss"]["upper"],
      data["gloss"][clickedItem]
    );

  const zeroPoint = svgSide / 2;

  const points = [
    // top (color)
    [zeroPoint, zeroPoint - zeroPoint * (isNaN(p1) ? 0 : p1)],
    // left (thickness)
    [zeroPoint - zeroPoint * (isNaN(p2) ? 0 : p2), zeroPoint],
    // bottom (roughness)
    [zeroPoint, zeroPoint + zeroPoint * (isNaN(p3) ? 0 : p3)],
    // right (matte-ness)
    [zeroPoint + zeroPoint * (isNaN(p4) ? 0 : p4), zeroPoint],
  ];

  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

// for making integer labels for character-variable groups, used in glyph group colors
export function makeGroupLabels(groupCol) {
  const groupColFiltered = groupCol.filter((d) => d !== "_");
  const valCounts = valueCounts(groupColFiltered);
  let valCountsList = [];
  Object.keys(valCounts).forEach((key) => {
    const scratchObject = {};
    scratchObject["groupValue"] = key;
    scratchObject["frequency"] = valCounts[key];
    valCountsList.push(scratchObject);
  });

  valCountsList = orderBy(valCountsList, "frequency", "desc");
  const mapGroupValueToInteger = {};
  valCountsList.forEach((d, i) => {
    mapGroupValueToInteger[d["groupValue"]] = i;
  });
  mapGroupValueToInteger["_"] = 9999;

  return groupCol.map((d) => mapGroupValueToInteger[d]);
}

/*groupMaps-------------------------------------------------------------------*/

/* These maps are dictionaries where the keys are groups and the values are
lists of global indices (i.e., positions in the `data` arrays)
*/

export function makeMap(data, groupArray, glyphGroup) {
  const groupMap = {};
  groupArray.forEach((item, i) => {
    const globalIndexArray = [];
    data[glyphGroup].forEach((groupValue, j) => {
      if (groupValue === item) {
        globalIndexArray.push(j);
      }
    });
    groupMap[item] = globalIndexArray;
  });
  return groupMap;
}

/*Radar-----------------------------------------------------------------------*/

const axisSteps = (binNumber, numBins) => {
  if (numBins === 4) {
    return binNumber === "0"
      ? 0.25 / 2
      : binNumber === "1"
      ? 0.5 / 2
      : binNumber === "2"
      ? 0.75 / 2
      : 1.0 / 2;
  } else if (numBins === 6) {
    // gloss is inverted
    return binNumber === "0"
      ? 1.0 / 2
      : binNumber === "1"
      ? 0.83 / 2
      : binNumber === "2"
      ? 0.66 / 2
      : binNumber === "3"
      ? 0.5 / 2
      : binNumber === "4"
      ? 0.33 / 2
      : 0.16 / 2;
  } else if (numBins === 8) {
    return binNumber === "0"
      ? 0.125 / 2
      : binNumber === "1"
      ? 0.25 / 2
      : binNumber === "2"
      ? 0.375 / 2
      : binNumber === "3"
      ? 0.5 / 2
      : binNumber === "4"
      ? 0.625 / 2
      : binNumber === "5"
      ? 0.75 / 2
      : binNumber === "6"
      ? 0.875 / 2
      : 1.0 / 2;
  } else if (numBins === 10) {
    return binNumber === "0"
      ? 0.1 / 2
      : binNumber === "1"
      ? 0.2 / 2
      : binNumber === "2"
      ? 0.3 / 2
      : binNumber === "3"
      ? 0.4 / 2
      : binNumber === "4"
      ? 0.5 / 2
      : binNumber === "5"
      ? 0.6 / 2
      : binNumber === "6"
      ? 0.7 / 2
      : binNumber === "7"
      ? 0.8 / 2
      : binNumber === "9"
      ? 0.9 / 2
      : 1.0 / 2;
  }
};

export function radarVertices(glyphGroup) {
  let [thick, gloss, color, rough] = glyphGroup.split("_");

  thick = axisSteps(thick, 4) * -1;
  rough = axisSteps(rough, 10) * -1;
  gloss = axisSteps(gloss, 6);
  color = axisSteps(color, 8);

  if (glyphGroup === "") {
    thick = 0;
    rough = 0;
    gloss = 0;
    color = 0;
  }

  const glyphThickness = 0.1;

  const thicktop = [thick, 0, glyphThickness];
  const thickbottom = [thick, 0, 0];
  const roughtop = [0, rough, glyphThickness];
  const roughbottom = [0, rough, 0];
  const glosstop = [gloss, 0, glyphThickness];
  const glossbottom = [gloss, 0, 0];
  const colortop = [0, color, glyphThickness];
  const colorbottom = [0, color, 0];

  const bottom = [
    thickbottom,
    glossbottom,
    colorbottom,
    roughbottom,
    glossbottom,
    thickbottom,
  ];
  const top = [thicktop, glosstop, colortop, roughtop, glosstop, thicktop];
  const upperLeft = [
    colorbottom,
    thicktop,
    colortop,
    colorbottom,
    thickbottom,
    thicktop,
  ];
  const upperRight = [
    glossbottom,
    colortop,
    glosstop,
    glossbottom,
    colorbottom,
    colortop,
  ];
  const lowerLeft = [
    thickbottom,
    roughtop,
    thicktop,
    thickbottom,
    roughbottom,
    roughtop,
  ];
  const lowerRight = [
    roughbottom,
    glosstop,
    roughtop,
    roughbottom,
    glossbottom,
    glosstop,
  ];

  const rawVertices = [
    bottom,
    top,
    upperLeft,
    upperRight,
    lowerLeft,
    lowerRight,
  ];
  return new Float32Array(rawVertices.flat(2));
}

export function radarNormals(glyphGroup) {
  let [thick, gloss, color, rough] = glyphGroup.split("_");

  thick = axisSteps(thick, 4) * -1;
  rough = axisSteps(rough, 10) * -1;
  gloss = axisSteps(gloss, 6);
  color = axisSteps(color, 8);

  const rawNormals = [
    [0, 0, -1],
    [0, 0, -1],
    [0, 0, -1],
    [0, 0, -1],
    [0, 0, -1],
    [0, 0, -1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [-1 * color, thick, 0],
    [-1 * color, thick, 0],
    [-1 * color, thick, 0],
    [-1 * color, thick, 0],
    [-1 * color, thick, 0],
    [-1 * color, thick, 0],
    [color, gloss, 0],
    [color, gloss, 0],
    [color, gloss, 0],
    [color, gloss, 0],
    [color, gloss, 0],
    [color, gloss, 0],
    [rough, thick, 0],
    [rough, thick, 0],
    [rough, thick, 0],
    [rough, thick, 0],
    [rough, thick, 0],
    [rough, thick, 0],
    [-1 * rough, -1 * gloss, 0],
    [-1 * rough, -1 * gloss, 0],
    [-1 * rough, -1 * gloss, 0],
    [-1 * rough, -1 * gloss, 0],
    [-1 * rough, -1 * gloss, 0],
    [-1 * rough, -1 * gloss, 0],
  ];
  return new Float32Array(rawNormals.flat());
}
