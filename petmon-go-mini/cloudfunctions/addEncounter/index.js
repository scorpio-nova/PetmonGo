// 云函数：addEncounter
// 功能：记录相遇，包含内容审核

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { petId, photo, note } = event

  try {
    // 内容审核
    if (note) {
      const checkNote = await cloud.openapi.security.msgSecCheck({
        content: note
      })
      if (checkNote.errCode !== 0) {
        return {
          code: -2,
          message: '备注包含违规内容'
        }
      }
    }

    // 图片审核
    if (photo) {
      const checkPhoto = await cloud.openapi.security.imgSecCheck({
        media: {
          contentType: 'image/png',
          value: Buffer.from(photo, 'base64')
        }
      })
      if (checkPhoto.errCode !== 0) {
        return {
          code: -2,
          message: '图片包含违规内容'
        }
      }
    }

    // 上传照片到云存储
    let photoUrl = ''
    if (photo) {
      const uploadRes = await cloud.uploadFile({
        cloudPath: `encounters/${openid}/${Date.now()}.jpg`,
        fileContent: Buffer.from(photo, 'base64')
      })
      photoUrl = uploadRes.fileID
    }

    // 获取宠物信息
    const petRes = await db.collection('pets').doc(petId).get()
    const pet = petRes.data

    // 创建相遇记录
    const newEncounter = {
      _openid: openid,
      petId,
      photo: photoUrl,
      note: note || '偶遇',
      location: pet.location,
      area: pet.area,
      status: 'approved',
      createdAt: new Date().toISOString()
    }

    const addRes = await db.collection('encounters').add({
      data: newEncounter
    })

    // 更新宠物的 seen 计数和踪迹
    await db.collection('pets').doc(petId).update({
      data: {
        seen: db.command.inc(1),
        traces: db.command.push({
          each: [
            {
              timestamp: new Date().toISOString(),
              place: note || '偶遇',
              area: pet.area,
              location: pet.location,
              user: openid
            }
          ]
        }),
        updatedAt: new Date().toISOString()
      }
    })

    // 更新用户统计
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        feeds: db.command.inc(1),
        updatedAt: new Date().toISOString()
      }
    })

    // 创建通知
    await db.collection('notices').add({
      data: {
        _openid: pet._openid,
        type: 'encounter',
        title: `${pet.name} 被偶遇`,
        body: `有人在 ${pet.area} 偶遇了 ${pet.name}`,
        relatedId: addRes._id,
        read: false,
        createdAt: new Date().toISOString()
      }
    })

    return {
      code: 0,
      data: {
        encounterId: addRes._id
      }
    }
  } catch (err) {
    console.error('addEncounter error:', err)
    return {
      code: -1,
      message: err.message
    }
  }
}
