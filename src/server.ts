import { token } from './config';
import * as db from './db';
import { get, post } from 'request';
const url = `https://api.telegram.org/bot${ token }/`;
import Message from './message';

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error(`Caught exception:`);
  console.error(err);
});

const deleteMessage = async (message: Message) => {
  await db.deleteMessage(message);
  return new Promise((resolve, reject) => {
    post(url + 'deleteMessage', {
      form: {
        chat_id: message.getChatId(),
        message_id: message.getMessageId(),
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
      if(!message.message) { return; }
      const msg = new Message(message);
      await db.saveMessage(msg);
      if(msg.getSticker()) {
        const lastSticker = await db.getLastSticker(msg);
        if(lastSticker) {
          if(msg.getDate() - lastSticker.date <= 30 || msg.getFromId() === lastSticker.from_id) {
            await deleteMessage(msg);
          }
        }
      }
    });
    if(resultObj.result.length) {
      await db.setUpdateId(resultObj.result[resultObj.result.length - 1].update_id + 1);
    }
  }
};
const pull = (): Promise<any> => {
  return getMessage()
  .then(() => {
    return pull();
  }).catch(() => {
    return pull();
  });
};
pull();