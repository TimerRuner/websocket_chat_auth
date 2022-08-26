const ChatModel = require("../models/chat-model")

class ChatService {
    async createChat(id) {
        try {
            const data = await ChatModel.find()
            const oldChat = data.length ? data[0].chat : "[]"
            console.log("CREATE_CHAT", oldChat)
            await ChatModel.create({ user: id, chat: oldChat })
        } catch (error) {
            throw new Error(error.message)
        }
    }
    async getChat(id) {
        try {
            const user = await ChatModel.findOne({ user: id })
            return user
        } catch (error) {
            throw new Error(error.message)
        }
    }
    async updateChat(chat) {
        try {
            const user = await ChatModel.updateMany(
                {},
                { $set: { chat: JSON.stringify(chat) } }
            )
            return user
        } catch (error) {
            throw new Error(error.message)
        }
    }
}

module.exports = new ChatService()
