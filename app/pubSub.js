const { PubSub } = require('@google-cloud/pubsub');
const projectId = 'leadtechnique2022'
const topicId = "dmi2-1"
const subscriptionId = "dmi2-1"
const pubsub = new PubSub({projectId});

async function getTopic () {
 const topic = await pubsub.topic(topicId)
  return topic
}
async function getSubscription () {
  const subscription = await pubsub.subscription(subscriptionId)
  return subscription
}
async function publishMessage(message) {
  const topic = await getTopic()
  topic.publish(Buffer.from(message))
}

module.exports = {
  getTopic,
  getSubscription,
  publishMessage
}
