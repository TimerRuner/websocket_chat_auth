const { Schema, model } = require("mongoose")

const TokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId },
    refreshToken: { type: String, require: true },
})

module.exports = model("Token", TokenSchema)
