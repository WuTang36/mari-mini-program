# Mari - Bug 汇总文档

> v1.0.0 MVP | 汇总自开发/测试沟通过程（2026-08-28 ~ 2026-08-31）
> 规范参考：`Bug报告模板.md`（严重程度 Blocker/Critical/Major/Minor/Trivial；优先级 P0/P1/P2/P3；状态 New→Confirmed→In Progress→Fixed→Closed）

---

## 一、汇总表

### 宠物档案

| ID | 严重程度 | 优先级 | 标题 | 状态 |
|----|---------|--------|------|------|
| BUG-001 | Critical | P0 | 登录为虚假登录，未使用微信授权获取 openid | Fixed |
| BUG-002 | Minor | P1 | 性别图标（♂/♀）与文字不在同一水平线 | Fixed |
| BUG-003 | Minor | P1 | 日期选择组件偏移、未对齐屏幕 | Fixed |
| BUG-004 | Minor | P2 | 保存按钮文字未居中 | Fixed |
| BUG-005 | Critical | P0 | 添加宠物功能失效 | Fixed |
| BUG-006 | Critical | P0 | 编辑宠物功能失效 | Fixed |
| BUG-007 | Critical | P0 | 缺少左滑删除已添加宠物功能 | Fixed |
| BUG-008 | Minor | P2 | 名字输入框被限制 10 个字符 | Fixed |
| BUG-009 | Major | P0 | 品种选择大类后浮层消失，无法选子类 | Fixed |
| BUG-010 | Major | P0 | 品种无法自定义 | Fixed |
| BUG-011 | Minor | P1 | 生日选择器默认定位非今天 | Fixed |
| BUG-012 | Major | P0 | 「生日不记得」功能未实现 | Fixed |
| BUG-013 | Critical | P0 | 登录云函数未部署，callFunction 报 -501000 | Fixed |
| BUG-014 | Critical | P0 | pets 集合不存在，报 -502005 | Fixed（需创建集合） |
| BUG-015 | Major | P0 | 添加宠物保存失败（无反馈） | Fixed |
| BUG-016 | Minor | P2 | 首页添加首只宠物横幅副标题换行到第一行 | Fixed |
| BUG-017 | Critical | P0 | 云开发环境未配置 | Fixed |
| BUG-018 | Major | P0 | login 云函数无法「上传并部署：云端安装依赖」 | Fixed（部署方式说明） |
| BUG-019 | Major | P1 | 进入宠物档案页报参数异常 | Fixed |
| BUG-020 | Major | P1 | 品种弹窗点击其他热区即消失 | Fixed |
| BUG-021 | Critical | P0 | 保存宠物报 -501007 invalid parameters: _openid | Fixed |
| BUG-022 | Critical | P0 | 登录云函数缺 wx-server-sdk，报 -504002 | Fixed |
| BUG-023 | Major | P0 | 调试器报 wx://not-found | Fixed |
| BUG-024 | Major | P0 | 调试器报 @swc/runtime 未定义 | Fixed |
| BUG-025 | Critical | P0 | app.json renderer 配置报 code 10009 | Fixed |
| BUG-026 | Major | P1 | 编辑宠物时未回填宠物信息、标题未改 | Fixed |
| BUG-027 | Major | P1 | 体重信息未存储，编辑后仍为 0 | Fixed |
| BUG-028 | Major | P1 | 生日选择器默认今年 1 月 1 日而非今天 | Fixed |

### 疫苗本

| ID | 严重程度 | 优先级 | 标题 | 状态 |
|----|---------|--------|------|------|
| BUG-029 | Critical | P0 | 新增疫苗成功但列表无记录 | Fixed |
| BUG-030 | Critical | P0 | 保存疫苗报宠物不存在 | Fixed |
| BUG-031 | Critical | P0 | 添加疫苗记录报宠物信息异常 | Fixed |
| BUG-032 | Minor | P2 | 疫苗本图片上传后无查看入口 | Fixed |

### 病史备注

