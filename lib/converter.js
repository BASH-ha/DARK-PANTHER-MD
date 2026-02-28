// © 2026 Dark Panther MD
// Media conversion utilities using FFmpeg
// Build, learn, and improve — don’t blind copy.

const fs = require("fs")
const path = require("path")
const { spawn } = require("child_process")

const tmpDir = path.join(__dirname, "../tmp")

if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
}

/**
 * Core FFmpeg runner
 * @param {Buffer} buffer
 * @param {Array} args
 * @param {String} inputExt
 * @param {String} outputExt
 */
function runFFmpeg(buffer, args = [], inputExt = "", outputExt = "") {
    return new Promise(async (resolve, reject) => {
        const inputPath = path.join(tmpDir, `${Date.now()}.${inputExt}`)
        const outputPath = `${inputPath}.${outputExt}`

        try {
            await fs.promises.writeFile(inputPath, buffer)

            const ff = spawn("ffmpeg", [
                "-y",
                "-i", inputPath,
                ...args,
                outputPath
            ])

            ff.on("error", reject)

            ff.on("close", async (code) => {
                try {
                    await fs.promises.unlink(inputPath)

                    if (code !== 0) {
                        return reject(new Error("FFmpeg process failed"))
                    }

                    const result = await fs.promises.readFile(outputPath)
                    await fs.promises.unlink(outputPath)

                    resolve(result)
                } catch (err) {
                    reject(err)
                }
            })
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * Convert audio to WhatsApp-compatible MP3
 */
function toAudio(buffer, ext) {
    return runFFmpeg(
        buffer,
        [
            "-vn",
            "-ac", "2",
            "-b:a", "128k",
            "-ar", "44100",
            "-f", "mp3"
        ],
        ext,
        "mp3"
    )
}

/**
 * Convert audio to WhatsApp PTT (voice note)
 */
function toPTT(buffer, ext) {
    return runFFmpeg(
        buffer,
        [
            "-vn",
            "-c:a", "libopus",
            "-b:a", "128k",
            "-vbr", "on",
            "-compression_level", "10"
        ],
        ext,
        "opus"
    )
}

/**
 * Convert video to WhatsApp-compatible MP4
 */
function toVideo(buffer, ext) {
    return runFFmpeg(
        buffer,
        [
            "-c:v", "libx264",
            "-c:a", "aac",
            "-b:a", "128k",
            "-ar", "44100",
            "-crf", "32",
            "-preset", "slow"
        ],
        ext,
        "mp4"
    )
}

module.exports = {
    runFFmpeg,
    toAudio,
    toPTT,
    toVideo
                              }
