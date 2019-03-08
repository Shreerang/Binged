<template>
  <div class="nugget-grid-item">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'GridItem'
}
</script>

<style scoped>
.nugget-grid-item {
  padding: 10px;
  text-align: center;
}
</style>