| ID | 严重程度 | 优先级 | 标题 | 状态 |
|----|---------|--------|------|------|
| BUG-033 | Major | P1 | 病史宠物卡片未用上传的照片（emoji 兜底） | Fixed |
| BUG-034 | Major | P1 | 病史日期选择器未对齐屏幕、不默认今天 | Fixed |
| BUG-035 | Critical | P0 | 保存后病史记录未写入数据库 | Fixed |
| BUG-036 | Minor | P2 | 病史附件照片无缩略图/预览入口 | Fixed |

### 血统信息

| ID | 严重程度 | 优先级 | 标题 | 状态 |
|----|---------|--------|------|------|
| BUG-037 | Major | P1 | 血统信息保存仅 toast、未写库 | Fixed |
| BUG-038 | Major | P1 | 血统证书照片未上传云存储 | Fixed |
| BUG-039 | Minor | P1 | 血统预览页 UI 过高、无返回按钮 | Fixed |
| BUG-040 | Major | P1 | 血统信息无必填校验 | Fixed |

### 成长日记 / 成长相册

| ID | 严重程度 | 优先级 | 标题 | 状态 |
|----|---------|--------|------|------|
| BUG-041 | Major | P1 | 调试器 WXS Error gdc(t,"nv_") | Fixed（规避） |
| BUG-042 | Major | P1 | 预留标签点击无效，需填充到自定义 | Fixed |
| BUG-043 | Critical | P0 | 日记新增后相册不展示（缺 type 字段） | Fixed |
| BUG-044 | Major | P1 | 上传照片/视频可多选但只生效最后一个 | Fixed（限制单文件） |
| BUG-045 | Major | P1 | 相册视频无法点击预览 | Fixed |
| BUG-046 | Minor | P2 | 上传视频无时长限制 | Fixed（限 15s） |
| BUG-047 | Major | P1 | 相册预览视频加载失败（cloud:// 需转临时链接） | Fixed |
| BUG-048 | Major | P1 | 类型标签筛选失效（中文 vs 英文 type） | Fixed |
| BUG-049 | Minor | P2 | 最新日记未置顶（缺 createdAt 次级排序） | Fixed |
| BUG-050 | Minor | P2 | 写日记按钮随内容滚动 | Fixed（固定右下角） |
| BUG-051 | Minor | P2 | 相册内容增多无滚动加载 | Fixed（分页） |
| BUG-052 | Minor | P2 | 顶部宠物/类型标签不吸顶 | Fixed（固定头部） |
| BUG-053 | Minor | P2 | 视频封面用 emoji，无首帧 | Fixed |
| BUG-054 | Minor | P3 | 切换宠物后类型筛选未重置 | Fixed |
| BUG-055 | Major | P1 | 相册加载报 Cannot read properties of undefined (date) | Fixed |

### 健康提醒

| ID | 严重程度 | 优先级 | 标题 | 状态 |
|----|---------|--------|------|------|
| BUG-056 | Critical | P0 | 订阅提醒未用云函数实现 | Fixed |
| BUG-057 | Major | P1 | 全部已读按钮点击后消失、刷新恢复 | Fixed |
| BUG-058 | Major | P1 | 生日提醒缺失（模板/策略） | Fixed |
| BUG-059 | Major | P1 | 订阅只弹一个授权框 | Fixed（逐个请求） |
| BUG-060 | Major | P1 | subscriptions 集合不存在报错刷屏 | Fixed（容错） |
| BUG-061 | Major | P1 | requestSubscribeMessage tap gesture 报错 | Fixed（单次传多模板） |

### 我的 / 登录 / 个人资料

| ID | 严重程度 | 优先级 | 标题 | 状态 |
|----|---------|--------|------|------|
| BUG-062 | Critical | P0 | 登录按钮过长挤压「已陪伴 X 只小可爱」 | Fixed |
| BUG-063 | Major | P1 | 登录后头像/名称与微信账号不一致 | Fixed |
| BUG-064 | Major | P1 | 随机昵称每次登录变化 | Fixed（绑定 openid 生成一次） |
| BUG-065 | Major | P1 | 头像未用微信虚拟头像（emoji 占位） | Fixed |
| BUG-066 | Minor | P2 | 个人信息编辑页头像占位过大 | Fixed |
| BUG-067 | Minor | P2 | 个人信息头像昵称左右不对称 | Fixed（改上下两行） |

