const formValidator = require('./form_validator');
const photoModel = require('./photo_model');
const { publishMessage } = require('./pubSub');
const { Storage } = require('@google-cloud/storage');
const { db } = require('./database');
const storage = new Storage()
function route(app) {
  app.get('/', async (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;
    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      res.status(200)
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }
    return photoModel
      .getFlickrPhotos(tags, tagmode)
      .then(photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;
        return res.render('index', ejsLocalVariables);
      })
      .catch(error => {
        return res.status(500).send({ error });
      });
  });

  app.get('/zip', async (req, res) => {
    const tags = req.query.tags
    if (!tags) {
      req.end('no tags')
    }
    const ref = db.ref('pnk/zipJobs/' + tags)
    await ref.set({
      progress: 0
    })
    await publishMessage(tags)
    res.end('ok')
  })
  app.get('/getZipUrl', async (req, res) => {
    if (!req.query.file) {
      res.status(400)
      res.end('missing parameter.')
    }
    const options = {
      action: 'read',
      expires: +Date.now() + (2 * 24 * 60 * 60 * 1000)
    };
    try {
      const [signedUrl] = await storage
        .bucket('dmii2022bucket')
        .file(req.query.file)
        .getSignedUrl(options);
      res.status(200)
      res.end(signedUrl)
    } catch (e) {
      res.status(500)
      console.error(e)
      res.end('error')
    }
  })
}

module.exports = route;
