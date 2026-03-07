# 需求文档

## 简介

OpenClaw Club 是一个面向全球用户的 OpenClaw 服务平台，提供从安装部署到企业定制的全生命周期服务。OpenClaw 是当前最热门的开源 AI Agent 项目（247,000+ GitHub Stars），但其快速普及带来了安装复杂、安全风险高、缺乏专业支持等市场痛点。本平台通过 AI 对话式客服引导下单、标准化安装服务（默认接入 AI Token 聚合平台）、预配置技能包订阅、企业级解决方案、培训认证体系和全球化运营，构建可信赖的 OpenClaw 服务生态。其中，AI Token 聚合平台（Token_Hub）作为核心持续收入引擎，用户使用 OpenClaw 产生的每一次 AI 调用都通过 Token_Hub 路由和计费，形成随用户量自然增长的长尾收入。

## 术语表

- **Platform**：OpenClaw Club 全球化服务平台，即本系统
- **User**：平台的注册用户，包括个人用户和企业用户
- **Individual_User**：个人用户，包括开发者、产品经理、创业者等
- **Enterprise_User**：企业用户，包括媒体、金融、互联网、电商、教育等行业客户
- **Certified_Engineer**：通过平台认证的 OpenClaw 安装工程师
- **Partner**：平台的合作伙伴，包括区域合作伙伴、渠道合作伙伴和社区贡献者
- **OCSAS**：OpenClaw Club Security Audit Standard，平台定义的三级安全配置标准（Level 1 个人级、Level 2 团队级、Level 3 企业级）
- **Configuration_Pack**：预配置的技能包，包括生产力增强包、开发者工具包和企业解决方案包
- **Installation_Service**：远程安装 OpenClaw 核心系统的服务，分为标准、专业和企业三个等级
- **Certification_System**：平台的培训认证体系，包括 OCP、OCE、OCEA 和 AI 实施工程师证书
- **Order_System**：平台的订单管理系统，处理服务购买、订阅和支付
- **Subscription_Service**：配置包的月度或年度订阅服务
- **Localization_Engine**：平台的多语言和区域化处理引擎
- **Logto**：开源身份认证基础设施（github.com/logto-io/logto），基于 OIDC/OAuth 2.1，提供社交登录、MFA、RBAC 和多租户能力，作为平台的统一认证和授权引擎
- **RBAC**：Role-Based Access Control，基于角色的访问控制，通过 Logto 内置的 RBAC 系统管理平台各角色的权限
- **Admin**：平台管理员，拥有平台全局管理权限
- **Support_Agent**：客服人员，负责处理工单和客户支持
- **Trainer**：培训讲师，负责课程内容管理和认证考试
- **External_Service_Platform**：第三方服务平台（如 Fiverr、Upwork、猪八戒、闲鱼等），前期用于解决服务供给冷启动，对接外部服务商承接安装订单
- **AI_Concierge**：平台 AI 智能客服，通过自然对话方式了解用户需求、推荐服务方案、引导下单，替代传统表单填写，提升用户体验
- **Token_Hub**：OpenClaw Club AI Token 聚合平台，聚合多家 AI 模型提供商（OpenAI、Anthropic、Google、国产大模型等）的 API 调用能力，安装 OpenClaw 时默认接入，用户使用 OpenClaw 产生的 AI 调用通过 Token_Hub 路由和计费，形成持续收入
- **Hardware_Store**：平台硬件商城，销售预装 OpenClaw 的软硬件一体机和推荐硬件设备
- **ClawBox**：OpenClaw Club 品牌的软硬件一体机产品线，预装 OpenClaw + Token_Hub + 安全配置，开箱即用

## 需求

### 需求 1：用户注册与身份认证（基于 Logto）

**用户故事：** 作为一名用户，我希望能够通过邮箱或第三方平台快速注册登录，以便使用平台提供的各项服务。