### 通用 / 编译环境

| ID | 严重程度 | 优先级 | 标题 | 状态 |
|----|---------|--------|------|------|
| BUG-068 | Major | P1 | ENOENT wxfile:/tmp 临时路径图片报错 | Fixed |
| BUG-069 | Major | P1 | 云存储图片加载 ERR_HTTP2_PING_FAILED | Fixed（降级 + 环境建议） |
| BUG-070 | Minor | P2 | 宠物头像兜底图案用 emoji | Fixed（换 Logo.png） |

---

## 二、Bug 详情（现象 / 根因 / 修复方式）

### 宠物档案

#### BUG-001 登录虚假
- **现象**：登录未使用微信授权，openid 缺失。
- **根因**：早期登录为 mock，未接入云开发 `wx.cloud.callFunction`。
- **修复**：`app.js` 初始化 `wx.cloud.init` 并调用 `login` 云函数，返回 `OPENID` 存入 `globalData.openid`。

#### BUG-002 性别图标不水平
- **现象**：♂/♀ 符号低于「公/母」文字。
- **根因**：图标与文字基线不一致，缺少 flex 对齐。
- **修复**：`.gender-symbol` 加 `vertical-align: middle; line-height: 1`，选项用 `inline-flex + align-items: center`。

#### BUG-003 / BUG-034 日期选择器偏移
- **现象**：picker-view 列文字偏移、未对齐屏幕。
- **根因**：列内文字未居中，遮罩未铺满。
- **修复**：`indicator-style="height: 50px"` + `.picker-item` 居中 + 遮罩 `width: 100%`。

#### BUG-005 / BUG-006 添加/编辑宠物失效
- **现象**：保存无效果。
- **根因**：数据层仍依赖本地 `mock.js`，未接云数据库。
- **修复**：`savePet` 改 `db.collection('pets').add/update`；编辑模式从云端 `doc(id).get()` 回填。

#### BUG-007 无左滑删除
- **现象**：宠物卡片无法左滑删除。
- **根因**：未实现手势。
- **修复**：`touchstart/touchmove/touchend` 左滑露出「删除」→ 二次确认 → `remove()`。

#### BUG-009 品种大类浮层消失
- **现象**：切大类 Tab 后浮层关闭。
- **根因**：`bind:tap` 冒泡到遮罩触发 `hideBreedSheet`。
- **修复**：改为 `catch:tap` 阻止冒泡。

#### BUG-010 品种无法自定义
- **现象**：没有自定义品种入口。
- **根因**：品种列表无自定义项。
- **修复**：末尾加「其他（自定义）」→ 弹窗输入 → 保存用自定义值覆盖 `form.breed`。

#### BUG-011 / BUG-026 / BUG-028 生日/编辑回填
- **现象**：生日选择器默认非今天、编辑宠物空页。
- **根因**：`initDatePicker` 硬编码索引；编辑模式 `_initFromQuery` 未生效。
- **修复**：用 `new Date()` 计算今天索引；编辑模式 `onLoad` 接参并 `loadPet` 回填。

#### BUG-012 生日不记得
- **现象**：无「生日未知/估算年龄」功能。
- **根因**：表单缺该交互。
- **修复**：增加「我不知道」与「估算年龄」选项，保存 `birthday` 为空 + `birthdayEstimateAge`。

#### BUG-013 ~ BUG-017 云开发接入
- **现象**：登录 -501000、集合不存在 -502005、环境未配置、保存失败。
- **根因**：云环境未初始化、`login` 未部署、`pets` 集合未创建。
- **修复**：`wx.cloud.init({ env: 'cloud1-d7gq5krzxedfe3677' })`；部署 `login`；创建 `pets` 集合（仅创建者可读写）。

