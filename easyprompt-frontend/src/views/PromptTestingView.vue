<template>
  <div class="prompt-testing">
    <div class="header">
      <div class="header-content">
        <div class="header-text">
          <h2>提示词测试</h2>
          <p class="header-subtitle">测试和验证您的提示词，支持多种大模型API</p>
        </div>
        <button
          v-if="!hasActiveModels"
          class="btn btn-primary btn-large"
          @click="initializeDefaultModels"
        >
          <span class="btn-icon">+</span>
          初始化默认模型
        </button>
      </div>
    </div>

    <div class="testing-container">
      <!-- 左侧：模型选择和配置 -->
      <div class="model-panel">
        <div class="panel-header">
          <h3>模型配置</h3>
        </div>

        <div v-if="!hasActiveModels" class="empty-state">
          <div class="empty-icon">AI</div>
          <h4>暂无可用模型</h4>
          <p>请先初始化默认模型或添加自定义模型</p>
        </div>

        <div v-else class="model-content">
          <div class="model-selection">
            <label for="model-select">选择模型</label>
            <select
              id="model-select"
              v-model="selectedModelId"
              @change="onModelChange"
              class="form-select"
            >
              <option value="">请选择模型</option>
              <option
                v-for="model in activeModels"
                :key="model.id"
                :value="model.id"
              >
                {{ model.name }} ({{ model.provider }})
              </option>
            </select>
          </div>

          <div v-if="currentModel" class="model-details">
            <h4>模型参数</h4>
            <div class="detail-item">
              <label>提供商</label>
              <div class="input-wrapper">
                <input
                  type="text"
                  :value="currentModel.provider"
                  readonly
                  class="form-input readonly"
                />
                <div class="input-icon">P</div>
              </div>
            </div>
            <div class="detail-item">
              <label>模型</label>
              <div class="input-wrapper">
                <input
                  type="text"
                  :value="currentModel.model"
                  readonly
                  class="form-input readonly"
                />
                <div class="input-icon">M</div>
              </div>
            </div>
            <div class="detail-item">
              <label>温度</label>
              <div class="slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  v-model.number="temperature"
                  class="form-slider"
                />
                <span class="slider-value">{{ temperature }}</span>
              </div>
            </div>
            <div class="detail-item">
              <label>最大输出令牌</label>
              <div class="input-wrapper">
                <input
                  type="number"
                  min="1"
                  max="4096"
                  v-model.number="maxTokens"
                  class="form-input"
                />
                <div class="input-icon">T</div>
              </div>
            </div>
          </div>

          <div v-if="error" class="error-message">
            <div class="error-content">
              <span class="error-icon">!</span>
              <span>{{ error }}</span>
            </div>
            <button @click="clearError" class="btn-clear">清除</button>
          </div>
        </div>
      </div>

      <!-- 右侧：对话界面 -->
      <div class="chat-panel">
        <div class="panel-header">
          <h3>对话测试</h3>
          <button
            class="btn btn-secondary btn-small"
            @click="clearChatHistory"
            :disabled="chatHistory.length === 0"
          >
            <span class="btn-icon">×</span>
            清空对话
          </button>
        </div>

        <div class="chat-container">
          <div class="chat-messages" ref="chatMessagesRef">
            <div
              v-for="(message, index) in chatHistory"
              :key="index"
              :class="['message', message.role]"
            >
              <div class="message-header">
                <div class="role-badge">
                  <span class="role-icon">{{ message.role === 'user' ? 'U' : 'A' }}</span>
                  <span class="role-text">{{ message.role === 'user' ? '用户' : '助手' }}</span>
                </div>
                <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-content">
                <div class="message-text">{{ message.content }}</div>
              </div>
            </div>
            
            <div v-if="isLoading" class="message assistant">
              <div class="message-header">
                <div class="role-badge">
                  <span class="role-icon">A</span>
                  <span class="role-text">助手</span>
                </div>
                <span class="timestamp">正在生成...</span>
              </div>
              <div class="message-content loading">
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input">
            <textarea
              v-model="userInput"
              placeholder="输入您的提示词或问题..."
              rows="3"
              @keydown.enter.prevent="handleEnterKey"
              :disabled="isLoading || !selectedModelId"
              class="form-textarea"
            ></textarea>
            <div class="input-actions">
              <button
                class="btn btn-primary"
                @click="sendMessage"
                :disabled="isLoading || !selectedModelId || !userInput.trim()"
              >
                <span class="btn-icon">→</span>
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提示词模板 -->
    <div class="templates-section">
      <div class="section-header">
        <h3>提示词模板</h3>
        <p class="section-subtitle">快速使用预设的提示词模板进行测试</p>
      </div>
      <div class="template-grid">
        <div
          v-for="template in promptTemplates"
          :key="template.id"
          class="template-card"
          @click="useTemplate(template)"
        >
          <div class="template-header">
            <div class="template-icon">T</div>
            <h4>{{ template.name }}</h4>
          </div>
          <p>{{ template.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useAIModelsStore, type AIModel, type ChatMessage } from '@/stores/aiModels';

const aiModelsStore = useAIModelsStore();

// 响应式数据
const selectedModelId = ref('');
const temperature = ref(0.7);
const maxTokens = ref(2048);
const userInput = ref('');
const chatMessagesRef = ref<HTMLElement | null>(null);

// 计算属性
const activeModels = computed(() => aiModelsStore.activeModels);
const currentModel = computed(() => aiModelsStore.currentModel);
const chatHistory = computed(() => aiModelsStore.chatHistory);
const isLoading = computed(() => aiModelsStore.isLoading);
const error = computed(() => aiModelsStore.error);
const hasActiveModels = computed(() => aiModelsStore.hasActiveModels);

// 提示词模板
const promptTemplates = ref([
  {
    id: 1,
    name: '代码生成',
    description: '生成特定功能的代码',
    content: '请帮我生成一个{功能描述}的{编程语言}代码，要求：{具体要求}'
  },
  {
    id: 2,
    name: '文本总结',
    description: '总结长文本内容',
    content: '请帮我总结以下文本的主要内容：\n\n{文本内容}'
  },
  {
    id: 3,
    name: '创意写作',
    description: '创意故事或文案写作',
    content: '请帮我写一个关于{主题}的{文体}，风格要求：{风格要求}'
  },
  {
    id: 4,
    name: '问题解答',
    description: '解答特定领域问题',
    content: '作为{领域}专家，请解答以下问题：{问题}'
  },
  {
    id: 5,
    name: '翻译助手',
    description: '多语言翻译',
    content: '请将以下{源语言}内容翻译成{目标语言}：\n\n{待翻译内容}'
  }
]);

// 生命周期钩子
onMounted(async () => {
  await aiModelsStore.fetchActiveModels();
  if (activeModels.value.length > 0) {
    selectedModelId.value = activeModels.value[0]!.id;
    aiModelsStore.setCurrentModel(activeModels.value[0]!);
  }
});

const onModelChange = async () => {
  if (selectedModelId.value) {
    const model = await aiModelsStore.getModelById(selectedModelId.value);
    if (model) {
      aiModelsStore.setCurrentModel(model);
      temperature.value = model.temperature;
      maxTokens.value = model.maxTokens;
    }
  } else {
    aiModelsStore.setCurrentModel(null);
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim() || !selectedModelId.value || isLoading.value) {
    return;
  }

  const userMessage: ChatMessage = {
    role: 'user',
    content: userInput.value.trim()
  };

  aiModelsStore.addToChatHistory(userMessage);
  const currentInput = userInput.value;
  userInput.value = '';

  // 滚动到底部
  await nextTick();
  scrollToBottom();

  try {
    const response = await aiModelsStore.callModel({
      modelId: selectedModelId.value,
      messages: [...chatHistory.value, userMessage],
      temperature: temperature.value,
      maxTokens: maxTokens.value
    });

    if (response && response.choices && response.choices.length > 0) {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.choices[0].message.content
      };
      aiModelsStore.addToChatHistory(assistantMessage);
    }
  } catch (err) {
    console.error('Error calling model:', err);
  }

  // 滚动到底部
  await nextTick();
  scrollToBottom();
};

