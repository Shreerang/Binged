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
  text-align: center;
}
</style>