#### BUG-021 保存宠物 _openid 冲突
- **现象**：-501007 invalid parameters: _openid。
- **根因**：手动写入系统保留字段 `_openid`。
- **修复**：`savePet` 删除 `_openid` 字段，由云数据库自动填充。

#### BUG-022 云函数缺依赖
- **现象**：-504002 Cannot find module 'wx-server-sdk'。
- **根因**：部署未选「云端安装依赖」。
- **修复**：锁定 `"wx-server-sdk": "~2.6.3"`，部署选「上传并部署：云端安装依赖」。

#### BUG-023 / BUG-024 / BUG-025 Skyline 配置
- **现象**：`wx://not-found`、`@swc/runtime` 未定义、app.json code 10009。
- **根因**：Skyline 开启但 `app.json` 缺少 `rendererOptions`。
- **修复**：`app.json` 补 `renderer: skyline` + `rendererOptions.skyline` + `componentFramework: glass-easel`。

#### BUG-027 体重未存储
- **现象**：体重保存后编辑仍为 0。
- **根因**：`pet-form` 保存时未把体重写入 `weight` 字段。
- **修复**：`savePet` 携带 `weight`；编辑回填。

### 疫苗本（BUG-029 ~ BUG-032）
- **现象**：新增疫苗成功但列表无记录 / 报宠物不存在 / 宠物信息异常。
- **根因**：`saveRecord` 未写库（仅 toast）；`petId` 通过 `getCurrentPages` 获取不可靠。
- **修复**：表单 `onLoad(options)` 接 `petId`；保存 `getPet → push vaccineRecords → updatePet`；列表 `onLoad` 接参并加载。
- **BUG-032**：疫苗本图片无查看入口 → 列表加缩略图 + `previewImage`。

### 病史备注（BUG-033 ~ BUG-036）
- **现象**：卡片未用上传照片、日期选择器不默认今天、保存不写库、无缩略图。
- **根因**：与疫苗本同源（未写库、`petId` 获取方式、日期硬编码、无预览）。
- **修复**：`saveRecord` 写 `medicalRecords`；`onLoad` 接参；日期动态计算默认今天；列表加照片缩略图 + 预览。

### 血统信息（BUG-037 ~ BUG-040）
- **现象**：保存只 toast、证书照片未上传、预览页 UI 过高无返回、无必填。
- **根因**：`saveRecord` 未调 `updatePet`；`uploadPhoto` 未传云存储；预览页未注册 `navigation-bar` 组件。
- **修复**：保存 `updatePet(petId, { pedigreeInfo })`；照片 `cloud.uploadFile`；预览页注册导航栏 + 压缩卡片；必填校验（证书编号/父/母品种）。

### 成长日记 / 相册（BUG-041 ~ BUG-055）
- **BUG-041 WXS 报错**：Skyline 内部 WXS 事件错误，规避：媒体预览区分图片/视频（视频用 ▶️ 占位，不用 `<image>` 加载视频文件）。
- **BUG-042 标签点击**：`toggleTag` 改为 `fillTag`，点击预留标签自动填充到自定义输入框。
- **BUG-043 相册不展示**：`saveDiary` 未写 `type`，且 album 用 `diary.type` 分支渲染 → 补 `type`（photo/video/diary）与 `tag`。
- **BUG-044 多选只传最后一个**：`count` 限制为 1，已有媒体提示「最多上传 1 个」。
- **BUG-045 / BUG-047 视频预览失败**：`cloud://` 直接给 `previewMedia` 不生效 → 先 `getTempFileURL` 转临时链接再播放。
- **BUG-046 视频时长**：拍摄 `maxDuration: 15`，相册选择校验 `duration > 15` 拦截。
- **BUG-048 筛选失效**：中文筛选值 vs 英文 `type` 不匹配 → 加映射 `{照片: photo, 视频: video, 日记: diary}`。
- **BUG-049 排序**：仅按 `date`，同日无法区分 → `saveDiary` 写 `createdAt`，按 `date` 降序 + `createdAt` 降序。
- **BUG-050 / BUG-052 布局**：FAB 移出 scroll-view 固定右下角；宠物/筛选头部固定（`flex: none`）。
- **BUG-051 分页**：`getDiaries(petId, skip, limit)` + `scrolltolower` 加载更多。
- **BUG-053 视频封面**：`<video controls=false>` 渲染首帧，`getTempFileURL` 转链接。
- **BUG-054 筛选重置**：`selectPet` 同时 `currentFilter: '全部'`。
- **BUG-055 date 崩溃**：`groupByMonth` 遇 `date` 缺失抛错 → 容错跳过无日期/非法日期记录。

