import * as client from 'knex';

const knex: client = client({
  client: 'sqlite3',
  connection: {
    filename: './data.sqlite',
  },
  useNullAsDefault: true,
});

const createTable = async () => {
  await knex.schema.createTableIfNotExists('setting', function(table) {
    table.string('key');
    table.string('value');
  });
  await knex.schema.createTableIfNotExists('log', function(table) {
    table.integer('is_deleted').defaultTo(0);
    table.integer('update_id').primary();
    table.integer('message_id');
    table.integer('from_id');
    table.integer('chat_id');
    table.bigInteger('date');
    table.string('text', 16384);
    table.string('sticker', 16384);
  });
};

createTable();

const setUpdateId = async (id: number) => {
  try {
    const result = await knex('setting').select(['value']).where({key: 'updateId'});
    if(result.length === 0) {
      await knex('setting').insert({
        key: 'updateId',
        value: id || 1,
      });
    } else {
      await knex('setting').where({key: 'updateId'}).update({
        value: id,
      });
    }
    return id;
  } catch(err) {
    return Promise.reject(err);
  }
};

const getUpdateId = async () => {
  try {
    const result = await knex('setting').select(['value']).where({key: 'updateId'});
    if(result.length === 0) {
      return 1;
    } else {
      return result[0].value;
    }
  } catch(err) {
    return Promise.reject(err);
  }
};

const saveMessage = async (message: any) => {
  await knex('log').insert({
    update_id: message.update_id,
    message_id: message.message.message_id,
    from_id: message.message.from.id,
    chat_id: message.message.chat.id,
    date: message.message.date,
    text: JSON.stringify(message.message.text),
    sticker: JSON.stringify(message.message.sticker),
  });
};

const deleteMessage = async (message: any) => {
  await knex('log').update({
    is_deleted: 1
  }).where({ message_id: message.message.message_id });
};

export {
  setUpdateId,
  getUpdateId,
  saveMessage,
  deleteMessage,
}