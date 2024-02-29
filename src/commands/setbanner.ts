import { Discord } from '@/discord'
import { Colors, EmbedBuilder, Message } from 'discord.js'
import { BaseCommand, Permission } from '.'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'

export class SetbannerCommand implements BaseCommand {
  get name(): string {
    return 'setbanner'
  }

  get permissions(): Permission[] | null {
    return null
  }

  async execute(
    _discord: Discord,
    message: Message<boolean>,
    args: string[]
  ): Promise<void> {
    if (!message.guild) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ サーバー情報の取得失敗')
            .setDescription('このコマンドはサーバでのみ実行できます')
            .setTimestamp(new Date())
            .setColor(Colors.Red),
        ],
      })
      return
    }

    const { author } = message

    // テンプレートファイルのパス
    const assetDirectory = process.env.ASSETS_DIR ?? 'assets'
    const templateImagePath = `${assetDirectory}/setbanner-template.png`

    // フォントファイルのパス
    const fontPath = `${assetDirectory}/NotoSerifJP-Black.otf`

    // テキストの描画位置
    const x = 855
    const y = 260

    // 画像を生成
    const fontName = 'Noto Serif JP Black'
    const registerResult = GlobalFonts.registerFromPath(fontPath, fontName)
    if (!registerResult) {
      throw new Error('フォントの登録に失敗しました')
    }

    const canvas = createCanvas(960, 540)
    const ctx = canvas.getContext('2d')
    const templateImage = await loadImage(templateImagePath)
    ctx.drawImage(templateImage, 0, 0, 960, 540)

    // テキストを描画
    const text = args.join(' ')

    // 自動でフォントサイズを調整。フォントサイズ144pxを最大として、縦幅500pxに収まるようにする
    const textLength = text.length
    const fontSize = Math.min(144, 500 / (textLength * 1.2))
    ctx.font = `${fontSize * 1.4}px '${fontName}'`
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const characters = [...text]
    const lineHeight = fontSize * 1.2
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i]
      const yOffset = (i - (characters.length - 1) / 2) * lineHeight
      ctx.fillText(char, x, y + yOffset)
    }

    // 画像をバナー画像として設定
    const buffer = canvas.toBuffer('image/png')
    await message.guild.setBanner(
      buffer,
      `Updated by setbanner command : ${author.tag}`
    )

    // 画像を送信
    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ バナー画像を設定しました')
          .setDescription('サーバのバナー画像を更新しました')
          .setImage('attachment://banner.png')
          .setTimestamp(new Date())
          .setColor(Colors.Green),
      ],
      files: [
        {
          attachment: buffer,
          name: 'banner.png',
        },
      ],
    })
  }
}
