import React, { useEffect, useRef, useState } from "react"
import Container from "./Container/Container"
import styles from "./Chat.module.scss"
import Loader from "./Loader/Loader"
import Header from "./Header/Header"

const Chat = () => {
    const socket = useRef()
    const [message, setMessage] = useState([])
    const [value, setValue] = useState("")
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState("")
    const chatRef = useRef()

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        socket.current = new WebSocket("ws://localhost:5000")
        socket.current.onopen = () => {
            setLoading(false)
            if (sessionStorage.getItem("access")) {
                setLoading(true)
                socket.current.send(
                    JSON.stringify({
                        type: "check_user",
                        access: sessionStorage.getItem("access"),
                        refresh: sessionStorage.getItem("refresh"),
                    })
                )
            }
        }

        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data)
            switch (data.type) {
                case "auth_success":
                    successAuth(
                        data.user.nikname,
                        data.refreshToken,
                        data.accessToken,
                        data.chat
                    )
                    break
                case "connection":
                    messaging(data)
                    break
                case "message":
                    messaging(data)
                    break
                case "auth_error":
                    setError(data.message)
                    break
                case "refreshed":
                    refreshed(data)
                    break
                case "unathorized":
                    unathorized()
                    break
                case "set_chat":
                    setChat(data.chat)
                    break
                default:
                    return {}
            }
        }

        socket.current.onclose = () => {
            console.log("socket closed")
        }

        socket.current.onerror = (err) => {
            console.log(err)
        }
    }, [])

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTo({
                top: document.documentElement.scrollHeight,
            })
        } else {
            return
        }
    })

    const connect = (type) => {
        setLoading(true)
        socket.current.send(
            JSON.stringify({
                type,
                username,
                password,
            })
        )
    }

    const setChat = (chat) => {
        setMessage(JSON.parse(chat))
    }

    const unathorized = () => {
        setLoading(false)
        setConnected(false)
    }

    const refreshed = ({ accessToken, refreshToken, user }) => {
        setLoading(false)
        setConnected(true)
        setUsername(user.nikname)
        sessionStorage.setItem("refresh", refreshToken)
        sessionStorage.setItem("access", accessToken)
        //TODO запит на отримання даних і зробити слухач на отримання даних
        // setMessage(JSON.parse(sessionStorage.getItem("message")))
        // console.log(userId)
        socket.current.send(
            JSON.stringify({
                type: "get_chat",
                userId: user.id,
            })
        )
    }

    const messaging = (data) => {
        setMessage((prev) => {
            //TODO зробити слухач для оновлення чату всім користувачам в бд
            // sessionStorage.setItem("message", JSON.stringify([...prev, data]))
            socket.current.send(
                JSON.stringify({
                    type: "update_chat",
                    chat: [...prev, data],
                })
            )
            return [...prev, data]
        })
    }

    const successAuth = (username, refreshToken, accessToken, chat) => {
        setLoading(false)
        setConnected(true)
        setMessage(JSON.parse(chat))
        socket.current.send(
            JSON.stringify({
                type: "connection",
                username,
                id: (Date.now() * Math.random()).toString(),
                date: new Date().toLocaleDateString(),
            })
        )
        sessionStorage.setItem("refresh", refreshToken)
        sessionStorage.setItem("access", accessToken)
    }

    const changeNameHandler = (e) => {
        e.preventDefault()
        setUsername(e.target.value)
        setError("")
    }
    const changePasswordHandler = (e) => {
        e.preventDefault()
        setPassword(e.target.value)
        setError("")
    }

    const sendMessageHandler = () => {
        socket.current.send(
            JSON.stringify({
                username,
                date: new Date().toLocaleDateString(),
                type: "message",
                message: value,
            })
        )
        setValue("")
    }
    if (loading) {
        return <Loader />
    }

    if (!connected && !loading) {
        return (
            <Container>
                <div className={styles.login}>
                    <div className={styles.login__wrapper}>
                        <div className={styles.login__inputWrapper}>
                            <input
                                value={username}
                                onChange={changeNameHandler}
                                type="text"
                                placeholder="Enter you nickname"
                            />
                            <input
                                value={password}
                                onChange={changePasswordHandler}
                                type="password"
                                placeholder="Enter you password"
                            />
                        </div>
                        {error && (
                            <div className={styles.chat__error}>{error}</div>
                        )}
                        <div className={styles.login__buttonWrapper}>
                            <button onClick={() => connect("login")}>
                                Log in
                            </button>
                            <button onClick={() => connect("registration")}>
                                Registration
                            </button>
                        </div>
                    </div>
                </div>
            </Container>
        )
    }

    return (
        <>
            <Header ws={socket.current} setConnected={setConnected} />
            <Container>
                <h1>{username}</h1>
                <div className={styles.chat}>
                    <div className={styles.chat__wrapper}>
                        <div className={styles.chat__form}>
                            <div
                                className={styles.chat__messages}
                                ref={chatRef}
                            >
                                <div className={styles.chat__message}>
                                    {message.map((mess) => (
                                        <div
                                            key={mess.id}
                                            className={styles.chat__list}
                                        >
                                            {mess.type === "connection" ? (
                                                <div
                                                    className={
                                                        styles.chat__connectionMessage
                                                    }
                                                >
                                                    User {mess.username}{" "}
                                                    conected
                                                </div>
                                            ) : (
                                                <div
                                                    className={
                                                        styles.chat__messageItem
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.chat__messageInfo
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.chat__username
                                                            }
                                                        >
                                                            {mess.username}
                                                        </span>
                                                        <span
                                                            className={
                                                                styles.chat__date
                                                            }
                                                        >
                                                            {mess.date}
                                                        </span>
                                                    </div>
                                                    <p>{mess.message}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.chat__send}>
                                <textarea
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                />
                                <div
                                    className={styles.chat__button}
                                    onClick={sendMessageHandler}
                                >
                                    Send
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </>
    )
}

export default Chat
