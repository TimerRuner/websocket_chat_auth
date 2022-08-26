const { Schema, model } = require("mongoose")

const ChatModel = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    chat: { type: String, require: true },
})

module.exports = model("Chat", ChatModel)
