const formValidator = require('./form_validator');
const photoModel = require('./photo_model');
const { publishMessage } = require('./pubSub');
const { whatABeautifulDatabase } = require('./whatABeautifulDatabase');
const { Storage } = require('@google-cloud/storage');
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

    ejsLocalVariables.downloadZipUrl = ''
    let zipForTags
    whatABeautifulDatabase.data = whatABeautifulDatabase.data.filter(item => {
      if (item.tags === tags) {
        zipForTags = item
        return false
      }
      return true
    })
    if(zipForTags) {
      const options = {
        action: 'read',
        expires: +Date.now() + (2 * 24 * 60 * 60 * 1000)
      };
      const signedUrl = await storage
        .bucket('dmii2022bucket')
        .file(zipForTags.name)
        .getSignedUrl(options);
      ejsLocalVariables.downloadZipUrl = signedUrl
    }
    // get photos from flickr public feed api
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
    await publishMessage(req.query.tags)
    res.redirect('/?tags=' + req.query.tags + '&tagmode=' + req.query.tagmode)
  })
}

module.exports = route;