const handleEnterKey = (event: KeyboardEvent) => {
  if (!event.shiftKey) {
    sendMessage();
  }
};

const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

const clearChatHistory = () => {
  aiModelsStore.clearChatHistory();
};

const clearError = () => {
  aiModelsStore.clearError();
};

const initializeDefaultModels = async () => {
  await aiModelsStore.initializeDefaultModels();
  if (activeModels.value.length > 0) {
    selectedModelId.value = activeModels.value[0]!.id;
    aiModelsStore.setCurrentModel(activeModels.value[0]!);
  }
};

const useTemplate = (template: any) => {
  userInput.value = template.content;
};

const formatTime = (timestamp?: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};
</script>

<style scoped>
.prompt-testing {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-text h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
}

.header-subtitle {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
}

.testing-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.model-panel, .chat-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 600px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #e9ecef;
}

.panel-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.model-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  height: 100%;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-state h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.model-selection {
  margin-bottom: 1.5rem;
}

.model-selection label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.form-select {
  width: 100%;
  padding: 0.625rem 1.25rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.model-details {
  margin-top: 1.5rem;
}

.model-details h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.detail-item {
  margin-bottom: 1.25rem;
}

.detail-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.input-wrapper {
  position: relative;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-input.readonly {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 0.9rem;
  pointer-events: none;
  background: #f8f9fa;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.form-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e9ecef;
  outline: none;
  -webkit-appearance: none;
}

.form-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #1976D2;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.form-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #1976D2;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-value {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  color: #1976D2;
  background: #e3f2fd;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #fafafa;
}

.message {
  margin-bottom: 1.5rem;
}

.message.user {
  text-align: right;
}

.message.assistant {
  text-align: left;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.message.user .message-header {
  flex-direction: row-reverse;
}

.role-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.role-icon {
  font-size: 1rem;
}

.role-text {
  font-weight: 600;
  color: #495057;
  font-size: 0.85rem;
}

.timestamp {
  color: #6c757d;
  font-size: 0.75rem;
}

.message-content {
  display: inline-block;
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
}

.message.user .message-content {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
}

.message.assistant .message-content {
  background: white;
  color: #333;
}

.message.assistant .message-content.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #6c757d;
  animation: loading 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-input {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  background: white;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  resize: none;
  min-height: 80px;
  transition: all 0.2s ease;
  font-family: inherit;
  line-height: 1.5;
}

.form-textarea:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-large {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-icon {
  font-size: 1rem;
  font-weight: normal;
}

.btn-primary {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1565C0, #0D47A1);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(25, 118, 210, 0.35);
}

.btn-secondary {
  background: linear-gradient(135deg, #6C757D, #5A6268);
  color: white;
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.25);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5A6268, #495057);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(108, 117, 125, 0.35);
}

.btn-clear {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  background: rgba(220, 53, 69, 0.1);
}

.error-message {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid #dc3545;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  font-size: 1rem;
}

.templates-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-top: 2rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.section-subtitle {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.template-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  padding: 1.25rem;
}

.template-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #e0e0e0;
}

.template-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.template-icon {
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.template-card h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.template-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.85rem;
  line-height: 1.4;
}

@media (max-width: 1024px) {
  .testing-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .model-panel {
    order: 2;
    height: auto;
  }
  
  .chat-panel {
    order: 1;
    height: 500px;
  }
}

@media (max-width: 768px) {
  .prompt-testing {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .template-grid {
    grid-template-columns: 1fr;
  }
  
  .model-panel, .chat-panel {
    height: auto;
  }
  
  .chat-panel {
    height: 400px;
  }
}
</style>