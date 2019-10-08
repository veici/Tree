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

function skip(a, item) {
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
    if (!skip(a, item)) {
      item.level = 0;
      a.push(item);
    }
  }
  return a;
}

[
  10000,
  11000,
  12000,
  13000,
  14000,
  15000,
  16000,
  17000,
  18000,
  19000,
  20000,
  30000,
  40000,
  50000,
  60000,
  70000,
  80000
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
