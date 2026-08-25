// 云函数：addPet
// 功能：创建新宠物档案

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { name, kind, breed, tag, area, note, photo, location } = event

  try {
    // 文字审核（名字和描述）
    const checkName = await cloud.openapi.security.msgSecCheck({
      content: name
    })
    if (checkName.errCode !== 0) {
      return {
        code: -2,
        message: '名字包含违规内容'
      }
    }

    if (note) {
      const checkNote = await cloud.openapi.security.msgSecCheck({
        content: note
      })
      if (checkNote.errCode !== 0) {
        return {
          code: -2,
          message: '描述包含违规内容'
        }
      }
    }

    // 处理照片（如果有）
    let photos = []
    if (photo) {
      // 上传到云存储
      const uploadRes = await cloud.uploadFile({
        cloudPath: `pets/${openid}/${Date.now()}.jpg`,
        fileContent: Buffer.from(photo, 'base64')
      })
      photos.push(uploadRes.fileID)
    }

    // 创建宠物记录
    const newPet = {
      _openid: openid,
      name,
      cnName: name,
      kind,
      breed,
      tag,
      area,
      note: note || '',
      photos,
      location: location || null,
      stars: 3,
      seen: 1,
      traces: [
        {
          timestamp: new Date().toISOString(),
          place: '初次相遇',
          area,
          location: location || null,
          user: openid
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const addRes = await db.collection('pets').add({
      data: newPet
    })

    // 更新用户统计
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        collectedCount: db.command.inc(1),
        updatedAt: new Date().toISOString()
      }
    })

    return {
      code: 0,
      data: {
        petId: addRes._id
      }
    }
  } catch (err) {
    console.error('addPet error:', err)
    return {
      code: -1,
      message: err.message
    }
  }
}
