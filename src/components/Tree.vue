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
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

function clone(data: TreeNode[]): TreeNode[] {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    return data;
  }
}

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

let itemHeight = 40;

interface TreeNode {
  node_key: number;
  value: number;
  parent_id: number;
  level: number;
  offset: number;
  is_collapse: boolean;
}
interface TreeItem {
  node_key: number;
  value: number;
  parent_id: number;
  level: number;
  offset: number;
  is_collapse: boolean;
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
    if (cNode.parent_id === pNode.node_key) {
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
    this.scrollTop = scrollTop;
    this.start = Math.floor(scrollTop / itemHeight);
    this.end = this.start + this.step;
    this.setViewData();
  }
  public toggleCollapse(item: TreeNode, is_collapse: boolean) {
    console.log({
      item,
      is_collapse
    });
    for (let i = 0, len = this.treeData.length; i < len; i++) {
      if (item.node_key === this.treeData[i].node_key) {
        this.treeData[i].is_collapse = is_collapse;
        break;
      }
    }
    this.setRenderData();
  }

  public setViewData() {
    this.viewData = this.getViewData();
  }

  public setRenderData() {
    this.renderData = this.getRenderData();
    this.setViewData();
  }

  public setTreeData() {
    this.treeData = this.listToTree(this.data);
    console.log(
      JSON.stringify(this.treeData.filter((_, index) => index < 5), null, 2)
    );
    this.setRenderData();
  }
  public created() {
    console.log(
      JSON.stringify(this.data.filter((_, index) => index < 10), null, 2)
    );
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
