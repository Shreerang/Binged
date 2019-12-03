<template>
  <section class="footer">
    <p class="copy">
      Made with ❤️and for fun by <a href="https://twitter.com/shreerangp">Shreerang Patwardhan</a>
    </p>
    <p class="copy">
      Data fetched from free API provided by <a href="https://www.themoviedb.org/">theMovieDB</a>
    </p>
  </section>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style>
.footer {
  padding: 0.5em;
}

.copy {
  font-size: 0.8em;
  text-align: center;
  margin: 5px 0;
}
</style>
