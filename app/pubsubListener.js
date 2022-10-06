const { getSubscription } = require('./pubSub');
const photoModel = require('./photo_model');
const ZipStream = require('zip-stream');
const { Storage } = require('@google-cloud/storage')
const request = require('request');
const { whatABeautifulDatabase } = require('./whatABeautifulDatabase');

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
  return new Promise (async (resolve, reject) => {
    writeStream.on('error', (err) => {
      reject(err);
    });
    writeStream.on('finish', () => {
      resolve(file);
    });
    const photos = await photoModel.getFlickrPhotos(tags);
    const zip = new ZipStream();
    zip.pipe(writeStream)

    const addEntry = (photo) => {
      return new Promise(resolve => {
        const stream = request(photo.media.b);
        zip.entry(stream, { name: photo.title + '.jpg' }, err => {
          if (err) {
            throw err;
          }
          resolve();
        });
      });
    };

    for (const photo of photos) {
      await addEntry(photo);
    }
    zip.finalize();
  });
}

module.exports = async function listenForMessages() {
  const subscription = await getSubscription();
  subscription.on('message', async message => {
    console.log('zip start')
    const tags = message.data.toString()
    const zip = await createZip(tags);
    whatABeautifulDatabase.data.push({
      name: zip.name,
      tags
    })
    console.log('zip end')
    message.ack()
  });
};
