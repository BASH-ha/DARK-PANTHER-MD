// © 2026 Dark Panther MD
// Built with care. Learn, modify, and improve — don’t blindly copy.

const chalk = require("chalk")

module.exports = {
    connectHandler: async ({ sock, update, startBot, DisconnectReason, Boom }) => {
        const { connection, lastDisconnect } = update

        if (connection === "close") {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode

            switch (statusCode) {
                case DisconnectReason.badSession:
                    console.log(
                        chalk.bold.red(
                            "[DARK PANTHER MD] Invalid session detected. Delete session folder and re-pair."
                        )
                    )
                    process.exit()
                    break

                case DisconnectReason.connectionClosed:
                    console.log(
                        chalk.yellow("[DARK PANTHER MD] Connection closed. Reconnecting…")
                    )
                    startBot()
                    break

                case DisconnectReason.connectionLost:
                    console.log(
                        chalk.yellow("[DARK PANTHER MD] Connection lost. Attempting reconnect…")
                    )
                    startBot()
                    break

                case DisconnectReason.connectionReplaced:
                    console.log(
                        chalk.red(
                            "[DARK PANTHER MD] Session replaced by another login. Restart required."
                        )
                    )
                    process.exit()
                    break

                case DisconnectReason.loggedOut:
                    console.log(
                        chalk.red(
                            "[DARK PANTHER MD] Logged out from WhatsApp. Delete session and pair again."
                        )
                    )
                    process.exit()
                    break

                case DisconnectReason.restartRequired:
                    console.log(
                        chalk.yellow("[DARK PANTHER MD] Restart required. Restarting bot…")
                    )
                    startBot()
                    break

                case DisconnectReason.timedOut:
                    console.log(
                        chalk.yellow("[DARK PANTHER MD] Connection timed out. Reconnecting…")
                    )
                    startBot()
                    break

                default:
                    console.log(
                        chalk.red(
                            `[DARK PANTHER MD] Unknown disconnect reason: ${statusCode}`
                        )
                    )
                    startBot()
            }
        }

        if (connection === "open") {
            console.log(
                chalk.bold.green("[DARK PANTHER MD] Successfully connected.")
            )
        }
    }
              }
