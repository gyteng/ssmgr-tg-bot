import { token } from './config';

import * as db from './db';
import { get, post } from 'request';
// const rp = require('request-promise');
const url = `https://api.telegram.org/bot${ token }/`;


process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error(`Caught exception:`);
  console.error(err);
});

const deleteMessage = (message: any) => {
  return new Promise((resolve, reject) => {
    post(url + 'deleteMessage', {
      form: {
        chat_id: message.message.chat.id,
        message_id: message.message.message_id,
      }
    }, (err, data, body) => {
      if(err) {
        return reject(err);
      }
      return resolve(body);
    })
  });
};

const getMessage = async () => {
  const updateId = await db.getUpdateId();
  const getMessages = (): any => {
    return new Promise((resolve, reject) => {
      post(url + 'getUpdates', {
        form: {
          offset: updateId,
          timeout: 30,
        }
      }, (err, data, body) => {
        if(err) {
          return reject(err);
        }
        return resolve(body);
      })
    });
  };
  const result = await getMessages();
  const resultObj = JSON.parse(result);
  if(resultObj.ok && resultObj.result.length) {
    resultObj.result.forEach(async (message: any) => {
      console.log(message);
      await db.saveMessage(message);
      if(message.message.sticker) {
        await deleteMessage(message);
      }
    });
    if(resultObj.result.length) {
      await db.setUpdateId(resultObj.result[resultObj.result.length - 1].update_id + 1);
    }
  }
};

const pull = (): any => {
  return getMessage()
  .then(() => {
    return pull();
  }).catch(() => {
    return pull();
  });
};
pull();