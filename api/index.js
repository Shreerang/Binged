const express = require('express')
const multer = require('multer')
const bodyParser = require('body-parser')
const upload = multer({ dest: 'tmp/csv' })
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/upload', upload.single('myfile'), (req, res, next) => {
  const csv = require('csv-parser')
  const fs = require('fs')
  const results = []
  const skimmedResults = []
  const finalResult = []
  const file = req.file
  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', d => {
      console.log(typeof d.Date === 'string')
      if (typeof d.Date === 'string' && d.Date.split('/')[2] === '19') {
        console.log(d)
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
      for (var i = 0; i < skimmedResults.length; i++) {
        if (skimmedResults[i] != current) {
          if (cnt > 0) {
            finalResult.push({ Title: current, Count: cnt })
          }
          current = skimmedResults[i]
          cnt = 1
        } else {
          cnt++
        }
      }
      if (cnt > 0) {
        finalResult.push({ Title: current, Count: cnt })
      }
      // At this point we have the final array of all shows and movies with their count

      const netflix = await processArray(finalResult)
      const finalNetflix = await fetchDetails(netflix)
      let time = 0
      for (let k = 0; k < finalNetflix.length; k++) {
        if (finalNetflix[k].RunTime) {
          time = time + finalNetflix[k].Count * finalNetflix[k].RunTime
        }
      }
      finalNetflix.push({ totalTime: time })
      res.json(finalNetflix)
    })
})

async function processArray(array) {
  const axios = require('axios')
  const rateLimit = require('axios-rate-limit')
  const http = rateLimit(axios.create(), {
    maxRequests: 3,
    perMilliseconds: 1000
  })
  http.getMaxRPS()
  const shows = []
  const bingeList = []
  for (const item of array) {
    let encodedShowName = encodeURI(item.Title)
    shows.push(
      http
        .get(
          'https://api.themoviedb.org/3/search/multi?api_key=56fb51d8828629a99b8cf9c40227b0e1&query=' +
            encodedShowName
        )
        .catch(function(error) {
          console.log(error)
        })
    )
  }
  await axios.all(shows).then(function(results) {
    results.forEach(function(response, index) {
      if (response.data.results.length > 0) {
        bingeList.push(
          Object.assign(
            {},
            {
              Title: response.data.results[0].name
                ? response.data.results[0].name
                : response.data.results[0].title,
              show_id: response.data.results[0].id,
              media_type: response.data.results[0].media_type
            },
            array[index]
          )
        )
      } else {
        console.log('Did not find anything', response.data.results)
      }
    })
  })
  return bingeList
}

async function fetchDetails(array) {
  const axios = require('axios')
  const rateLimit = require('axios-rate-limit')
  const http = rateLimit(axios.create(), {
    maxRequests: 3,
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
            '?api_key=56fb51d8828629a99b8cf9c40227b0e1'
        )
        .catch(function(error) {
          console.log(error)
        })
    )
  }
  await axios.all(shows).then(function(results) {
    results.forEach(function(response, index) {
      bingeList.push(
        Object.assign(
          {},
          {
            Title: response.data.title
              ? response.data.title
              : response.data.name,
            Poster:
              'http://image.tmdb.org/t/p/w300' + response.data.poster_path,
            RunTime: response.data.episode_run_time
              ? response.data.episode_run_time[0]
              : response.data.runtime
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
