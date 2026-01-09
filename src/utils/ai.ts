// AI API 封装
const API_BASE = 'http://localhost:3002/api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  provider: 'anthropic' | 'openai' | 'ollama' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  ollamaUrl?: string;
  systemPrompt?: string;
}

export interface ToolCallResult {
  toolName: string;
  toolInput: Record<string, any>;
  result: {
    success: boolean;
    message?: string;
    error?: string;
    [key: string]: any;
  };
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCallResult[];
}

export interface DocsContent {
  category: string;
  content: string;
  references: { name: string; content: string }[];
}

// 检测消息中的关键词，返回匹配的文档类别
export async function detectDocsKeywords(message: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/docs/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.categories || [];
  } catch {
    return [];
  }
}

// 加载指定类别的文档内容
export async function loadDocsContent(category: string, includeReferences = false): Promise<DocsContent | null> {
  try {
    const url = `${API_BASE}/docs/${category}${includeReferences ? '?includeReferences=true' : ''}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// 根据用户消息自动加载相关文档作为上下文
export async function getDocsContext(message: string): Promise<string> {
  const categories = await detectDocsKeywords(message);
  if (categories.length === 0) return '';
  
  const docsContents: string[] = [];
  
  for (const category of categories) {
    const docs = await loadDocsContent(category, false);
    if (docs && docs.content) {
      docsContents.push(`\n\n--- ${category.toUpperCase()} Documentation ---\n${docs.content}`);
    }
  }
  
  return docsContents.join('\n');
}

// 从 localStorage 加载配置
export function loadAiConfig(): ChatOptions {
  return {
    provider: (localStorage.getItem('ai_provider') as ChatOptions['provider']) || 'anthropic',
    model: localStorage.getItem('ai_model') || 'claude-3-5-sonnet-20241022',
    apiKey: localStorage.getItem('ai_api_key') || '',
    baseUrl: localStorage.getItem('ai_base_url') || '',
    ollamaUrl: localStorage.getItem('ollama_url') || 'http://localhost:11434',
  };
}

// 通过后端代理调用 AI API（避免 CORS 和暴露 API Key）
export async function chat(
  messages: ChatMessage[],
  options?: Partial<ChatOptions>,
  permissions?: {
    createFolder: boolean;
    createFile: boolean;
    editFile: boolean;
    deleteFile: boolean;
  },
  workspacePath?: string // Requirement 17.2: Pass workspace path to backend
): Promise<ChatResponse> {
  const config = { ...loadAiConfig(), ...options };
  
  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, options: config, permissions, workspacePath })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI request failed');
  }

  const data = await response.json();
  return {
    content: data.content,
    toolCalls: data.toolCalls || []
  };
}

// SSE Event Types (Requirement 8.1, 21.2)
export type SSEEventType = 'text' | 'tool_call' | 'tool_result' | 'done' | 'error';

export interface SSETextEvent {
  type: 'text';
  content: string;
}

export interface SSEToolCallEvent {
  type: 'tool_call';
  id: string;
  name: string;
  params: Record<string, any>;
  status?: string;
}

export interface SSEToolResultEvent {
  type: 'tool_result';
  id: string;
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface SSEDoneEvent {
  type: 'done';
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
}

export type SSEEvent = SSETextEvent | SSEToolCallEvent | SSEToolResultEvent | SSEDoneEvent | SSEErrorEvent;

// Stream callback interface (Requirement 8.2, 8.3, 8.4)
export interface StreamCallbacks {
  onText?: (content: string) => void;
  onToolCall?: (toolCall: { id: string; name: string; params: Record<string, any>; status?: string }) => void;
  onToolResult?: (result: { id: string; success: boolean; message?: string; error?: string; data?: any }) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

// Stream controller for abort support (Requirement 8.5)
export interface StreamController {
  abort: () => void;
}

// 流式响应（SSE）- 使用回调方式 (Requirement 8.1, 8.2)
export function chatStreamWithCallbacks(
  messages: ChatMessage[],
  options: ChatOptions,
  callbacks: StreamCallbacks,
  permissions?: {
    createFolder: boolean;
    createFile: boolean;
    editFile: boolean;
    deleteFile: boolean;
  },
  workspacePath?: string
): StreamController {
  const config = { ...loadAiConfig(), ...options };
  const abortController = new AbortController();
  
  const processStream = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages, 
          options: config, 
          permissions, 
          workspacePath 
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Stream request failed' }));
        callbacks.onError?.(errorData.error || 'Stream request failed');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              
              switch (currentEvent) {
                case 'text':
                  callbacks.onText?.(parsed.content || '');
                  break;
                case 'tool_call':
                  callbacks.onToolCall?.({
                    id: parsed.id,
                    name: parsed.name,
                    params: parsed.params || parsed.input || {},
                    status: parsed.status || 'pending'
                  });
                  break;
                case 'tool_result':
                  callbacks.onToolResult?.({
                    id: parsed.id,
                    success: parsed.success,
                    message: parsed.message,
                    error: parsed.error,
                    data: parsed.data
                  });
                  break;
                case 'done':
                  callbacks.onDone?.();
                  break;
                case 'error':
                  callbacks.onError?.(parsed.message || 'Unknown error');
                  break;
              }
            } catch {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Stream was intentionally aborted
        callbacks.onDone?.();
      } else {
        callbacks.onError?.(error.message || 'Stream error');
      }
    }
  };

  // Start processing in background
  processStream();

  return {
    abort: () => abortController.abort()
  };
}

// Legacy generator-based streaming (kept for backward compatibility)
export async function* chatStream(
  messages: ChatMessage[],
  options: ChatOptions
): AsyncGenerator<string> {
  const response = await fetch(`${API_BASE}/ai/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, options })
  });

  if (!response.ok) {
    throw new Error('AI stream request failed');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) yield parsed.content;
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}
