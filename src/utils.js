import fsExtra from "fs-extra"
import { ReadStream } from "node:fs"
import path from "node:path"

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function writeFileWithDirs(filePath, data, options) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(filePath)
    await fsExtra.ensureDir(dir)
  } catch (err) {
    if (err.code === "EEXIST") {
      // The directory already exists, do nothing
    } else {
      // Some other error occurred, rethrow it
      throw err
    }
  }

  // Write the file
  await fsExtra.writeFile(filePath, data, options)
}

export function folderAndFileName(dirent) {
  if (!dirent.name || !dirent.path) {
    console.warn(
      "A object that is not a dirent has been sent to get folder and file name. Abort."
    )
    process.exit()
  }

  const folderPathSeparator = dirent.path.includes("/") ? "/" : "\\"
  const folderName = dirent.path.split(folderPathSeparator).at(-1)

  return {
    name: dirent.name,
    folder: folderName,
  }
}

export class DropboxDebug {
  constructor(options) {
    this.token = options.accessToken
    this.blob = []
  }

  async filesUpload(options) {
    if (!options.path) {
      console.warn("Called filesUpload without giving path.")
      return false
    }

    if (!options.contents) {
      console.warn("Called filesUpload without giving contents.")
      return false
    }

    await writeFileWithDirs(options.path, options.contents, "utf-8").catch(
      (e) => {
        console.error("Error while trying to write local file.")
      }
    )

    const falsePromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          result: {
            session_id: "123",
          },
        })
      }, 300)
    })

    return falsePromise
  }

  async filesUploadSessionStart(options) {
    if (typeof options.close !== "boolean") {
      console.warn("Called filesUploadSessionStart without giving close.")
      return false
    }

    if (!options.contents) {
      console.warn("Called filesUploadSessionStart without giving contents")
      return false
    }

    this.blob.push(options.contents)

    const falsePromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          result: {
            session_id: "123",
          },
        })
      }, 300)
    })

    return falsePromise
  }

  async filesUploadSessionAppendV2(options) {
    if (!options.cursor) {
      console.warn("Called filesUploadSessionAppendV2 without cursor.")
      return false
    }

    if (!options.contents) {
      console.warn("Called filesUploadSessionAppendV2 without giving contents")
      return false
    }

    if (typeof options.close !== "boolean") {
      console.warn("Called filesUploadSessionAppendV2 without giving close.")
      return false
    }

    {
      if (
        !options.cursor.session_id ||
        typeof options.cursor.session_id !== "string"
      ) {
        console.warn(
          "The cursor given to filesUploadSessionAppendV2 has no/invalid session_id."
        )
        return false
      }

      if (!options.cursor.offset || typeof options.cursor.offset !== "number") {
        console.warn(
          "The cursor given to filesUploadSessionAppendV2 has no/invalid offset"
        )
        return false
      }
    }

    this.blob.push(options.contents)

    const falsePromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          result: {
            session_id: "123",
          },
        })
      }, 300)
    })

    return falsePromise
  }

  async filesUploadSessionFinish(options) {
    if (!options.cursor) {
      console.warn("Called filesUploadSessionFinish without cursor.")
      return false
    }

    if (!options.commit) {
      console.warn("Called filesUploadSessionFinish without commit.")
      return false
    }

    if (!options.contents) {
      console.warn("Called filesUploadSessionFinish without contents.")
      return false
    }

    {
      // A lot of property checks
      if (
        !options.cursor.session_id ||
        typeof options.cursor.session_id !== "string"
      ) {
        console.warn(
          "The cursor given to filesUploadSessionFinish has no/invalid session_id."
        )
        return false
      }

      if (!options.cursor.offset || typeof options.cursor.offset !== "number") {
        console.warn(
          "The cursor given to filesUploadSessionFinish has no/invalid offset"
        )
        return false
      }

      if (
        !options.commit.mode ||
        typeof options.commit.mode !== "string" ||
        !["add", "overwrite", "update"].includes(options.commit.mode)
      ) {
        console.warn(
          "The commit given to filesUploadSessionFinish has no/invalid mode."
        )
        return false
      }

      if (!options.commit.path || typeof options.commit.path !== "string") {
        console.warn(
          "The commit given to filesUploadSessionFinish has no/invalid path."
        )
        return false
      }

      if (typeof options.commit.autorename !== "boolean") {
        console.warn(
          "The commit given to filesUploadSessionFinish has no/invalid autorename."
        )
        return false
      }

      if (typeof options.commit.mute !== "boolean") {
        console.warn(
          "The commit given to filesUploadSessionFinish has no/invalid mute."
        )
        return false
      }
    }

    this.blob.push(options.contents)
    const buffer = Buffer.concat(this.blob)

    await writeFileWithDirs(options.commit.path, buffer).catch((e) => {
      console.error("Error while trying to write local file.")
    })

    const falsePromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          result: {
            session_id: "123",
          },
        })
      }, 300)
    })

    return falsePromise
  }
}
