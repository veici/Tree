<template>
  <div class="home">
    <Tree :data="data" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Tree from "@/components/Tree.vue"; // @ is an alias to /src

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

@Component({
  components: {
    Tree
  }
})
export default class Home extends Vue {
  data() {
    let lenth = 10000;
    const data = new Array(lenth).fill(0).map((_, index) => ({
      node_id: index,
      value: index,
      parent_id: !index ? null : getRandomInt(index),
      is_collapse: false // Math.random() > 0.7
    }));
    return {
      data
    };
  }
}
</script>

<style lang="less" scoped>
.home {
  margin: 0 24px;
}
</style>
