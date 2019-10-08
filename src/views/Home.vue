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
    const data = new Array(20000).fill(0).map((_, index) => ({
      node_key: index,
      value: index,
      parent_id: !index ? index : getRandomInt(index)
    }));
    return {
      data
    };
  }
}
</script>