### 健康提醒（BUG-056 ~ BUG-061）
- **BUG-056 订阅未用云函数**：新建 `sendReminder` 云函数（定时触发器每天 8 点）+ `wx.requestSubscribeMessage`；模板 ID：疫苗/驱虫 `DG-B5rqPc65CeE8eo0JjcdNrQd90dc9wakSo5auDZ7U`、生日 `n2U04kHIkdjq_vz4fxYnmqnEVOx6xVAD37debwkw6Uk`；到期前 7 天/当天、生日前 3 天/当天各一次，`reminder_sends` 去重。
- **BUG-057 全部已读**：`read` 状态原为动态计算 → 持久化到 `reminder_reads` 集合，按钮常驻（有提醒时始终显示）。
- **BUG-059 只弹一个框**：`requestSubscribeMessage` 一次只弹一个 → 逐个模板递归请求。
- **BUG-060 集合缺失**：`getSubscribeStatus/setSubscribeStatus` 对 `collection not exists` 静默容错。
- **BUG-061 tap gesture**：递归第二次调用脱离手势上下文 → 改回一次调用传全部模板。

### 我的 / 登录 / 个人资料（BUG-062 ~ BUG-067）
- **BUG-062 登录按钮过长**：按钮缩小贴右，不挤压「已陪伴 X 只小可爱」。
- **BUG-063 头像名称不一致**：登录后统一从云端 `users` 读取并写入 `globalData`。
- **BUG-064 随机昵称变化**：昵称首次生成后存云数据库，后续登录按 openid 复用，不再变化。
- **BUG-065 虚拟头像**：登录用微信返回头像（`wx.getUserProfile` → 上传云存储），不再用 emoji。
- **BUG-066 / BUG-067 资料编辑 UI**：头像占位改 80rpx 小圆 + 「点击更换」注释；头像/昵称改上下两行布局。

### 通用 / 编译环境（BUG-068 ~ BUG-070）
- **BUG-068 ENOENT wxfile**：`wxfile://` 临时路径被 Skyline 当文件路径加载 → 数据层 `sanitizePetImages` 统一只保留 `cloud://`；头像/照片上传成功后才渲染。
- **BUG-069 HTTP2 PING FAILED**：开发者工具网络层错误 → 所有头像 `<image>` 加 `binderror` 回退占位；建议清缓存/换网络/真机验证。
- **BUG-070 兜底图案**：宠物头像 emoji 兜底替换为 `/Logo.png`（7 处页面 + 样式同步）。

---

## 三、遗留事项（需部署/创建）

| 事项 | 说明 |
|------|------|
| 云函数部署 | `login`、`sendReminder`、`submitFeedback`、`getMyFeedback` 需右键上传部署（云端安装依赖） |
| 云数据库集合 | `pets`、`users`、`diaries`、`feedbacks`、`reminder_reads`、`reminder_sends`、`subscriptions`（权限：仅创建者可读写） |
| 订阅消息模板 | 已配置：到期提醒 + 生日提醒两个模板 ID |
| 正式版推送 | `sendReminder` 云函数 `MINIPROGRAM_STATE` 需由 `developer` 改为 `formal` |
| 视频时长 | 写日记视频限制 15 秒（拍摄 + 相册双校验） |
