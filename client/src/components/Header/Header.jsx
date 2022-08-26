import React from "react"
import Container from "../Container/Container"
import styles from "./Header.module.scss"

const Header = ({ ws, setConnected }) => {
    const clickHandler = () => {
        const refreshToken = sessionStorage.getItem("refresh")
        ws.send(
            JSON.stringify({
                type: "logout",
                refreshToken,
            })
        )
        setConnected(false)
        sessionStorage.removeItem("access")
        sessionStorage.removeItem("refresh")
    }

    return (
        <header className={styles.header}>
            <Container>
                <button
                    className={styles.header__button}
                    onClick={clickHandler}
                >
                    Logout
                </button>
            </Container>
        </header>
    )
}

export default Header
