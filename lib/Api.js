// © 2026 Dark Panther MD
// Simple API wrapper for GET & POST requests
// Learn from it — build on it — make it yours.

const config = require("../settings/config")
const fetch = require("node-fetch")

const PantherAPI = {
    /**
     * Perform a GET request
     * @param {string} endpoint
     * @param {object} params
     */
    get: async (endpoint, params = {}) => {
        try {
            const query = new URLSearchParams(params).toString()
            const url = `${config.api.baseUrl}${endpoint}${query ? "?" + query : ""}`

            const response = await fetch(url)
            return await response.json()
        } catch (err) {
            console.error("[DARK PANTHER MD] API GET error:", err)
            return null
        }
    },

    /**
     * Perform a POST request
     * @param {string} endpoint
     * @param {object} data
     */
    post: async (endpoint, data = {}) => {
        try {
            const response = await fetch(
                `${config.api.baseUrl}${endpoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                }
            )
            return await response.json()
        } catch (err) {
            console.error("[DARK PANTHER MD] API POST error:", err)
            return null
        }
    }
}

module.exports = PantherAPI
