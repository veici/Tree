<template>
  <div class="container" @scroll="scrollHandler">
    <div
      :style="
        `transform: translate(0px, 0px) translateZ(0px); height: ${scrollTop +
          800}px;`
      "
    >
      <div
        v-for="item in viewData"
        :key="`treeData_${item.node_key}`"
        :style="
          `position: absolute; width: 100%;height: 40px; line-height: 40px; transform: translate(0px, ${item.index *
            40}px) translateZ(0px);`
        "
      >
        <div :style="`padding-left: ${item.level * 24}px;`">
          {{ item.node_key }}: {{ item.parent_id }}--{{ item.level }}--{{
            item.index
          }}
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

function skip(a: TreeNode[], item: TreeNode): boolean {
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
  index: number;
}

@Component
export default class HelloWorld extends Vue {
  @Prop() private data!: TreeNode[];
  private start: number = 0;
  private step: number = 19;
  private end: number = 19;
  private cacheSize: number = 30;
  private scrollTop: number = 0;
  get viewData() {
    return this.getViewData();
  }
  get treeData() {
    console.time("listToTree");
    const a = this.listToTree(this.data);
    console.timeEnd("listToTree");
    return a;
  }

  public getViewData() {
    return this.treeData.slice(this.start, this.end).map((val, index) => {
      val.index = this.start + index;
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
      if (!skip(a, item)) {
        item.level = 0;
        a.push(item);
      }
    }
    return a;
  }
  public treeToList() {}

  public scrollHandler({ target }: { target: Element }) {
    const { scrollTop } = target;
    this.scrollTop = scrollTop;
    this.start = Math.floor(scrollTop / itemHeight);
    this.end = this.start + this.step;
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
