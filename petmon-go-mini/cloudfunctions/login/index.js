// 云函数：login
// 功能：用户登录，获取或创建用户记录

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询用户是否存在
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userRes.data.length > 0) {
      // 用户已存在，返回用户信息
      return {
        code: 0,
        data: {
          userInfo: userRes.data[0],
          isNewUser: false
        }
      }
    } else {
      // 新用户，创建记录
      const newUser = {
        _openid: openid,
        nickName: '用户' + openid.slice(-6),
        avatarUrl: '',
        bio: '',
        feeds: 0,
        collectedCount: 0,
        spots: 0,
        activeDays: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const addRes = await db.collection('users').add({
        data: newUser
      })

      return {
        code: 0,
        data: {
          userInfo: { ...newUser, _id: addRes._id },
          isNewUser: true
        }
      }
    }
  } catch (err) {
    console.error('login error:', err)
    return {
      code: -1,
      message: err.message
    }
  }
}
