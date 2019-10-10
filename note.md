
# 存在巨量节点的树的渲染优化

### 背景

element-ui库中tree组件在渲染大量数据时会有明显的性能问题（渲染节点树巨大），居于现有业务需求，tree组件明显无法继续承担该任务

### 问题分析

element-ui的tree组件在实现时使用的是父子节点嵌套的结构实现,该实现在渲染相同节点树时无疑会增加额外的dom节点（跟父节点同级的孩子容器节点），且在组件化过程中一个节点为一个vue组件，这在大量节点时会创建大量vue实例，造成性能影响。

### 实现思路

树形结构的数据在横向显示时（一般也不会出现纵向树的展示要求）在dom节点上并不需要实现成树结构，大部分都将构建为长列表。故而大量节点的树渲染问题可转换为长列表的渲染问题。

### 技术实现

1. 处理列表数据

- 列表数据转换成具有树信息的列表

  后端返回的数据一般为只具有父信息的列表

  ```json
  [
    {
      "node_key": 0,
      "value": 0,
      "parent_id": 0,
      "is_collapse": false
    },
    {
      "node_key": 1,
      "value": 1,
      "parent_id": 0,
      "is_collapse": false
    },
    {
      "node_key": 2,
      "value": 2,
      "parent_id": 0,
      "is_collapse": false
    },
    {
      "node_key": 3,
      "value": 3,
      "parent_id": 1,
      "is_collapse": false
    },
    {
      "node_key": 4,
      "value": 4,
      "parent_id": 0,
      "is_collapse": true
    }
  ]
  ```
  将其转化为具有父子信息的列表，level标记层级

  ```json
  [
    {
      "node_key": 0,
      "value": 0,
      "parent_id": 0,
      "is_collapse": true,
      "level": 0
    },
    {
      "node_key": 1142,
      "value": 1142,
      "parent_id": 0,
      "is_collapse": true,
      "level": 1
    },
    {
      "node_key": 5889,
      "value": 5889,
      "parent_id": 1142,
      "is_collapse": false,
      "level": 2
    },
    {
      "node_key": 799,
      "value": 799,
      "parent_id": 0,
      "is_collapse": false,
      "level": 1
    },
    {
      "node_key": 5021,
      "value": 5021,
      "parent_id": 799,
      "is_collapse": false,
      "level": 2
    }
  ]
  ```
  代码如下

  ```js

  function insert(a: TreeNode[], item: TreeNode): boolean {
    for (let i = 0; i < a.length; i++) {
      if (item.parent_id === a[i].node_key) {
        item.level = a[i].level + 1;
        a.splice(i + 1, 0, item);
        return true;
      }
    }
    return false;
  }

   public listToTree(data: TreeNode[]) {
    const cd = clone(data);
    const a: TreeNode[] = [];
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
  ```

- 树结构数据转换成列表结构
 
  当返回的数据本身具备树形结构时只需简单的递归对其压平即可

  ```js
  public treeToList(data: TreeItem[]): TreeNode[] {
    let copy: TreeNode[] = [];
    for (let i = 0, len = data.length; i < len; i++) {
      if (data[i].children) {
        let child = data[i].children;
        delete data[i].children;
        copy[copy.length] = data[i];
        copy = copy.concat(this.treeToList(child));
      } else {
        copy[copy.length] = data[i];
      }
    }
    return copy;
  }
  ```

  至此，列表数据处理完成，接下来完成渲染即可

2. 数据渲染

  - 处理子节点展开收起

  可收起的父节点收起时其后的子孙节点都不渲染 (子孙level > 祖先level)

  ```js
    public getRenderData() {
    const copy: TreeNode[] = [];
    const treeData = this.treeData;
    for (let i = 0, len = treeData.length; i < len; ) {
      copy.push(treeData[i]);
      if (treeData[i].is_collapse) {
        let level = treeData[i].level;
        do {
          i += 1;
          if (i == len) break;
        } while (treeData[i].level > level); // after i
      } else {
        i++;
      }
    }
    return copy;
  }
  ```
  - 处理是否叶子节点

  ```js
    public isLeaf(pNode: TreeNode, cNode: TreeNode | undefined): boolean {
      if (cNode === undefined) {
        return true;
      }
      if (cNode.parent_id === pNode.node_key) {
        return false;
      }
      return true;
    }
  ```

- 获取可视区域数据

  ```js
  public getViewData() {
      return this.renderData.slice(this.start, this.end).map((val, index) => {
        val.offset = this.start + index;
        return val;
      });
    }
  ```

- 监听可视区域切换渲染数据

```js
  public scrollHandler({ target }: { target: Element }) {
    const { scrollTop } = target;
    this.scrollTop = scrollTop;
    this.start = Math.floor(scrollTop / itemHeight);
    this.end = this.start + this.step;
    this.setViewData();
  }
```
- 其他业务处理

  - 收起展开

  ```js
  public toggleCollapse(item: TreeNode, is_collapse: boolean) {
    for (let i = 0, len = this.treeData.length; i < len; i++) {
      if (item.node_key === this.treeData[i].node_key) {
        this.treeData[i].is_collapse = is_collapse;
        break;
      }
    }
    this.setRenderData();
  }
  ```

- 渲染可视区域

```html
<template>
  <div class="container" @scroll="scrollHandler">
    <div
      :style="
        `transform: translate(0px, 0px) translateZ(0px); height: ${scrollTop +
          800}px;`
      "
    >
      <div
        v-for="(item, index) in viewData"
        :key="`treeData_${item.node_key}`"
        :style="
          `cursor: pointer;position: absolute; width: 100%;height: 40px; line-height: 40px; transform: translate(0px, ${scrollTop +
            index * 40}px) translateZ(0px);`
        "
      >
        <div :style="`padding-left: ${item.level * 24}px;`">
          <span @click="toggleCollapse(item, !item.is_collapse)">
            {{
            !!item.is_collapse ? `>` : `√`
            }}
          </span>
          <input type="checkbox" />
          <span>__ id {{ item.node_key }}</span>
          <span>__ pid {{ item.parent_id }}</span>
          <span>__ level {{ item.level }}</span>
          <span>__ offset {{ item.offset }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 结语
综上，以这种方式实现的tree基本解决了大量节点的渲染问题，并可实现跳转到任意节点处的功能。当然，这也只是个原型级别的实现，具体功能还有很多需要实现。
另记录下已知的可以优化的点：

1. 列表数据转换成具有树信息的列表算法
2. dom节点复用