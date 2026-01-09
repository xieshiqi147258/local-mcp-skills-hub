# Implementation Plan: Skills View Optimization

## Overview

优化技能库视图，简化界面结构，移除冗余功能，统一与MCP配置页面的视觉风格，并确保设置中的路径配置能正确同步。

## Tasks

- [x] 1. 更新 SkillsStore 以支持从 localStorage 读取路径
  - [x] 1.1 添加 loadPathsFromStorage 方法从 localStorage 读取 skills_paths
    - 读取 localStorage 中的 skills_paths 键
    - 解析 JSON 并设置到 skillsPaths 状态
    - 如果有激活的路径，自动调用 loadSkills
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 编写路径持久化往返属性测试
    - **Property 1: 路径配置持久化往返一致性**
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. 简化 SkillsView 头部区域
  - [x] 2.1 重构头部组件，匹配 McpView 风格
    - 移除 browser-header 中的搜索框
    - 移除 FolderSearch 按钮
    - 添加 header-subtitle 副标题
    - 统一使用 panel-header 样式类
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 2.2 移除文件夹浏览器对话框相关代码
    - 删除 showFolderBrowser 状态
    - 删除 browserFolders、browserLoading 等状态
    - 删除 browseTo、selectFolder、handleBrowse 方法
    - 删除 browser-dialog 模板代码
    - _Requirements: 2.1, 2.2_

- [x] 3. 更新空状态组件
  - [x] 3.1 修改空状态显示跳转到设置的链接
    - 移除"选择文件夹"按钮
    - 添加 router-link 跳转到 /settings
    - 更新空状态文案
    - _Requirements: 1.3, 2.3_
  - [x] 3.2 移除空状态中的"创建技能"按钮
    - 删除空状态中的 btn-primary 创建按钮
    - 保留头部的新建按钮作为唯一入口
    - _Requirements: 5.1, 5.2_
  - [x] 3.3 编写单一新建按钮属性测试
    - **Property 2: 单一新建按钮约束**
    - **Validates: Requirements 5.1, 5.2**

- [x] 4. 优化技能列表样式
  - [x] 4.1 更新列表项样式以匹配 McpView 风格
    - 添加 cursor: pointer 到所有可点击项
    - 优化 hover 状态背景色
    - 优化 active 状态样式
    - 调整间距和圆角
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 4.2 优化当前路径显示条样式
    - 简化路径显示
    - 移除不必要的图标
    - _Requirements: 4.1_

- [x] 5. 集成 Settings 路径配置
  - [x] 5.1 在 SkillsView onMounted 中调用 loadPathsFromStorage
    - 组件挂载时自动加载路径配置
    - 如果有有效路径则加载技能列表
    - _Requirements: 1.2_
  - [x] 5.2 更新 i18n 添加新的翻译键
    - 添加 skills.subtitle 副标题
    - 添加 skills.goToSettings 跳转设置文案
    - 更新 skills.noFolderDesc 描述文案
    - _Requirements: 1.3, 2.3_

- [x] 6. Checkpoint - 确保所有功能正常
  - 确保所有测试通过，如有问题请询问用户

- [x] 7. 清理和优化
  - [x] 7.1 删除未使用的导入和变量
    - 移除 FolderSearch 图标导入
    - 移除未使用的状态变量
    - 移除未使用的方法
    - _Requirements: 2.1, 2.2_
  - [x] 7.2 优化 SCSS 样式
    - 删除未使用的样式类
    - 统一样式命名
    - _Requirements: 3.4, 4.1_
  - [x] 7.3 编写技能内容显示一致性属性测试
    - **Property 3: 技能内容显示一致性**
    - **Validates: Requirements 6.2**

- [x] 8. Final Checkpoint - 最终验证
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 所有任务都需要执行，包括测试任务
- 主要改动集中在 SkillsView.vue 和 skills.ts
- 需要同步更新 i18n 翻译文件
- 保持编辑器面板功能不变
