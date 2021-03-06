<template>
  <div class="container" @scroll="scrollHandler" style="padding-left: 16px;">
    <div
      :style="
        `transform: translate(0px, 0px) translateZ(0px); height: ${scrollTop +
          800}px;`
      "
    >
      <div
        v-for="(item, index) in viewData"
        :key="`treeData_${item.node_id}`"
        :style="
          `position: absolute; width: 100%;height: 40px; line-height: 40px; transform: translate(0px, ${scrollTop +
            index * 40}px) translateZ(0px);`
        "
      >
        <div :style="`padding-left: ${item.level * 24}px;`">
          <span
            @click="toggleCollapse(item, !item.is_collapse)"
            v-if="!item.is_leaf"
            :style="
              `cursor: pointer; color: #0000ff; position: absolute; top: 1px; left: ${item.level *
                24 -
                10}px;`
            "
          >{{ !!item.is_collapse ? `▸` : `▾` }}</span>
          <input type="checkbox" />
          <span>__ id {{ item.node_id }}</span>
          <span
            @click="jump(item.parent_id)"
            :style="`cursor: pointer;`"
          >__ pid {{ item.parent_id }}</span>
          <span>__ level {{ item.level }}</span>
          <span>__ offset {{ item.offset }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

function clone(data: TreeNode[]): TreeNode[] {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    return data;
  }
}

function insertLeft(a: TreeNode[], item: TreeNode): boolean {
  for (let i = 0; i < a.length; i++) {
    if (item.parent_id === a[i].node_id) {
      item.level = a[i].level + 1;
      a.splice(i + 1, 0, item);
      return true;
    }
  }
  return false;
}

function insertToAll(
  left: TreeNode[],
  right: TreeNode[],
  item: TreeNode
): undefined {
  const pNode = findParent(right, item);
  if (!pNode) {
    item.level = 0;
    left.push(item);
  } else {
    if (!insertLeft(left, pNode)) {
      insertToAll(left, right, pNode);
    }
    insertLeft(left, item);
  }
  return undefined;
}

function findParent(right: TreeNode[], item: TreeNode): TreeNode | undefined {
  for (let i = 0, len = right.length; i < len; i++) {
    if (item.parent_id === right[i].node_id) {
      return right.splice(i, 1)[0];
    }
  }
  return undefined;
}

let itemHeight = 40;

interface TreeNode {
  node_id: number;
  value: number;
  parent_id: number;
  level: number;
  offset: number;
  is_collapse: boolean;
  loop: number;
  is_leaf: boolean;
}
interface TreeItem extends TreeNode {
  children: TreeItem[];
}

@Component
export default class HelloWorld extends Vue {
  @Prop() private data!: TreeNode[];
  private start: number = 0;
  private step: number = 19;
  private end: number = 19;
  private cacheSize: number = 30;
  private scrollTop: number = 0;

  private treeData: TreeNode[] = [];
  private renderData: TreeNode[] = [];
  private viewData: TreeNode[] = [];

  public getRenderData() {
    const copy: TreeNode[] = [];
    const treeData = this.treeData;
    for (let i = 0, len = treeData.length; i < len; ) {
      treeData[i].is_leaf = this.isLeaf(treeData[i], treeData[i + 1]);
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

  public isLeaf(pNode: TreeNode, cNode: TreeNode | undefined): boolean {
    if (cNode === undefined) {
      return true;
    }
    if (cNode.parent_id === pNode.node_id) {
      return false;
    }
    return true;
  }

  public getViewData() {
    return this.renderData.slice(this.start, this.end).map((val, index) => {
      val.offset = this.start + index;
      return val;
    });
  }
  public listToTree(data: TreeNode[]) {
    console.log("all: ", data.length);
    const right = clone(data);
    const left: TreeNode[] = [];

    while (right.length) {
      let item = right.shift();
      if (item === undefined) return left;
      if (item.parent_id === item.node_id) {
        // 脏数据
        item.level = 0;
        left.unshift(item);
        continue;
      }
      // root
      if (item.parent_id === null) {
        item.level = 0;
        left.unshift(item);
        continue;
      }
      if (!insertLeft(left, item)) {
        // console.log("right");
        insertToAll(left, right, item);
      }
    }
    return left;
  }

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

  public scrollHandler({ target }: { target: Element }) {
    const { scrollTop } = target;
    this.start = Math.floor(scrollTop / itemHeight);
    this.end = this.start + this.step;
    this.scrollTop = scrollTop;
    this.setViewData();
  }
  public jump(id: number) {
    let index = this.findOnRenderData(id);
    if (!~index) {
      index = this.findOnTreeData(id);
    }
    if (index - 10 < 0) {
      this.start = 0;
      this.end = this.step;
    } else if (index + 9 > this.renderData.length) {
      this.end = this.renderData.length - 1;
      this.start = this.renderData.length - this.step;
    } else {
      this.start = index - 10;
      this.end = index + 9;
    }
    this.scrollTop = this.start * itemHeight;
    this.setViewData();
  }
  public toggleCollapse(item: TreeNode, is_collapse: boolean) {
    for (let i = 0, len = this.treeData.length; i < len; i++) {
      if (item.node_id === this.treeData[i].node_id) {
        this.treeData[i].is_collapse = is_collapse;
        break;
      }
    }
    this.setRenderData();
  }

  public findOnTreeData(id: number): number {
    for (let i = 0, len = this.renderData.length; i < len; i++) {
      if (this.treeData[i].node_id === id) {
        let j = i;
        while (j--) {
          if (
            this.treeData[j].level < this.treeData[i].level &&
            this.treeData[j].is_collapse
          ) {
            return j;
          }
        }
        return j;
      }
    }
    return -1;
  }
  public findOnRenderData(id: number): number {
    for (let i = 0, len = this.renderData.length; i < len; i++) {
      if (this.renderData[i].node_id === id) {
        return i;
      }
    }
    return -1;
  }

  public setViewData() {
    this.viewData = this.getViewData();
  }

  public setRenderData() {
    this.renderData = this.getRenderData();
    this.setViewData();
  }

  public setTreeData() {
    console.time("listToTree");
    this.treeData = this.listToTree(this.data);
    console.timeEnd("listToTree");
    this.setRenderData();
  }
  public created() {
    this.setTreeData();
  }
}
</script>
<style lang="less">
.container {
  height: 760px;
  overflow: auto;
  text-align: left;
  background-color: #fafafa;
}
</style>
