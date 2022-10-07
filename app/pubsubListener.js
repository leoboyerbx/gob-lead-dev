const { getSubscription } = require('./pubSub');
const photoModel = require('./photo_model');
const ZipStream = require('zip-stream');
const { Storage } = require('@google-cloud/storage')
const request = require('request');
const { db } = require('./database');

function makeid(length) {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}

async function createZip(tags) {
  const fileName = makeid(10) + '.zip'
 const storage = new Storage()
  const file = await storage.bucket('dmii2022bucket').file('public/users/' + fileName)
  const writeStream = file.createWriteStream({resumable: false})

  const photos = await photoModel.getFlickrPhotos(tags);
  if (!photos.length) {
    return false
  }
  const zip = new ZipStream();
  zip.pipe(writeStream)


  const ref = db.ref('pnk/zipJobs/' + tags)

  const photosNbr = photos.length
  let photoIndex = 0

  function addNextFile() {
    const photo = photos.shift()
    const stream = request(photo.media.b)
    zip.entry(stream, { name: photo.title + '.jpg' }, async err => {
      if(err)
        throw err;
      photoIndex++
      await ref.set({
        progress: photoIndex / photosNbr
      })
      if(photos.length > 0)
        addNextFile()
      else
        zip.finalize()
    })
  }
  addNextFile()

  return new Promise ( (resolve, reject) => {
    writeStream.on('error', (err) => {
      reject(err);
    });
    writeStream.on('finish', () => {
      resolve(file);
    });
  })
}

module.exports = async function listenForMessages() {
  const subscription = await getSubscription();
  const messageHandler =  async message => {
    const tags = message.data.toString()
    const zip = await createZip(tags);
    const ref = db.ref('pnk/zipJobs/' + tags)
    await ref.set({
      zip: zip.name,
      progress: 1
    })
    message.ack()
  }
  subscription.on('message', messageHandler);


  // const progressSubscription = await getProgressSubscription()
  const unsubscribe = () => {
    subscription.removeListener('message', messageHandler)
  }
  return unsubscribe
};
