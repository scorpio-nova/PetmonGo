// 云函数：addEvent
// 功能：发布安全事件，包含内容审核

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { type, title, desc, place, location } = event

  try {
    // 内容审核
    if (title) {
      const checkTitle = await cloud.openapi.security.msgSecCheck({
        content: title
      })
      if (checkTitle.errCode !== 0) {
        return {
          code: -2,
          message: '标题包含违规内容'
        }
      }
    }

    if (desc) {
      const checkDesc = await cloud.openapi.security.msgSecCheck({
        content: desc
      })
      if (checkDesc.errCode !== 0) {
        return {
          code: -2,
          message: '描述包含违规内容'
        }
      }
    }

    // 创建事件记录
    const newEvent = {
      _openid: openid,
      type,
      title,
      desc: desc || '',
      place,
      location: location || null,
      status: 'approved',
      createdAt: new Date().toISOString()
    }

    const addRes = await db.collection('events').add({
      data: newEvent
    })

    return {
      code: 0,
      data: {
        eventId: addRes._id
      }
    }
  } catch (err) {
    console.error('addEvent error:', err)
    return {
      code: -1,
      message: err.message
    }
  }
}
