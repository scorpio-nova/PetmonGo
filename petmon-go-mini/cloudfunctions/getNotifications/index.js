// 云函数：getNotifications
// 功能：获取用户通知列表

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { page = 1, pageSize = 20 } = event

  try {
    // 获取总数
    const countRes = await db.collection('notices').where({
      _openid: openid
    }).count()
    const total = countRes.total

    // 获取分页数据
    const skip = (page - 1) * pageSize
    const noticesRes = await db.collection('notices')
      .where({
        _openid: openid
      })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: noticesRes.data,
        total,
        page,
        pageSize
      }
    }
  } catch (err) {
    console.error('getNotifications error:', err)
    return {
      code: -1,
      message: err.message
    }
  }
}
