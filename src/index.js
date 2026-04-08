import dotenv from "dotenv"
import dropbox from "dropbox"
import {createWriteStream, createReadStream} from 'fs'
import fs from "node:fs/promises"
import * as consts from "./consts.js"
import path from "node:path"
import url from "node:url"
import { DropboxDebug, folderAndFileName, sleep } from "./utils.js"
import archiver from 'archiver'
import chalk from 'chalk'
import router from './routes/index.js'

dotenv.config()
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

console.log("Começando...");

const main = async () => {
  console.log("Lendo config.json")

  const configFile = await fs.readFile(
    path.join(__dirname, "../config.json"),
    "utf-8"
  ).catch((e) => {
    return ''
  })

  if (!configFile) {
    console.log(chalk.red("Arquivo de configuração não encontrado."))
    process.exit()
  }

  const parsedConfig = JSON.parse(configFile)

  if (!parsedConfig) {
    console.log(chalk.red('Não foi possível ler o arquivo de configuração.'))
    process.exit
  }

  if (!parsedConfig.baseFolder) {
    console.log(chalk.red('config.json precisa de "baseFolder" especificado.'))
    process.exit()
  }

  const givenBaseFolder = await fs.readdir(parsedConfig.baseFolder, { withFileTypes: true, recursive: true }).catch((e) => {
    return null
  })

  if (!givenBaseFolder) {
    console.log(chalk.red('Não foi possível ler o caminho dado em baseFolder, tem certeza que esse caminho existe?'))
    process.exit()
  }

  if (!parsedConfig.specificPaths) {
    console.log(chalk.red('config.json precisa de "specificPaths" especificado.'))
    process.exit()
  }

  const foldersToLook = Object.keys(parsedConfig.specificPaths)

  if (foldersToLook.length < 0) {
    console.log(chalk.red('Nenhuma entrada encontrada dentro de "specificPaths".'))
    process.exit()
  }

  console.log('\n\n' + chalk.yellow('Validando caminhos no specificPaths...'))

  // Check if specified paths actually exist.
  const indexesOfPathToSkip = []
  for (let i = 0; i < foldersToLook.length; i++) {
    if (!givenBaseFolder.find((dirent) => {
      const brokenDirent = folderAndFileName(dirent)
      const folderAndFileFromDirent = brokenDirent.folder + '/' + brokenDirent.name
      const isSingleFolder = !foldersToLook[i].includes('/')

      return isSingleFolder ? dirent.name === foldersToLook[i] : folderAndFileFromDirent === foldersToLook[i]
    })) {
      console.log(chalk.red(`${foldersToLook[i]} não é um caminho valido.`))
      await sleep(2000)
      indexesOfPathToSkip.push(i)
    }
  }

  if (process.env.SKIP_INVALID_PATH !== '1' && indexesOfPathToSkip.length > 0) {
    console.log(chalk.red('Caminhos invalidos foram encontrados e não foi permitido pular eles, abortanto...'))
    process.exit()
  }

  console.log('\n\n' + chalk.yellow('Começando SDK do Dropbox...'))

  // const app = express()
 
  // let session_options = {
  //   secret: process.env.SESSION_ID_SECRET,
  //   resave: false,
  //   saveUninitialized: false,
  //   cookie: { secure: false } // only for dev purpose
  // }

  // app.use(session(session_options))

  // return

  const dbx = process.env.DEBUG_MODE === '1' ? new DropboxDebug({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, selectUser: process.env.SELECTED_USER_ID }) : new dropbox.Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, selectUser: 'dbmid:AAB6zK4vBA5L_sT_seAQ0_IWOY5IPH4YZns' })
  // const t = await dbx.filesListFolder({ path: '/backup_bd/skyone oracle/', include_mounted_folders: true, include_non_downloadable_files: true, include_has_explicit_shared_members: true, limit: 250 })
  // console.log(t)
  // const lmao = await dbx.teamMembersList()
  // console.log(lmao)
  // dbx.filesListFolder({path: '/backup_bd'})
  // .then(function(response) {
  //   console.log('olha abaixo\n\n')
  //   console.log(response.result.entries)
  // })

  // .catch(function(error) {
  //   console.error(error)
  // })

  console.log(`Nós estamos no modo ${process.env.DEBUG_MODE === '1' ? chalk.blue('DEBUG') : chalk.green('PRODUCTION')}! Começando em 5 segundos...`)
  
  await sleep(5000)
  console.log('\n\n' + chalk.yellow('Começando processo de mover arquivos.'))

  for (let i = 0; i < foldersToLook.length; i++) {
    if (indexesOfPathToSkip.includes(i)) {
      continue
    }

    const currentDir = await fs.readdir(path.join(parsedConfig.baseFolder, foldersToLook[i])).catch((e) => {
      return null
    })

    if (!currentDir) {
      console.log(chalk.red('Falha ao ler o seguinte caminho ', path.join(parsedConfig.baseFolder, foldersToLook[i]), ', abortanto em ', process.env.SECONDS_AFTER_INVALID_PATH, ' segundos...'))
      await sleep(process.env.SECONDS_AFTER_INVALID_PATH * 1000)
      process.exit()
    }
    
    console.log(chalk.grey.bold(`Olhando pasta ${foldersToLook[i]}`))

    for (let file of currentDir) {
      console.log('\n\n' + chalk.yellow.bgBlue(`Olhando arquivo "${file}"`))
      let filePath = path.join(parsedConfig.baseFolder, foldersToLook[i], file)
      let fileStat = await fs.stat(filePath)

      if (!file.endsWith('.zip')) {
        console.log(chalk.gray.bgBlue('Arquivo não é .zip ainda, convertendo...'))
        // const newZip = new zip()
        // let chunks = [];
        const fileStream = createReadStream(filePath)
        const zippedFileName = file.split('.').slice(0, -1).join('.') + '.zip'
        const zippedFilePath = path.join(parsedConfig.baseFolder, foldersToLook[i], zippedFileName)
        const output = createWriteStream(zippedFilePath)
        const archive = archiver('zip')

        archive.pipe(output)
        
        archive.append(fileStream, { name: file })

        await archive.finalize()

        console.log(chalk.bgBlue.green('conversão .zip feita, deletando copia antiga...'))

        await fs.rm(filePath)
        file = zippedFileName
        filePath = zippedFilePath
      }
      
      fileStat = await fs.stat(filePath)
      const requiresSlicing = fileStat.size > consts.default.UPLOAD_FILE_SIZE_LIMIT
      const basePathFolder = process.env.DEBUG_MODE === '1' ? process.env.LOCAL_DEBUG_STORE_PATH : parsedConfig.cloudBaseFolder
      const pathToUpload = path.join(basePathFolder, parsedConfig.specificPaths[foldersToLook[i]])
      const filePathToUpload = path.join(pathToUpload, file).replace(/\\/g, '/')

      if (requiresSlicing) {
        console.log(chalk.bgBlue.yellow('Arquivo é grande, iniciando processo longo de envio...'))

        const readStream = createReadStream(filePath)
        const expectedBlobCount = Math.round(fileStat.size / consts.default.BLOB_MAX_SIZE) 
        let fileBuffer = []
        let cursor;
        let i = 0

        console.log(chalk.bgYellow.blue(`Começando upload... ${i}/${expectedBlobCount}`))
        await dbx.filesUploadSessionStart({ close: false, contents: Buffer.alloc(0) })
          .then(response => {
            cursor = {
              session_id: response.result.session_id,
              offset: 0
            }
            readStream.resume()
          })
          i++
        readStream.on('data', async (chunk) => {
          fileBuffer.push(chunk)

          if (Buffer.concat(fileBuffer).length > consts.default.BLOB_MAX_SIZE) {
            readStream.pause()
            await dbx.filesUploadSessionAppendV2({
                contents: Buffer.concat(fileBuffer),
                cursor: cursor
            }).then(() => {
                console.log(chalk.bgYellow.blue(`Parte ${i} enviada de ${expectedBlobCount}.`))
                i++
                cursor.offset += Buffer.concat(fileBuffer).length
                fileBuffer = []
                readStream.resume()
            })
          }
        })

        readStream.on('end', async () => {
          await dbx.filesUploadSessionFinish({
            contents: Buffer.concat(fileBuffer),
            cursor: cursor,
            commit: { path: filePathToUpload, mode: 'add', autorename: true, mute: false }
          }).then(async () => {
            console.log(chalk.bgYellow.green.bold(`Arquivo enviado, o arquivo local será deletado! ${i}/${expectedBlobCount}`))
            await fs.rm(filePath)
          })
        })

      } else {
        console.log(chalk.bgYellow.blue('Arquivo é pequeno, enviado tudo de uma vez...'))

        const bufferFromFile = await fs.readFile(filePath)
        const res = await dbx.filesUpload({ path: filePathToUpload, contents: bufferFromFile }).catch((e) => {
          console.error(chalk.bgRed.black.bold('DEU RUIM! Algo aconteceu enquando estava enviado o arquivo. Abortando.\n\n', e))
          return null
        })

        if (!res) return

        console.log(chalk.bgGreen.bold('...Arquivo Enviado! Deletando arquivo local...'))
        await fs.rm(filePath)
        console.log(chalk.bgGreen.bold('Arquivo local deletado'))
      }
    }
  }
}

main()