**技术方案：** 采用开源身份认证平台 [Logto](https://github.com/logto-io/logto)（MIT 协议）自部署，统一管理认证、授权和用户身份。Logto 基于 OIDC/OAuth 2.1 标准，内置 RBAC、多租户、社交登录和 MFA 能力。

#### 验收标准

1. THE Platform SHALL 通过 Logto 提供统一的注册登录入口，支持以下认证方式：邮箱+密码、GitHub 登录、Google 登录、微信登录和 Apple 登录
2. WHEN User 通过邮箱注册时，Logto SHALL 发送邮箱验证码完成验证并创建账户
3. WHEN User 通过第三方社交平台登录时，Logto SHALL 通过 OIDC/OAuth 协议完成授权并自动创建或关联平台账户
4. THE Platform SHALL 支持账户关联：同一用户可将多个社交登录方式绑定到同一账户
5. WHEN User 首次登录后，THE Platform SHALL 引导 User 选择账户类型（Individual_User 或 Enterprise_User）并补充必要的个人资料
6. WHEN Enterprise_User 完成账户类型选择后，THE Platform SHALL 要求补充企业名称、行业、规模等企业信息
7. IF User 通过社交登录且该社交账号已关联现有账户，THEN Logto SHALL 直接登录该现有账户
8. WHEN User 请求重置密码，Logto SHALL 发送密码重置邮件，链接有效期为 24 小时
9. THE Platform SHALL 通过 Logto 支持多因素认证（MFA），Enterprise_User 和 Admin 账户强制启用 MFA
10. THE Platform SHALL 通过 Logto 的会话管理实现单点登录（SSO），User 登录一次即可访问平台所有子系统

### 需求 1.1：角色与权限管理（RBAC）

**用户故事：** 作为平台管理员，我希望能够基于角色精细化管理各类用户的访问权限，以便确保平台安全和业务隔离。

**技术方案：** 通过 Logto 内置的 RBAC 系统定义角色和权限，结合 Logto 的 Organization（多租户）功能实现企业级权限隔离。

#### 角色定义

平台定义以下核心角色，每个角色拥有不同的权限范围：

| 角色 | 说明 | 关键权限 |
|------|------|----------|
| Admin | 平台超级管理员 | 全局管理：用户管理、角色分配、系统配置、数据报表、财务结算 |
| Support_Agent | 客服人员 | 工单处理、用户查询（只读）、知识库管理 |
| Trainer | 培训讲师 | 课程内容管理、考试管理、学员进度查看 |
| Certified_Engineer | 认证安装工程师 | 接收安装订单、提交服务报告、查看个人收入和结算 |
| Partner_Community | 社区贡献者 | 提交配置包、查看配置包销售数据和收入 |
| Partner_Regional | 区域合作伙伴 | 查看区域订单、管理本地服务团队、查看区域收入 |
| Enterprise_User | 企业用户 | 购买服务、管理企业成员、查看企业订单和报表、提交工单 |
| Individual_User | 个人用户 | 购买服务、管理个人订阅、提交工单 |

#### 验收标准

1. THE Platform SHALL 通过 Logto RBAC 系统定义上述八种核心角色，每种角色关联一组明确的权限（Permissions）
2. WHEN User 注册并选择账户类型后，THE Platform SHALL 自动分配对应的默认角色（Individual_User 或 Enterprise_User）
3. WHEN Admin 审核通过 Partner 申请后，THE Platform SHALL 为该用户追加对应的 Partner 角色（Partner_Community 或 Partner_Regional）
4. WHEN User 通过认证考试获得 Certified_Engineer 资质后，THE Platform SHALL 为该用户追加 Certified_Engineer 角色
5. THE Platform SHALL 支持一个用户同时拥有多个角色（如一个用户既是 Individual_User 又是 Certified_Engineer）
6. WHEN User 访问平台功能时，THE Platform SHALL 通过 Logto 的 RBAC 权限检查确定该用户是否有权执行该操作
7. IF User 尝试访问无权限的功能，THEN THE Platform SHALL 返回 403 Forbidden 并显示权限不足提示
8. WHEN Admin 修改某角色的权限配置，THE Platform SHALL 实时生效，已登录用户的下次请求即按新权限执行
9. THE Platform SHALL 通过 Logto 的 Organization 功能为每个 Enterprise_User 创建独立的组织空间，实现企业内部成员管理和数据隔离
10. WHEN Enterprise_User 邀请团队成员加入组织时，THE Platform SHALL 通过 Logto Organization 发送邀请链接，被邀请人加入后自动继承组织内的角色权限


### 需求 2：安装服务管理（参考闪修侠 O2O 模式）

**用户故事：** 作为一名用户，我希望能够通过和 AI 客服自然对话就完成下单，由平台智能派单给工程师，全程可追踪服务进度。

**商业模式参考：** 借鉴闪修侠的 O2O 上门维修模式——AI 对话式需求采集 → 智能推荐服务方案 → 用户确认下单 → 平台智能派单 → 工程师接单 → 远程服务（默认接入 Token_Hub）→ 服务验收 → 质保期 → 用户评价 → 收入结算。平台作为服务撮合方和质量担保方，工程师作为独立服务提供者。

#### 验收标准

1. THE Platform SHALL 展示三个安装服务等级：标准安装包（$99）、专业安装包（$299）和企业安装包（$999 起），每个等级清晰展示服务内容、预计时长和质保期
2. WHEN User 表达安装意向时，AI_Concierge SHALL 通过自然对话方式了解 User 的设备环境、操作系统、网络环境、使用场景和期望服务时间，无需 User 填写任何表单
3. WHEN AI_Concierge 收集到足够信息后，SHALL 自动推荐最适合的安装服务等级，并生成服务方案摘要供 User 确认
4. WHEN User 确认服务方案并完成支付后，THE Order_System SHALL 将款项冻结至平台担保账户（而非直接支付给工程师），待服务验收完成后再进行结算
5. WHEN 订单创建后，THE Platform SHALL 通过智能派单系统根据以下因素自动匹配 Certified_Engineer：工程师技能等级、当前接单量、用户时区、历史服务评分和响应速度
6. IF 智能派单后 30 分钟内无工程师接单，THEN THE Platform SHALL 扩大匹配范围并向更多工程师推送订单；IF 60 分钟内仍无人接单，THEN THE Platform SHALL 通知运营人员介入并启动第三方平台分发流程
7. WHEN Certified_Engineer 接单后，THE Platform SHALL 向 User 推送工程师信息（姓名、认证等级、历史评分）并建立服务沟通通道
8. WHILE 安装服务进行中，THE Platform SHALL 提供实时服务进度追踪，状态包括：已接单 → 环境评估中 → 安装中 → 配置中 → 测试中 → 待验收
9. WHEN 标准安装包订单创建后，THE Platform SHALL 为 User 提供远程安装 OpenClaw 核心系统、基础安全配置（OCSAS Level 1）、常用工具集成和 30 天质保期
10. WHEN 专业安装包订单创建后，THE Platform SHALL 在标准安装包基础上额外提供 OCSAS Level 2 安全配置、个性化技能配置、90 天质保期和安全审计报告
11. WHEN 企业安装包订单创建后，THE Platform SHALL 在专业安装包基础上额外提供 OCSAS Level 3 安全配置、多用户协作配置、私有模型集成、SLA 保障和 180 天质保期
12. WHEN 安装过程中，Certified_Engineer SHALL 默认将 User 的 OpenClaw 实例接入平台 Token_Hub 作为 AI 模型调用网关，并告知 User 可享受聚合优惠价格
13. WHEN Certified_Engineer 完成安装服务，THE Platform SHALL 生成服务交付报告（含安装清单、配置项、测试结果截图）并请求 User 在线确认验收
14. IF User 在服务交付后 7 天内未确认验收且未提出异议，THEN THE Platform SHALL 自动确认验收并完成订单
15. WHEN User 确认验收后，THE Platform SHALL 要求 User 对服务进行评价（1-5 星评分 + 文字评价），评价内容包括：服务态度、技术能力、响应速度和整体满意度
16. WHEN 订单验收完成后，THE Order_System SHALL 从担保账户释放款项，按照分成比例（Certified_Engineer 80%、平台 20%）进行收入分配
17. WHILE 质保期内，IF User 报告安装相关问题，THEN THE Platform SHALL 免费安排原 Certified_Engineer 或同等级工程师进行返修服务
18. IF 质保期内同一订单返修超过 2 次，THEN THE Platform SHALL 启动服务质量调查并为 User 提供全额退款或更换高等级工程师的选项
19. WHEN 平台自有 Certified_Engineer 不足以承接订单时，THE Platform SHALL 支持将安装服务订单路由至已对接的第三方服务平台（如 Fiverr、Upwork、猪八戒等）上的认证服务商
20. THE Platform SHALL 维护第三方服务平台的服务商白名单，仅允许通过平台资质审核的外部服务商承接订单
21. WHEN 第三方服务商完成安装服务后，THE Platform SHALL 按照与自有工程师相同的验收流程和质量标准进行服务交付确认

### 需求 3：配置包订阅服务

**用户故事：** 作为一名用户，我希望能够订阅预配置的技能包，以便持续增强 OpenClaw 的功能。

#### 验收标准

1. THE Platform SHALL 提供三类 Configuration_Pack：生产力增强包（$49/月）、开发者工具包（$79/月）和企业解决方案包（$199/月起）
2. WHEN User 选择 Configuration_Pack 并完成支付，THE Subscription_Service SHALL 激活订阅并立即部署配置包至 User 的 OpenClaw 实例
3. THE Subscription_Service SHALL 支持月度和年度两种订阅周期，年度订阅享受 2 个月免费优惠
4. WHEN 订阅到期前 7 天，THE Platform SHALL 向 User 发送续费提醒通知
5. WHEN 订阅到期且 User 未续费，THE Subscription_Service SHALL 停止配置包服务并保留 User 数据 30 天
6. WHEN Configuration_Pack 有版本更新，THE Subscription_Service SHALL 自动为活跃订阅用户推送更新
7. IF 配置包部署失败，THEN THE Platform SHALL 记录错误日志、通知技术支持团队并向 User 发送部署失败通知


### 需求 4：OCSAS 安全标准管理

**用户故事：** 作为一名用户，我希望平台能够按照标准化的安全等级配置我的 OpenClaw 系统，以便确保系统安全可靠。

#### 验收标准

1. THE Platform SHALL 定义并维护三级 OCSAS 安全标准：Level 1（个人级）、Level 2（团队级）和 Level 3（企业级）
2. WHEN 执行 OCSAS Level 1 配置时，THE Platform SHALL 完成防火墙配置、基础权限控制和访问日志记录
3. WHEN 执行 OCSAS Level 2 配置时，THE Platform SHALL 在 Level 1 基础上额外完成数据加密传输、多因素认证和安全审计日志
4. WHEN 执行 OCSAS Level 3 配置时，THE Platform SHALL 在 Level 2 基础上额外完成私有网络隔离、合规性检查（GDPR/SOC2）和入侵检测
5. WHEN 安全配置完成后，THE Platform SHALL 生成安全审计报告，包含配置项清单、合规状态和风险评估
6. IF 安全配置过程中检测到已知漏洞，THEN THE Platform SHALL 立即通知 User 并提供修复建议

### 需求 5：企业服务管理

**用户故事：** 作为一名企业用户，我希望能够获取定制开发、托管服务和咨询服务，以便将 OpenClaw 深度集成到企业业务流程中。

#### 验收标准

1. WHEN Enterprise_User 提交定制开发需求，THE Platform SHALL 在 2 个工作日内提供需求评估和报价方案
2. WHEN Enterprise_User 确认定制开发方案并完成支付，THE Platform SHALL 创建项目并分配专属项目团队
3. WHERE Enterprise_User 选择托管服务，THE Platform SHALL 提供 7x24 小时系统监控、性能优化、安全更新和数据备份
4. WHILE 托管服务处于活跃状态，THE Platform SHALL 每月生成运维报告，包含系统可用性、性能指标和安全事件摘要
5. WHEN Enterprise_User 请求咨询服务，THE Platform SHALL 提供 OpenClaw 战略规划、ROI 分析和实施路线图
6. THE Platform SHALL 支持与企业现有系统（ERP、CRM、OA）的集成，并提供标准化的 API 接口
7. IF 托管服务中系统可用性低于 SLA 约定的 99.9%，THEN THE Platform SHALL 按照 SLA 条款向 Enterprise_User 提供服务补偿

### 需求 6：培训认证体系

**用户故事：** 作为一名用户，我希望能够参加 OpenClaw 培训课程并获取专业认证，以便提升技能并获得行业认可。

#### 验收标准

1. THE Platform SHALL 提供在线课程体系，包括基础入门（免费）、高级技能开发（$99）、企业部署最佳实践（$199）和安全配置管理（$149）
2. THE Certification_System SHALL 提供四级认证：OCP（$299）、OCE（$499）、OCEA（$799）和 AI 实施工程师证书（$1,499）
3. WHEN User 完成课程学习并通过在线考试（2 小时，80 分及格），THE Certification_System SHALL 颁发对应等级的电子证书
4. WHEN AI 实施工程师认证申请者完成理论考试和实操项目，THE Certification_System SHALL 颁发带有唯一编号的 AI 实施工程师证书（电子版和纸质版）
5. THE Certification_System SHALL 提供证书在线验证功能，任何人可通过证书编号查询证书真伪和有效状态
6. WHEN 证书有效期（2 年）到期前 60 天，THE Platform SHALL 通知持证人进行续证
7. IF 持证人未在有效期内完成续证要求（年度培训 + 5 个实际项目），THEN THE Certification_System SHALL 将证书状态标记为已过期
8. WHEN User 获得认证，THE Platform SHALL 将 User 列入官方认证人员名录


### 需求 7：工具集成管理

**用户故事：** 作为一名用户，我希望 OpenClaw 能够与我常用的工具集成，以便实现工作流自动化。

#### 验收标准

1. THE Platform SHALL 提供与 GitHub、飞书、钉钉的标准集成能力
2. WHEN User 配置工具集成时，THE Platform SHALL 通过 OAuth 2.0 协议完成第三方工具的授权连接
3. WHEN 工具集成连接成功，THE Platform SHALL 验证连接状态并显示集成状态为"已连接"
4. IF 工具集成连接失败，THEN THE Platform SHALL 显示具体错误原因并提供排查指南
5. WHERE Enterprise_User 需要私有模型集成，THE Platform SHALL 提供私有模型接入接口和配置向导
6. THE Platform SHALL 提供标准化的 API 文档，支持第三方开发者开发自定义集成插件

### 需求 8：多语言、时区与全球化支持

**用户故事：** 作为一名全球用户，我希望平台能够以我的母语和本地时区提供服务，以便无障碍地使用平台功能。

#### 验收标准

1. THE Localization_Engine SHALL 支持七种核心语言：中文、英文、日文、韩文、德文、法文和西班牙文
2. WHEN User 选择语言偏好，THE Platform SHALL 将所有界面元素、系统通知和帮助文档切换为对应语言
3. THE Platform SHALL 根据 User 的 IP 地址自动推荐对应的语言、区域和时区设置
4. THE Platform SHALL 为亚太区、北美区和欧洲区分别提供区域服务入口
5. WHERE User 位于欧洲区域，THE Platform SHALL 确保数据处理符合 GDPR 要求
6. THE Platform SHALL 支持各区域主流支付方式（支付宝/微信支付、Stripe/PayPal、SEPA 等）
7. WHEN User 提交客服请求，THE Platform SHALL 根据 User 的语言偏好和所在区域分配对应语种的客服人员
8. THE Platform SHALL 存储所有时间戳为 UTC 格式，并在前端根据 User 的时区偏好进行本地化显示
9. WHEN User 设置时区偏好后，THE Platform SHALL 将所有订单时间、工单时间、通知时间、课程安排和 SLA 计时按该时区显示
10. WHEN 安装服务订单分配 Certified_Engineer 时，THE Platform SHALL 优先匹配与 User 相同或相近时区的工程师，以确保服务沟通的时效性
11. THE Platform SHALL 在客服排班和工单响应 SLA 计算中考虑 User 所在时区的工作时间（当地时间 9:00-18:00 为标准工作时间）

### 需求 9：订单与支付管理（担保交易模式）

**用户故事：** 作为一名用户，我希望能够方便地完成服务购买和支付，并且资金由平台担保，服务验收后才结算给工程师，以便保障我的权益。

#### 验收标准

1. THE Order_System SHALL 支持一次性购买（安装服务、培训课程）和订阅购买（配置包）两种交易模式
2. WHEN User 提交订单，THE Order_System SHALL 生成唯一订单编号并记录订单详情（服务类型、金额、时间）
3. THE Order_System SHALL 集成多种支付方式：信用卡、PayPal、支付宝、微信支付和银行转账
4. WHEN 安装服务订单支付成功，THE Order_System SHALL 将款项冻结至平台担保账户，订单状态更新为"已支付·待派单"
5. WHEN 安装服务订单验收完成后，THE Order_System SHALL 从担保账户释放款项并按分成比例结算给 Certified_Engineer
6. IF 支付失败，THEN THE Order_System SHALL 保留订单 24 小时并允许 User 重新支付
7. WHEN User 在工程师接单前申请退款，THE Order_System SHALL 立即从担保账户全额退款
8. WHEN User 在服务进行中申请退款，THE Order_System SHALL 冻结订单并由运营人员介入协调，根据服务完成进度进行部分或全额退款
9. IF 质保期内服务出现问题且返修超过 2 次，THEN THE Order_System SHALL 支持全额退款
10. THE Order_System SHALL 为每笔交易生成电子发票，Enterprise_User 可申请增值税专用发票
11. WHILE 订阅服务处于活跃状态，THE Order_System SHALL 在每个计费周期自动扣款并发送扣款通知
12. THE Order_System SHALL 支持工程师端的收入明细查看，包括：待结算金额、已结算金额、担保中金额和历史收入趋势

### 需求 10：合作伙伴与第三方平台对接

**用户故事：** 作为一名合作伙伴，我希望能够加入平台生态并获取收入分成；作为平台运营者，我希望前期能对接现有服务平台解决服务供给冷启动问题。

#### 验收标准

1. THE Platform SHALL 支持三类 Partner 角色：社区贡献者、区域合作伙伴和认证安装工程师
2. WHEN Partner 提交合作申请，THE Platform SHALL 在 5 个工作日内完成资质审核并通知审核结果
3. WHEN 社区贡献者提交的 Configuration_Pack 通过审核并产生销售，THE Platform SHALL 按 70% 比例向贡献者分配收入
4. WHEN 区域合作伙伴促成本地服务订单，THE Platform SHALL 按 60% 比例向区域合作伙伴分配本地服务收入
5. WHEN Certified_Engineer 完成安装服务订单，THE Platform SHALL 按 80% 比例向 Certified_Engineer 分配安装服务收入
6. THE Platform SHALL 在每月 15 日前完成上月的分成结算和支付
7. THE Platform SHALL 为每位 Partner 提供收入仪表盘，实时展示订单数量、收入金额和结算状态
8. THE Platform SHALL 支持对接第三方服务平台（Fiverr、Upwork、猪八戒、闲鱼等），通过 API 或手动方式将平台订单分发至外部服务商
9. WHEN 平台自有 Certified_Engineer 无法在 4 小时内接单时，THE Platform SHALL 自动将订单标记为"可外部分发"，并通知运营人员通过第三方平台寻找服务商
10. THE Platform SHALL 维护外部服务商档案，记录其服务评分、完成率和客户反馈，作为后续订单分配的参考依据
11. WHEN 第三方平台服务商完成服务并通过平台质量验收后，THE Platform SHALL 支持将其转化为平台认证工程师（Certified_Engineer），简化认证流程


### 需求 11：客户支持与工单系统

**用户故事：** 作为一名用户，我希望在遇到问题时能够获得及时的技术支持，以便快速解决使用中的问题。

#### 验收标准

1. WHEN User 提交技术支持工单，THE Platform SHALL 生成唯一工单编号并根据服务等级分配响应优先级
2. WHEN 标准支持工单提交后，THE Platform SHALL 在 24 小时内提供首次响应
3. WHEN 优先支持工单提交后，THE Platform SHALL 在 4 小时内提供首次响应
4. WHILE Enterprise_User 的 SLA 处于活跃状态，THE Platform SHALL 提供 7x24 小时技术支持通道
5. WHEN 工单状态发生变更，THE Platform SHALL 通过邮件和站内消息通知 User
6. WHEN 工单解决后，THE Platform SHALL 请求 User 对服务质量进行评分（1-5 分）
7. IF 工单在承诺响应时间内未获得响应，THEN THE Platform SHALL 自动升级工单优先级并通知管理人员

### 需求 12：数据分析与报表

**用户故事：** 作为平台管理员，我希望能够查看业务运营数据，以便做出数据驱动的决策。

#### 验收标准

1. THE Platform SHALL 提供管理仪表盘，展示关键业务指标：活跃用户数、订单量、收入、客户满意度
2. THE Platform SHALL 按日、周、月、季度和年度维度生成业务报表
3. WHEN 管理员请求导出报表，THE Platform SHALL 支持 CSV 和 PDF 两种导出格式
4. THE Platform SHALL 按区域（亚太、北美、欧洲）分别统计业务数据
5. THE Platform SHALL 跟踪并展示用户转化漏斗数据：注册→试用→付费→续费各阶段的转化率
6. WHEN 关键业务指标出现异常波动（偏离 7 日均值超过 30%），THE Platform SHALL 向管理员发送预警通知

### 需求 13：平台安全与合规

**用户故事：** 作为一名用户，我希望平台能够保护我的数据安全和隐私，以便放心使用平台服务。

#### 验收标准

1. THE Platform SHALL 对所有数据传输使用 TLS 1.2 及以上版本加密
2. THE Platform SHALL 对用户敏感数据（密码、支付信息）进行加密存储
3. THE Platform SHALL 记录所有用户操作的审计日志，日志保留期限为 12 个月
4. WHEN User 请求删除个人数据，THE Platform SHALL 在 30 天内完成数据删除并通知 User
5. THE Platform SHALL 每季度执行一次安全漏洞扫描，并在发现高危漏洞后 48 小时内完成修复
6. IF 检测到异常登录行为（连续 5 次密码错误），THEN Logto SHALL 锁定账户 30 分钟并通知账户所有者
7. WHERE User 位于欧盟区域，THE Platform SHALL 在数据收集前获取 User 的明确同意（GDPR Cookie Consent）
8. THE Platform SHALL 通过 Logto 支持多因素认证（MFA），Enterprise_User 和 Admin 账户强制启用 MFA


### 需求 14：AI 智能客服（AI_Concierge）

**用户故事：** 作为一名用户，我希望通过自然对话就能完成咨询、下单和问题解决，而不需要填写繁琐的表单或在页面间跳转。

#### 验收标准

1. THE Platform SHALL 在所有页面提供 AI_Concierge 对话入口，User 可随时发起对话
2. WHEN User 表达安装需求时，AI_Concierge SHALL 通过自然对话逐步了解 User 的设备环境、操作系统、网络环境、使用场景和期望服务时间，对话过程自然流畅，不以问卷形式呈现
3. WHEN AI_Concierge 判断已收集到足够的需求信息后，SHALL 自动生成服务方案推荐（含服务等级、预估价格和服务内容），以卡片形式展示供 User 一键确认下单
4. AI_Concierge SHALL 支持多轮对话上下文记忆，User 可在对话中随时修改需求或追问细节
5. WHEN User 咨询培训、认证、配置包等非安装类服务时，AI_Concierge SHALL 提供对应的产品介绍和购买引导
6. WHEN AI_Concierge 无法解答 User 的问题时，SHALL 自动将对话转接至人工 Support_Agent，并将对话上下文完整传递
7. AI_Concierge SHALL 支持平台所有核心语言（中文、英文、日文、韩文、德文、法文、西班牙文），自动识别 User 的语言偏好
8. THE Platform SHALL 记录所有 AI_Concierge 对话日志，用于服务质量分析和 AI 模型持续优化
9. AI_Concierge SHALL 通过 Token_Hub 调用 AI 模型能力，其自身运行成本纳入平台运营成本

### 需求 15：AI Token 聚合平台（Token_Hub）

**用户故事：** 作为一名 OpenClaw 用户，我希望能够通过一个统一的入口使用多家 AI 模型的能力，享受聚合优惠价格，而不需要分别注册和管理多个 AI 服务商的 API Key。

**商业模式：** Token_Hub 是平台的核心持续收入引擎。安装 OpenClaw 时默认接入 Token_Hub 作为 AI 模型调用网关，用户每次使用 OpenClaw 进行 AI 对话、代码生成、数据分析等操作都会消耗 Token，平台从中赚取差价（批量采购价 vs 零售价）。这是一个随用户使用量自然增长的长尾收入模型。

#### 验收标准

1. THE Token_Hub SHALL 聚合多家主流 AI 模型提供商的 API 能力，包括但不限于：OpenAI（GPT 系列）、Anthropic（Claude 系列）、Google（Gemini 系列）以及国产大模型（通义千问、文心一言、DeepSeek 等）
2. WHEN Certified_Engineer 为 User 安装 OpenClaw 时，SHALL 默认将 Token_Hub 配置为 OpenClaw 的 AI 模型调用网关，User 无需自行申请各模型提供商的 API Key
3. THE Token_Hub SHALL 提供统一的 API 接口，兼容 OpenAI API 格式，OpenClaw 及其他客户端可无缝接入
4. THE Token_Hub SHALL 支持智能路由功能：根据任务类型、模型能力、响应速度和成本自动选择最优模型
5. WHEN User 使用 OpenClaw 产生 AI 调用时，Token_Hub SHALL 实时计量 Token 消耗并按平台定价计费
6. THE Token_Hub SHALL 提供多种充值和计费模式：按量付费（Pay-as-you-go）、月度套餐和企业包年
7. THE Token_Hub SHALL 为 User 提供用量仪表盘，实时展示：Token 消耗量、费用明细、模型使用分布和历史趋势
8. THE Token_Hub SHALL 通过批量采购获取模型提供商的优惠价格，并以低于各提供商官方零售价的价格向 User 提供服务，平台从差价中获取利润
9. IF User 希望使用自有 API Key 直连模型提供商，THEN THE Platform SHALL 允许 User 在 OpenClaw 设置中切换为自有 Key 模式，但需明确告知将失去 Token_Hub 的聚合优惠和智能路由能力
10. THE Token_Hub SHALL 对所有 API 调用进行安全审计，不存储 User 的对话内容，仅记录调用元数据（模型、Token 数、时间戳）用于计费
11. WHEN Token_Hub 检测到某模型提供商服务异常时，SHALL 自动将请求路由至备选模型，确保 User 的 OpenClaw 使用不中断
12. THE Token_Hub SHALL 为 Enterprise_User 提供专属的用量配额管理和成本控制功能，支持设置月度用量上限和预算告警

### 需求 16：硬件商城与软硬件一体机（Hardware_Store）

**用户故事：** 作为一名用户，我希望能够直接购买预装好 OpenClaw 的一体机设备，开箱即用，不需要自己折腾安装和配置。

**商业模式：** 硬件销售是安装服务的自然延伸。ClawBox 一体机预装 OpenClaw + Token_Hub + OCSAS 安全配置，用户收到即可使用。硬件利润 + 绑定 Token_Hub 持续消耗 = 一次性收入 + 长尾收入双重变现。同时销售推荐硬件（Mac Mini、NUC 等）赚取渠道佣金。

#### 验收标准

1. THE Platform SHALL 提供 Hardware_Store 硬件商城模块，展示和销售以下产品类别：ClawBox 品牌一体机、推荐硬件设备和硬件配件
2. THE Hardware_Store SHALL 提供 ClawBox 产品线，包括：ClawBox Lite（个人版，适合个人用户）、ClawBox Pro（专业版，适合团队和开发者）和 ClawBox Enterprise（企业版，适合企业级部署）
3. WHEN User 购买 ClawBox 一体机时，THE Platform SHALL 提供产品详情页，包含：硬件规格、预装软件清单、Token_Hub 赠送额度、质保信息和开箱指南
4. THE ClawBox 一体机 SHALL 预装 OpenClaw 最新稳定版、Token_Hub 网关配置、OCSAS Level 2 安全配置和基础配置包，用户开机联网后即可使用
5. WHEN User 购买 ClawBox 后，THE Platform SHALL 自动为该设备创建 Token_Hub 账户并赠送首月免费 Token 额度
6. THE Hardware_Store SHALL 支持展示和销售第三方推荐硬件（如 Mac Mini、Intel NUC 等），通过合作伙伴渠道链接或平台直销方式销售
7. WHEN User 购买推荐硬件时，IF 同时购买安装服务，THEN THE Platform SHALL 提供硬件+安装的捆绑优惠价格
8. THE Hardware_Store SHALL 支持全球物流配送，根据 User 所在区域自动匹配物流方案和预估配送时间
9. THE Hardware_Store SHALL 提供硬件产品的售后服务入口，包括：退换货申请、保修服务和技术支持
10. WHEN ClawBox 设备出现硬件故障时，THE Platform SHALL 提供保修期内免费维修或更换服务（保修期 12 个月）

### 需求 17：平台 UI 视觉与交互设计规范

**用户故事：** 作为一名用户，我希望平台界面现代、专业且易用，让我在使用过程中感到信赖和愉悦。

**设计理念：** 平台整体视觉风格定位为"科技感 + 温度感"——既体现 AI 技术的前沿感，又不失服务平台的亲和力。参考 Vercel/Linear 的简洁现代 SaaS 风格，硬件商城部分参考 Apple Store 的产品展示风格。AI 对话界面是核心交互入口，需做到自然流畅。

#### 验收标准

1. THE Platform SHALL 支持深色模式（Dark Mode）和浅色模式（Light Mode），默认跟随系统设置，User 可手动切换
2. THE Platform SHALL 采用统一的设计系统（Design System），包含：色彩体系、字体规范、间距系统、组件库和图标库
3. THE Platform 的主色调 SHALL 基于 OpenClaw 品牌色系，辅以渐变和微光效果体现 AI 科技感，同时保持足够的对比度满足可读性要求
4. THE Platform 的 AI_Concierge 对话界面 SHALL 作为核心交互入口，采用全屏或半屏对话式布局，支持富文本消息（代码块、卡片、按钮、图片）和流式输出动画
5. THE Hardware_Store 产品展示页 SHALL 采用大图沉浸式布局，突出产品外观和核心卖点，支持 360° 产品预览和规格对比
6. THE Platform SHALL 采用响应式设计，完整适配桌面端（1280px+）、平板端（768px-1279px）和移动端（<768px）三种屏幕尺寸
7. THE Platform 的所有交互动效 SHALL 保持流畅自然（60fps），页面切换使用平滑过渡动画，避免生硬跳转
8. THE Platform 的服务进度追踪界面 SHALL 采用可视化时间线设计，清晰展示订单从下单到完成的每个阶段状态
9. THE Platform 的数据仪表盘 SHALL 采用数据可视化图表（折线图、柱状图、饼图、热力图），支持交互式筛选和钻取
10. THE Platform SHALL 确保所有界面元素满足 WCAG 2.1 AA 级别的无障碍标准，包括：足够的颜色对比度、键盘导航支持、屏幕阅读器兼容和焦点指示器
11. THE Platform SHALL 提供统一的空状态、加载状态和错误状态设计，保持用户体验的一致性
12. THE Platform 的所有表单和操作 SHALL 提供即时反馈（成功提示、错误提示、加载指示器），响应时间不超过 200ms
