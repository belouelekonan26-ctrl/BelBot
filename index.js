const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const express = require('express')
const app = express()

app.get('/', (req,res)=>res.send('BelBot est en ligne!'))
app.listen(3000, ()=>console.log('Serveur OK'))

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('session')
  const sock = makeWASocket({
    logger: pino({level:'silent'}),
    printQRInTerminal: true,
    auth: state
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (update)=>{
    const { connection, lastDisconnect } = update
    if(connection === 'close'){
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if(shouldReconnect) startBot()
    }
  })
  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0]
    if(!m.message || m.key.fromMe) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    const from = m.key.remoteJid
    
    if(text.toLowerCase() === 'ping'){
      await sock.sendMessage(from, {text:'Pong! BelBot actif ✅'})
    }
    if(text.toLowerCase().startsWith('menu')){
      await sock.sendMessage(from, {text:'🤖 BELBOT MENU\n\n.ping - teste le bot\n.menu - affiche ce menu\n.sticker - envoie image avec .sticker pour faire sticker'})
    }
    if(text.toLowerCase() === '.sticker' || text.toLowerCase() === 'sticker'){
      await sock.sendMessage(from, {text:'Envoie une image avec la légende .sticker'})
    }
  })
}
startBot()
