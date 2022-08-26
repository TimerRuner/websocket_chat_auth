require("dotenv").config()

const WebSocket = require("ws")
const http = require("http")
const express = require("express")
const mongoose = require("mongoose")
const UserService = require("./service/user-service")
const ChatService = require("./service/chat-service")
const { ObjectId } = require("mongoose")

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

const clients = new Map()
let userId = null

wss.on("connection", (ws, req) => {
    ws.on("message", (message) => {
        message = JSON.parse(message)
        switch (message.type) {
            case "connection":
                messageSending(message, ws)
                break
            case "message":
                messageSending(message, ws)
                break
            case "registration":
                registration(message, ws)
                break
            case "login":
                login(message, ws)
                break
            case "check_user":
                refresh(message, ws)
                break
            case "logout":
                logout(message)
                break
            case "get_chat":
                getChat(message.userId, ws)
                break
            case "update_chat":
                updateChat(message.chat, ws)
                break
        }
    })

    ws.on("close", () => {
        for (const userId of clients.keys()) {
            if (clients.get(userId) === ws) {
                clients.delete(userId)
            }
        }
    })
})

const updateChat = async (chat, client) => {
    const updatedChat = await ChatService.updateChat(chat)
}

const getChat = async (userId, client) => {
    const { chat } = await ChatService.getChat(mongoose.Types.ObjectId(userId))
    client.send(JSON.stringify({ type: "set_chat", chat }))
}

const messageSending = (message, ws) => {
    for (ws of clients.values()) {
        ws.send(JSON.stringify(message))
    }
}

const login = async ({ username, password }, client) => {
    try {
        const userData = await UserService.login(username, password)
        clients.set(userData.user.id.toString(), client)
        userId = userData.user.id.toString()
        const { chat } = await ChatService.getChat(userData.user.id)
        client.send(JSON.stringify({ type: "auth_success", ...userData, chat }))
    } catch (error) {
        client.send(
            JSON.stringify({ type: "auth_error", message: error.message })
        )
    }
}

const registration = async ({ username, password }, client) => {
    try {
        const userData = await UserService.registration(username, password)
        clients.set(userData.user.id.toString(), client)
        userId = userData.user.id.toString()
        //? made chat table
        await ChatService.createChat(userData.user.id)
        const { chat } = await ChatService.getChat(userData.user.id)
        //?
        client.send(JSON.stringify({ type: "auth_success", ...userData, chat }))
    } catch (error) {
        client.send(
            JSON.stringify({ type: "auth_error", message: error.message })
        )
    }
}

const refresh = async ({ refresh }, client) => {
    try {
        const userData = await UserService.refresh(refresh)
        clients.set(userData.user.id.toString(), client)
        userId = userData.user.id.toString()
        client.send(JSON.stringify({ type: "refreshed", ...userData }))
    } catch (error) {
        client.send(
            JSON.stringify({ type: "unathorized", message: error.message })
        )
    }
}

const logout = async ({ refreshToken }) => {
    await UserService.logout(refreshToken)
}

const connection = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useUnifiedTopology: "true",
        })
        server.listen(process.env.PORT, () =>
            console.log(`Server starts at http://localhost:${process.env.PORT}`)
        )
    } catch (error) {
        console.log(error)
    }
}

connection()
