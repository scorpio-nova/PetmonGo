// 云函数：getPets
// 功能：获取宠物列表（支持游客/登录用户不同权限）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { area, page = 1, pageSize = 20 } = event

  try {
    // 构建查询条件
    let query = db.collection('pets')

    if (area) {
      query = query.where({ area })
    }

    // 获取总数
    const countRes = await query.count()
    const total = countRes.total

    // 获取分页数据
    const skip = (page - 1) * pageSize
    const petsRes = await query
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 根据用户身份处理数据
    const pets = petsRes.data.map(pet => {
      // 基础信息（游客和登录用户都可见）
      const baseInfo = {
        _id: pet._id,
        name: pet.name,
        cnName: pet.cnName,
        kind: pet.kind,
        breed: pet.breed,
        tag: pet.tag,
        area: pet.area,
        stars: pet.stars,
        seen: pet.seen,
        note: pet.note,
        photo: pet.photos && pet.photos[0] || '',
        createdAt: pet.createdAt
      }

      // 踪迹信息（根据权限返回不同内容）
      const traces = (pet.traces || []).map(trace => {
        const baseTrace = {
          timestamp: trace.timestamp,
          place: trace.place,
          area: trace.area
        }

        // 登录用户可见精确位置
        if (openid && trace.location) {
          baseTrace.location = trace.location
        }

        return baseTrace
      })

      return {
        ...baseInfo,
        traces
      }
    })

    return {
      code: 0,
      data: {
        list: pets,
        total,
        page,
        pageSize
      }
    }
  } catch (err) {
    console.error('getPets error:', err)
    return {
      code: -1,
      message: err.message
    }
  }
}
