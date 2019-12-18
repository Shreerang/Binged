<template>
  <section class="content">
    <div v-if="movies.length > 0">
      <Grid :columns="1">
        <GridItem>
          <p class="time">{{ convertMinutes(movies[movies.length - 1].totalTime) }}</p>
          <social-sharing
            :description="'I spent ' + convertMinutes(movies[movies.length - 1].totalTime) + '. watching @netflix' + ' 📺 ' + 'Checkout how much you Binged at https://binged.herokuapp.com'"
            :title="'I spent ' + convertMinutes(movies[movies.length - 1].totalTime) + '. watching @netflix' + ' 📺 ' + 'Checkout how much you Binged at https://binged.herokuapp.com'"
            :quote="'I spent ' + convertMinutes(movies[movies.length - 1].totalTime) + '. watching @netflix' + ' 📺 ' + 'Checkout how much you Binged at https://binged.herokuapp.com'"
            url = "https://binged.herokuapp.com"
            hashtags="binged, netflix, 2019"
            inline-template>
            <div>
              <network network="facebook">
                <span style="font-size: 1.5em; color: #3b5998; padding: 0 10px;">
                  <i
                    class="fab fa-facebook-f"
                    onclick="ga(‘send’, ‘event’, 'Social Share', 'Facebook Share');" />
                </span>
              </network>
              <network network="pinterest">
                <span style="font-size: 1.5em; color: #bd081c; padding: 0 10px;">
                  <i
                    class="fab fa-pinterest-p"
                    onclick="ga(‘send’, ‘event’, 'Social Share', 'Pinterest Share');" />
                </span>
              </network>
              <network network="reddit">
                <span style="font-size: 1.5em; color: #ff4500; padding: 0 10px;">
                  <i
                    class="fab fa-reddit-alien"
                    onclick="ga(‘send’, ‘event’, 'Social Share', 'Reddit Share');" />
                </span>
              </network>
              <network network="twitter">
                <span style="font-size: 1.5em; color: #55acee; padding: 0 10px;">
                  <i
                    class="fab fa-twitter"
                    onclick="ga(‘send’, ‘event’, 'Social Share', 'Twitter Share');" />
                </span>
              </network>
              <network network="whatsapp">
                <span style="font-size: 1.5em; color: #43d854; padding: 0 10px;">
                  <i
                    class="fab fa-whatsapp"
                    onclick="ga(‘send’, ‘event’, 'Social Share', 'Whatsapp Share');" />
                </span>
              </network>
            </div>
          </social-sharing>
        </GridItem>
      </Grid>
      <Grid :columns="{xs: 3, sm: 4, md: 5, lg: 6}">
        <GridItem
          v-for="(item, index) in movies"
          :key="index">
          <img
            v-if="item.Poster"
            :src="item.Poster"
            :alt="item.Title">
          <p
            v-if="!item.Poster && item.Title"
            class="no-img">
            {{ item.Title }}
          </p>
        </GridItem>
      </Grid>
    </div>
    <p class="instructions">
      Do you feel like you spend a lot of time watching <span class="hashtag">#Netflix</span>? If yes, then it's time to find out exactly how much!
    </p>
    <br>
    <p class="instructions">
      Steps to get your viewing history from Netflix!
    </p>
    <ol>
      <li>Go to <a
        href="https://www.netflix.com/browse"
        onclick="ga(‘send’, ‘event’, 'Netflix', 'Redirect');"
        target="_blank">netflix.com</a></li>
      <li>Click on your profile</li>
      <li>Hover over your avatar icon in the top right corner</li>
      <li>Click on Account</li>
      <li>Scroll to the bottom until you see "Viewing Activity". Click the link.</li>
      <li>You will see your viewing history; latest first. Scroll to the bottom and click on the "Download all" link.</li>
      <li>This will download a CSV file which you can upload here.</li>
    </ol>
    <Grid :columns="{xs: 1, sm: 3, md: 3, lg: 3}">
      <GridItem>
        &nbsp;
      </GridItem>
      <GridItem>
        <input
          id="myfile"
          type="file"
          name="myfile"
          @change="uploadFile($event)">
      </GridItem>
      <GridItem>
        &nbsp;
      </GridItem>
    </Grid>
    <Grid
      :columns="1"
      style="padding: 15px 0">
      <GridItem>
        <rise-loader
          :color="`#42b983`"
          :loading="spinner"
          :size="20" />
      </GridItem>
    </Grid>
  </section>
</template>

<script>
import axios from 'axios'
import Grid from '~/components/Grid/Grid'
import GridItem from '~/components/Grid/GridItem'
import { RiseLoader } from '@saeris/vue-spinners'
import SocialSharing from 'vue-social-sharing'

export default {
  head() {
    return {
      title:
        'Binged' +
        ' - ' +
        ' Know how much time you have spent watching Netflix in 2019',
      meta: [
        {
          charset: 'utf-8'
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        },
        {
          name: 'keywords',
          content:
            'Netflix, Binged, binge watch, binge watching, resolutions 2020'
        },
        {
          name: 'description',
          content:
            'If you are making your resolutions for 2020 and think that you spend' +
            ' a lot of time watching Netflix and want to reduce your screen time in 2020,' +
            ' know exactly how much time you spent binge watching movies and series on Netflix.'
        },
        {
          property: 'og:image',
          content: '/Binged.png'
        }
      ],
      script: [
        {
          src: 'https://kit.fontawesome.com/b265f8faad.js'
        }
      ]
    }
  },
  components: {
    Grid,
    GridItem,
    RiseLoader,
    SocialSharing
  },
  data() {
    return {
      movies: [],
      spinner: false
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
      self.spinner = true
      return axios
        .post('/api/upload', formData, options)
        .then(function(response) {
          self.movies = response.data
          self.spinner = false
        })
        .catch(function(error) {
          console.log(error)
        })
    }
  }
}
</script>

<style>
.content {
  min-height: calc(100vh - 76px - 106px);
}

img {
  width: 100%;
}

.time-intro {
  font-size: 1em;
}

.time {
  font-weight: bold;
  font-size: 3em;
  color: #42b983;
}

.no-img {
  font-size: 1em;
  font-weight: bold;
  background-color: #ddd;
  height: 100%;
  padding: 25px 0;
}

.instructions {
  padding: 0 10px;
}

input[type='file'] {
  border: solid 1px #42b983;
  padding: 10px 10px;
}

p.instructions,
ol {
  max-width: 600px;
  margin: 0 auto;
}

.hashtag {
  font-weight: bold;
  color: #42b983;
}
</style>
