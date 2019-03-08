<template>
  <section>
    <div v-if="movies.length > 0">
      <Grid :columns="1">
        <GridItem>
          <p
            class="time-intro"
          >The approximate time you spent in 2018 watching various shows and movies on Netflix!</p>
          <p class="time">{{ convertMinutes(movies[movies.length - 1].totalTime) }}</p>
        </GridItem>
      </Grid>
      <Grid :columns="{xs: 3, sm: 4, md: 5, lg: 6}">
        <GridItem
          v-for="(item, index) in movies"
          :key="index">
          <img
            v-if="item.Poster"
            :src="item.Poster"
            alt="item.Title">
          <p
            v-if="!item.Poster && item.Title"
            class="no-img">
            {{ item.Title }}
          </p>
        </GridItem>
      </Grid>
    </div>
    <p>
      Steps to get your viewing history from Netflix!
    </p>
    <ol>
      <li>Go to <a href="https://www.netflix.com/browse">netflix.com</a></li>
      <li>Click on your profile</li>
      <li>Hower over your avatar icon in the top right corner</li>
      <li>Click on Account</li>
      <li>Scroll to the bottom until you see the "Viewing Activity". Click the link.</li>
      <li>You will see your viewing history; latest first. Scroll to the bottom and click on the "Download all" link.</li>
      <li>This will download a CSV file which you can upload here.</li>
    </ol>
    <Grid :columns="1">
      <GridItem>
        <input
          id="myfile"
          type="file"
          name="myfile"
          @change="uploadFile($event)">
      </GridItem>
    </Grid>
  </section>
</template>

<script>
import axios from 'axios'
import Grid from '~/components/Grid/Grid'
import GridItem from '~/components/Grid/GridItem'
export default {
  components: {
    Grid,
    GridItem
  },
  // asyncData({ params }) {
  //   return axios.get(`/api/random-movie`).then(res => {
  //     return { movies: res.data }
  //   })
  // },
  data() {
    return {
      movies: []
    }
  },
  methods: {
    convertMinutes(num) {
      const d = Math.floor(num / 1440) // 60*24
      const h = Math.floor((num - d * 1440) / 60)
      const m = Math.round(num % 60)

      if (d > 0) {
        return (
          d +
          (d > 1 ? ' days, ' : ' day, ') +
          h +
          (h > 1 ? ' hours, ' : ' hour, ') +
          m +
          ' minutes'
        )
      } else {
        return h + (h > 1 ? ' hours, ' : ' hour, ') + m + ' minutes'
      }
    },
    uploadFile($event) {
      const file = $event.target.files[0]
      const formData = new FormData()
      formData.append('myfile', file)
      const options = {
        header: {
          'Content-Type': 'multipart/form-data'
        }
      }
      const self = this
      return axios
        .post('/api/upload', formData, options)
        .then(function(response) {
          self.movies = response.data
        })
        .catch(function(error) {
          console.log(error)
        })
    }
  }
}
</script>

<style>
img {
  width: 100%;
}

.time-intro {
  font-size: 1em;
}

.time {
  font-weight: bold;
  font-size: 3em;
}

.no-img {
  font-size: 1em;
  font-weight: bold;
  background-color: #ddd;
  height: 100%;
  padding: 25px 0;
}
</style>
