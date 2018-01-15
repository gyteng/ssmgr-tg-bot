const token = require('./config').token;
const db = require('./db');
const rp = require('request-promise');
const url = `https://api.telegram.org/bot${ token }/`;

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error(`Caught exception:`);
  console.error(err);
});

const deleteMessage = async (message) => {
  try {
    const result = await rp({
      method: 'POST',
      uri: url + 'deleteMessage',
      form: {
        chat_id: message.message.chat.id,
        message_id: message.message.message_id,
      },
      simple: false,
    });
    await db.deleteMessage(message);
  } catch (err) {

  }
};

const getMessage = async () => {
  const updateId = await db.getUpdateId();
  try {
    const result = await rp({
      method: 'GET',
      uri: url + 'getUpdates',
      qs: {
        offset: updateId,
        timeout: 30,
      },
      simple: false,
    });
    const resultObj = JSON.parse(result);
    if(resultObj.ok && resultObj.result.length) {
      resultObj.result.forEach(async message => {
        console.log(message);
        await db.saveMessage(message);
        if(message.message.sticker) {
          deleteMessage(message);
        }
      });
    }
    if(resultObj.result.length) {
      await db.setUpdateId(resultObj.result[resultObj.result.length - 1].update_id + 1);
    }
  } catch (err) {
    return;
  }
};

const pull = () => {
  return getMessage()
  .then(() => {
    return pull();
  }).catch(() => {
    return pull();
  });
};
pull();