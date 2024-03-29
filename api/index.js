const express = require('express')
const multer = require('multer')
const bodyParser = require('body-parser')
const ndjson = require('ndjson')
const upload = multer({ dest: 'tmp/csv' })
const app = express()
const fs = require('fs')
const movies = []
const tv = []

// Parse the Movies JSON and create an in-memory object
fs.createReadStream(__dirname + '/movie_ids.json')
  .pipe(ndjson.parse())
  .on('data', function(obj) {
    movies.push(obj)
  })

// Parse the TV JSON and create an in-memory object
fs.createReadStream(__dirname + '/tv_ids.json')
  .pipe(ndjson.parse())
  .on('data', function(obj) {
    tv.push(obj)
  })

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const extendTimeoutMiddleware = (req, res, next) => {
  const space = ' '
  let isFinished = false
  let isDataSent = false

  // Only extend the timeout for API requests
  if (!req.url.includes('/upload')) {
    next()
    return
  }

  res.once('finish', () => {
    isFinished = true
  })

  res.once('end', () => {
    isFinished = true
  })

  res.once('close', () => {
    isFinished = true
  })

  res.on('data', data => {
    // Look for something other than our blank space to indicate that real
    // data is now being sent back to the client.
    if (data !== space) {
      isDataSent = true
    }
  })

  const waitAndSend = () => {
    setTimeout(() => {
      // If the response hasn't finished and hasn't sent any data back....
      if (!isFinished && !isDataSent) {
        // Need to write the status code/headers if they haven't been sent yet.
        if (!res.headersSent) {
          res.writeHead(202)
        }

        res.write(space)
        // Wait another 15 seconds
        waitAndSend()
      }
    }, 15000)
  }

  waitAndSend()
  next()
}

app.use(extendTimeoutMiddleware)

app.post('/upload', upload.single('myfile'), (req, res, next) => {
  const csv = require('csv-parser')
  const results = []
  const skimmedResults = []
  const finalResult = []
  const file = req.file

  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', d => {
      if (
        typeof d.Date === 'string' &&
        (d.Date.split('/')[0] >= '3' && d.Date.split('/')[0] <= '5') &&
        d.Date.split('/')[2] === '20'
      ) {
        results.push(d)
      }
    })
    .on('end', async () => {
      results.map(item => {
        if (item.Title.indexOf(': Season') > 0) {
          skimmedResults.push(item.Title.split(': Season')[0])
        } else if (item.Title.indexOf(': Series') > 0) {
          skimmedResults.push(item.Title.split(': Series')[0])
        } else if (item.Title.indexOf(': Part') > 0) {
          skimmedResults.push(item.Title.split(': Part')[0])
        } else if (item.Title.indexOf(': Episode') > 0) {
          skimmedResults.push(item.Title.split(': Episode')[0])
        } else if (item.Title.indexOf(': Volume') > 0) {
          skimmedResults.push(item.Title.split(': Volume')[0])
        } else if (item.Title.indexOf(': Limited Series') > 0) {
          skimmedResults.push(item.Title.split(': Limited Series')[0])
        } else if (item.Title.indexOf(': Limited Series') > 0) {
          skimmedResults.push(item.Title.split(': Limited Series')[0])
        } else {
          skimmedResults.push(item.Title)
        }
      })
      skimmedResults.sort()
      var current = null
      var cnt = 0
      var movie_tv_id = ''
      var movie_tv_type = ''
      var movie_cnt = 0
      var tv_cnt = 0

      const jsonHasKeyVal = (json, keyname, value) =>
        JSON.stringify(json.find(obj => obj[keyname] === value))

      for (var i = 0; i < skimmedResults.length; i++) {
        if (skimmedResults[i] != current) {
          if (cnt > 0 && movie_tv_type !== '' && movie_tv_id !== '') {
            console.log('ID is:', movie_tv_id)
            finalResult.push({
              Title: current,
              show_id: movie_tv_id,
              media_type: movie_tv_type,
              Count: cnt
            })
          }
          cnt = 1
          current = skimmedResults[i]
          let movie_obj = jsonHasKeyVal(movies, 'original_title', current)
          let movie_tv_obj = movie_obj
            ? movie_obj
            : jsonHasKeyVal(tv, 'original_name', current)

          if (movie_obj !== undefined) {
            movie_tv_id = JSON.parse(movie_obj)['id']
            movie_tv_type = 'movie'
            movie_cnt = movie_cnt + 1
          } else if (movie_tv_obj !== undefined) {
            movie_tv_id = JSON.parse(movie_tv_obj)['id']
            movie_tv_type = 'tv'
            tv_cnt = tv_cnt + 1
          } else {
            movie_tv_type = ''
            movie_tv_id = ''
          }
        } else {
          cnt++
        }
      }
      if (cnt > 0 && movie_tv_type !== '' && movie_tv_id !== '') {
        console.log('ID is:', movie_tv_id)
        finalResult.push({
          Title: current,
          show_id: movie_tv_id,
          media_type: movie_tv_type,
          Count: cnt
        })
      }
      // At this point we have the final array of all shows and movies with their count

      const finalNetflix = await fetchDetails(finalResult)
      let time = 0
      let genres_arr = []
      let genres_obj = { ID: 'Genre' }
      //let genres_mapped_to_arr = []
      for (let k = 0; k < finalNetflix.length; k++) {
        if (finalNetflix[k].RunTime) {
          time = time + finalNetflix[k].Count * finalNetflix[k].RunTime
        }
        if (finalNetflix[k].Genres) {
          for (let l = 0; l < finalNetflix[k].Genres.length; l++) {
            genres_arr.push(finalNetflix[k].Genres[l].name)
          }
        }
      }
      for (var m = 0, n = genres_arr.length; m < n; m++) {
        if (genres_obj[genres_arr[m]]) {
          genres_obj[genres_arr[m]]++
        } else {
          genres_obj[genres_arr[m]] = 1
        }
      }
      finalNetflix.push({
        totalTime: time,
        movie_count: movie_cnt,
        tv_count: tv_cnt,
        genres: Object.entries(genres_obj)
      })
      res.write(JSON.stringify(finalNetflix))
      res.end()
    })
})

async function fetchDetails(array) {
  const axios = require('axios')
  const rateLimit = require('axios-rate-limit')
  const http = rateLimit(axios.create(), {
    maxRequests: 4,
    perMilliseconds: 1000
  })
  http.getMaxRPS()
  const shows = []
  const bingeList = []
  for (const item of array) {
    shows.push(
      http
        .get(
          'https://api.themoviedb.org/3/' +
            item.media_type +
            '/' +
            item.show_id +
            '?api_key=' +
            process.env.API_KEY
        )
        .catch(function(error) {
          console.log(error)
        })
    )
  }
  await axios.all(shows).then(function(results) {
    results.forEach(function(response, index) {
      // let genres_mapped_to_arr = response.data.genres.map(d =>
      //   Array.from(Object.values(d))
      // )
      bingeList.push(
        Object.assign(
          {},
          {
            Title: response.data.title
              ? response.data.title
              : response.data.name,
            Poster: response.data.poster_path
              ? 'http://image.tmdb.org/t/p/w300' + response.data.poster_path
              : '',
            RunTime: response.data.episode_run_time
              ? response.data.episode_run_time[0]
              : response.data.runtime,
            Genres: response.data.genres
          },
          array[index]
        )
      )
    })
  })
  return bingeList
}

// export the server middleware
module.exports = {
  path: '/api',
  handler: app
}
