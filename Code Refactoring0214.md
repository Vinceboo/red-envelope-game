# 代码重构方案文档 (Code Refactoring 0214)

**文档日期**: 2026-02-14
**相关 PRD**: `prd0214.md`

## 1. 重构目标
将现有的单文件游戏逻辑 (`App.jsx`) 拆解为模块化的“工具型”架构，支持“设置”与“游戏”两个核心视图的切换，并引入全局配置状态管理。

## 2. 核心架构调整

### 2.1. 视图路由 (View Routing)
目前 `App.jsx` 混合了所有逻辑。我们将采用条件渲染来实现简单的路由切换。

*   **当前结构**:
    ```jsx
    // App.jsx
    function App() {
      // 所有的状态 (gameState, envelopes, prizeAmount...)
      return ( <div>...所有的组件...</div> )
    }
    ```

*   **目标结构**:
    ```jsx
    // App.jsx (Top Level)
    function App() {
      const [config, setConfig] = useState(DEFAULT_CONFIG); // 全局配置
      const [view, setView] = useState('setup'); // 'setup' | 'game'

      return (
        <Layout>
          <GlobalEffects /> (Music, Fireworks, Sparkles)
          {view === 'setup' ? (
             <SetupScreen onStart={handleStart} />
          ) : (
             <GameScreen config={config} onBack={() => setView('setup')} />
          )}
        </Layout>
      )
    }
    ```

### 2.2. 状态管理 (State Management)
需要一个新的配置对象 `features` 来传递用户设置。

```javascript
const defaultConfig = {
  count: 5,               // 红包数量 (2-10)
  mode: 'random',         // 'random' (拼手气) | 'custom' (在自定义)
  totalAmount: 100,       // 总金额 (用于 random 模式)
  customAmounts: [],      // 自定义金额列表 (用于 custom 模式)
  coverStyle: 'default',  // 封面样式
};
```

## 3. 组件拆分 (Component Split)

### 3.1. 新增 `src/components/SetupScreen.jsx`
*   **职责**: 负责用户交互，收集配置信息。
*   **UI 元素**:
    *   `<Slider />` 或 `<NumberInput />`: 选择红包个数。
    *   `<Tab />`: 切换“拼手气”或“普通红包”模式。
    *   `<Input />`: 输入金额。
    *   `<CoverSelector />`: 封面选择器（预留）。
    *   `<Button />`: "塞钱进红包" (Start Game)。

### 3.2. 封装 `src/components/GameScreen.jsx`
*   **职责**: 承载原有的游戏逻辑，但不再自己生成随机数，而是根据传入的 `config` 初始化。
*   **改动**:
    *   移除 `generateEnvelopes` 中的硬编码逻辑。
    *   新增 `initGame(config)` 函数，在组件挂载时根据配置生成红包数据。
    *   增加“返回设置”按钮。

### 3.3. 工具库 `src/utils/hongbaoLogic.js`
将核心算法抽离，确保逻辑纯净。

*   `generateRandomAmounts(total, count)`: 二倍均值法实现。
*   `validateConfig(config)`: 校验金额是否合法。

## 4. 文件结构变动

```text
src/
├── components/
│   ├── FireworksBackground.jsx  (保持不变)
│   ├── MusicPlayer.jsx          (保持不变)
│   ├── RedEnvelope.jsx          (保持不变)
│   ├── Setup/                   (新增目录)
│   │   ├── SetupScreen.jsx      (主设置页)
│   │   ├── AmountInput.jsx      (金额输入组件)
│   │   └── CoverSelector.jsx    (封面选择组件)
│   └── Game/                    (新增目录)
│       ├── GameScreen.jsx       (原 App.jsx 逻辑下沉)
│       └── ResultModal.jsx      (保持不变)
├── utils/
│   ├── gameLogic.js             (原有逻辑，需修改)
│   └── hongbaoAlgo.js           (新增算法)
└── App.jsx                      (重构为容器组件)
```

## 5. 开发步骤 (Implementation Steps)

1.  **Step 1: 算法实现**: 编写 `hongbaoAlgo.js`，实现拼手气和普通红包的金额生成逻辑，并编写简单的测试验证。
2.  **Step 2: 容器重构**: 创建 `GameScreen.jsx`，将 `App.jsx` 中的游戏逻辑搬运过去，确保 `App.jsx` 变空变轻。
3.  **Step 3: 设置页开发**: 实现 `SetupScreen.jsx`，完成 UI 布局和表单状态绑定。
4.  **Step 4: 联调**: 在 `App.jsx` 中串联两个页面，测试数据流转（设置 -> 生成 -> 游戏 -> 结果）。
5.  **Step 5: 样式优化**: 统一 UI 风格，确保转场流畅。

## 6. 注意事项
*   **金额精度**: 所有金额计算需小心浮点数问题，建议在计算时转为“分”（整数），显示时转为“元”。
*   **数据持久化**: 暂时不做本地存储，刷新页面后重置，后续可优化。
