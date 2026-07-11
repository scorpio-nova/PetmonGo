# 宠物地图产品流程

```mermaid
%%{init: {"theme": "base", "flowchart": {"curve": "basis"}, "themeVariables": {"primaryColor": "#EEF2FA", "primaryBorderColor": "#222222", "primaryTextColor": "#252525", "lineColor": "#333333", "secondaryColor": "#E8DFFF", "tertiaryColor": "#F8F5FF"}}}%%
flowchart TD
    P01["P01 地图首页<br/>顶部：定位 + 附近宠物数量<br/>中间：宠物抽象地图<br/>我的定位、宠物头像、安全事件、友好地点<br/>宠物与安全事件可点击进入详情<br/>底部：地图、探索、发布、我的"]
    P02["P02 探索<br/>宠物：可点击进入宠物详情<br/>安全事件：可点击进入安全事件详情<br/>宠物日志<br/>天使故事<br/>地点评价<br/>遛宠路线<br/>寻宠发布<br/>地点等其他内容仅在探索页直接展示"]
    PUB(("发布"))

    P01 --> P02
    P01 -->|发布入口| PUB

    subgraph publish_flow [发布与识别]
        direction TB
        P07["P07 宠物识别"]
        P08["P08 宠物建档<br/>初始化宠物名称<br/>选择 Tag<br/>创建今日踪迹"]
        P05["P05 安全事件发布 / 建档<br/>可编辑页面<br/>选择类型：虐猫 / 丢失 / 抓人 / 咬人<br/>填写事件内容并选择精确位置"]

        P07 -->|新宠物| P08
    end

    PUB -->|拍照| P07
    PUB -->|发布事件| P05
    P05 -->|提交并关闭| P01

    P10["P10 安全事件详情<br/>只读查看页面<br/>通过高德地图 API 显示精确位置<br/>根据事件类型显示不同文字内容<br/>虐猫 / 丢失 / 抓人 / 咬人提醒"]
    EVENT_TYPE{"安全事件类型"}
    ABUSE["显示虐猫事件文案"]
    LOST["显示宠物丢失文案"]
    SCRATCH["显示抓人提醒文案"]
    BITE["显示咬人提醒文案"]
    P01 -->|点击安全事件| P10
    P02 -->|点击安全事件| P10
    P05 -.->|创建安全事件记录| P10
    P10 --> EVENT_TYPE
    EVENT_TYPE -->|虐猫| ABUSE
    EVENT_TYPE -->|丢失| LOST
    EVENT_TYPE -->|抓人| SCRATCH
    EVENT_TYPE -->|咬人| BITE

    subgraph pet_flow [宠物档案与动态]
        direction TB
        P04["P04 宠物详情<br/>弹窗，只读，无编辑按钮<br/>宠物 Tag：野生 / 家养 / 天使<br/>偶遇照片<br/>今日踪迹"]
        P03["P03 上传相遇"]
        P06["P06 我的图鉴<br/>图鉴有新动态时提示更新"]
        P09["P09 天使宠物卡片<br/>根据详情页 Tag 增加小鱼干（猫）或小骨头（狗）<br/>向发布人发送消息：宠物被谁在何处偶遇并收到了礼物"]

        P04 -->|确认是 TA| P03
        P03 -->|更新动态| P06
        P06 -->|宠物卡| P04
        P04 -.->|Tag 为天使时显示| P09
    end

    P01 -->|点击宠物| P04
    P02 -->|点击宠物| P04
    P01 -->|我的| P06
    P07 -->|确认匹配已知宠物| P04
    P08 --> P04

    PUSH(["iOS / Android 用户：宠物状态更新时发送系统通知<br/>网页用户暂不支持系统推送"])
    P03 -.->|状态更新| PUSH
    P05 -.->|安全事件发布或更新| PUSH

    classDef page fill:#EEF2FA,stroke:#222,stroke-width:2px,color:#252525;
    classDef action fill:#E8DFFF,stroke:#222,stroke-width:2px,color:#252525;
    classDef note fill:#E8DFFF,stroke:#222,stroke-width:2px,color:#252525;
    class P01,P02,P03,P04,P05,P06,P07,P08,P09,P10,ABUSE,LOST,SCRATCH,BITE page;
    class PUB action;
    class PUSH note;
```

## 转换说明

- 保留了白板中的 P01-P09 页面编号、主要页面内容和用户流转。
- 为减少交叉线，将页面重新分为“发布与识别”和“宠物档案与动态”两个区域。
- 白板中 P09 与 P04 的箭头方向不够明确，这里按文字语义整理为“宠物 Tag 为天使时，从详情页展示天使宠物卡片”。
- 系统通知按白板备注连接到“上传相遇”和“安全事件更新”两个状态变化来源。
- P02 探索页当前只有宠物和安全事件支持点击进入各自详情；地点等其他内容直接在探索页展示，不增加详情页跳转。
- P05 安全事件与 P06 我的图鉴之间不存在流转关系。
- P05 是安全事件的可编辑发布/建档页；P10 是独立的只读安全事件详情页。
- P01 地图首页和 P02 探索页都可以点击安全事件进入 P10；P10 通过高德地图 API 展示精确位置。
- 安全事件详情根据虐猫、丢失、抓人、咬人四种类型显示不同的提示文字。
