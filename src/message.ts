class Message {
  private update_id: number;
  private message_id: number;
  private date: number;
  private message: any;
  constructor(msg: any) {
    this.update_id = msg.update_id;
    this.message_id = msg.message.message_id;
    this.date = msg.message.date;
    this.message = msg.message;
  }
  getUpdateId() {
    return this.update_id;
  }
  getMessageId() {
    return this.message_id;
  }
  getDate() {
    return this.date;
  };
  getFromId() {
    return this.message.from.id;
  }
  getChatId() {
    return this.message.chat.id;
  }
  getText() {
    return this.message.text;
  }
  getSticker() {
    return this.message.sticker;
  }
  getMessage() {
    return this.message;
  }
}

export default Message