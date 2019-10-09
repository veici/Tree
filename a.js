function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function clone(data) {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    return data;
  }
}

function insert(a, item) {
  for (let i = 0; i < a.length; i++) {
    if (item.parent_id === a[i].node_key) {
      item.level = a[i].level + 1;
      a.splice(i + 1, 0, item);
      return true;
    }
  }
  return false;
}
function listToTree(data) {
  const cd = clone(data);
  const a = [];
  while (cd.length) {
    let item = cd.shift();
    if (item === undefined) return a;
    if (!item.parent_id && !item.node_key) {
      item.level = 0;
      a.unshift(item);
      continue;
    }
    if (!insert(a, item)) {
      item.level = 0;
      a.push(item);
    }
  }
  return a;
}

[
  10 * 1e3,
  11 * 1e3,
  12 * 1e3,
  13 * 1e3,
  14 * 1e3,
  15 * 1e3,
  16 * 1e3,
  17 * 1e3,
  18 * 1e3,
  19 * 1e3,
  20 * 1e3,
  30 * 1e3,
  40 * 1e3,
  50 * 1e3,
  60 * 1e3,
  70 * 1e3,
  80 * 1e3,
  90 * 1e3,
  100 * 1e3
].forEach(val => {
  const data = new Array(val).fill(0).map((_, index) => ({
    node_key: index,
    value: index,
    parent_id: !index ? index : getRandomInt(index)
  }));
  console.time(`${val}`);
  listToTree(data);
  console.timeEnd(`${val}`);
});
