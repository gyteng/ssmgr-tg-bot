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

const deleteUser = async (message: Message) => {
  await db.deleteMessage(message);
  return new Promise((resolve, reject) => {
    post(url + 'kickChatMember', {
      form: {
        chat_id: message.getChatId(),
        user_id: message.getFromId(),
      }
    }, (err, data, body) => {
      if(err) {
        return reject(err);
      }
      return resolve(body);
    })
  });
}

const sendMessage = async (text: String) => {
  return new Promise((resolve, reject) => {
    post(url + 'sendMessage', {
      form: {
        chat_id: -1001115671254,
        text,
      }
    }, (err, data, body) => {
      if(err) {
        return reject(err);
      }
      return resolve(body);
    })
  });
};

const isSpam = (username: string) => {
  const spamList = [
    '去中心化交易所搬砖套利',
    '电报拉人软件',
    '批量投票上币',
    'TG软件群私发',
    '志玲成人视频',
    '炸群服务',
  ];
  return spamList.some(spam => {
    return username.trim().includes(spam.trim());
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
          if(msg.getDate() - lastSticker.date <= 45) {
            await deleteMessage(msg);
          } else if(msg.getDate() - lastSticker.date <= 150 && msg.getFromId() === lastSticker.from_id) {
            await deleteMessage(msg);
          }
        }
      }
      if(msg.getMessage().new_chat_member) {
        const name = msg.getMessage().new_chat_member.first_name + msg.getMessage().new_chat_member.last_name;
        if(isSpam(name)) {
          await deleteMessage(msg);
          await deleteUser(msg);
        }
      }
      if(msg.getFromId() === 77956174 && msg.getChatId() === 77956174) {
        await sendMessage(msg.getText());
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
