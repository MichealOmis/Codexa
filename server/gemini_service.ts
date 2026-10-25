import { GoogleGenAI } from '@google/genai';

export interface ExplainRequest {
  topic_title?: string;
  concept_name?: string;
  student_code?: string;
  error_category?: string;
  error_message?: string;
  mode?: 'concept' | 'error_debug' | 'code_review';
}

export interface ExplainResponse {
  explanation: string;
  pedagogical_tips: string[];
  suggested_debug_question: string;
  is_ai_generated: boolean;
  disclaimer: string;
}

const FALLBACK_EXPLANATIONS: Record<string, { explanation: string; tips: string[]; question: string }> = {
  SyntaxError: {
    explanation: "A SyntaxError indicates that the Python parser reached a token that does not conform to the grammar of Python. Common causes include unclosed quotes or parentheses, or omitting the colon ':' after an if, for, while, or def statement.",
    tips: [
      "Check line numbers reported in the traceback carefully.",
      "Inspect the character immediately preceding the indicated line.",
      "Ensure all brackets '()', '[]', '{}' and quotes matching pairs."
    ],
    question: "Did you remember to place a colon ':' at the end of your block header statement?"
  },
  IndentationError: {
    explanation: "Python uses whitespace indentation (4 spaces per level) instead of curly braces to delimit code blocks. Inconsistent indentation breaks the structure.",
    tips: [
      "Use 4 spaces for every level of indentation.",
      "Avoid mixing tabs and spaces in the same file.",
      "Check that every line inside an if, loop, or function is indented equally."
    ],
    question: "Are all the statements intended to execute inside this block indented with exactly 4 spaces?"
  },
  NameError: {
    explanation: "A NameError means the interpreter encountered an identifier that has not been defined in the current scope. This is usually caused by a typo or using a variable before assigning it.",
    tips: [
      "Double check exact spelling and lowercase/uppercase characters.",
      "Ensure the variable assignment happens before you access it.",
      "Verify that functions are defined above where they are called."
    ],
    question: "Is the variable or function name spelled identically to where it was first defined?"
  },
  TypeError: {
    explanation: "A TypeError happens when an operation is attempted on an incompatible data type, such as attempting arithmetic on a string, or indexing a number.",
    tips: [
      "Check the type of each variable involved with type(variable).",
      "Convert strings to numbers with int() or float() before math.",
      "Convert numbers to strings with str() before concatenating with '+'."
    ],
    question: "What are the exact types of the variables involved in this operation?"
  },
  IndexError: {
    explanation: "An IndexError occurs when attempting to access an index outside the valid range of a sequence (list or string). Remember that Python indexing starts at 0 and ends at len(seq) - 1.",
    tips: [
      "Remember: for a list of length N, valid indices are 0 to N-1.",
      "An empty list has no index 0.",
      "Check your loop boundary or range() parameters."
    ],
    question: "What is len(your_collection), and is your index strictly less than that length?"
  },
  TimeLimitExceeded: {
    explanation: "Your code exceeded the execution time limit (2.0s). This almost always indicates an infinite loop where the while loop termination condition is never reached.",
    tips: [
      "Check that your loop variable changes during every iteration.",
      "Verify that the condition will eventually evaluate to False.",
      "Add print() statements in the loop to inspect variable progression."
    ],
    question: "Does your loop body modify the condition variable so that it is guaranteed to terminate?"
  },
  default: {
    explanation: "Python programming requires careful step-by-step thinking. Break your problem down into inputs, computations, and return values.",
    tips: [
      "Work through a small example with pencil and paper first.",
      "Print intermediate variables to inspect state.",
      "Test edge cases like empty collections, negative numbers, and zeroes."
    ],
    question: "What specific input is causing unexpected behaviour, and what did you expect the state to be?"
  }
};

export async function generatePedagogicalExplanation(req: ExplainRequest): Promise<ExplainResponse> {
  const disclaimer = "AI Pedagogical Assistant: This supplementary explanation is designed to support your understanding. The deterministic assessment engine remains the authoritative source of test results and grades.";
  const apiKey = process.env.GEMINI_API_KEY;

  const category = req.error_category || 'default';
  const fallback = FALLBACK_EXPLANATIONS[category] || FALLBACK_EXPLANATIONS.default;

  if (!apiKey || apiKey.trim() === '') {
    return {
      explanation: fallback.explanation,
      pedagogical_tips: fallback.tips,
      suggested_debug_question: fallback.question,
      is_ai_generated: false,
      disclaimer: "Offline Pedagogical Rule Engine: Using deterministic tutoring feedback (Gemini API key not configured)."
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a supportive, educational Intelligent Tutoring System assistant for introductory Python programming.
Provide pedagogical guidance for a beginner student without giving away the complete exercise solution.

Context:
Topic: ${req.topic_title || 'Introductory Python'}
Concept: ${req.concept_name || 'Programming Fundamentals'}
Error Category: ${req.error_category || 'General Concept'}
Error Details: ${req.error_message || 'None'}
Student Code snippet:
\`\`\`python
${sanitizeCodeSnippet(req.student_code)}
\`\`\`

Rules:
1. Explain the misconception or error in simple, accessible, supportive terms.
2. Provide 2-3 actionable pedagogical tips.
3. Formulate one reflective debugging question that guides the student to find the mistake themselves.
4. DO NOT provide the full worked answer or solve the exercise completely. Scaffolding only.
5. Return strictly a JSON object with keys: "explanation" (string), "pedagogical_tips" (array of strings), "suggested_debug_question" (string).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);

    return {
      explanation: parsed.explanation || fallback.explanation,
      pedagogical_tips: parsed.pedagogical_tips || fallback.tips,
      suggested_debug_question: parsed.suggested_debug_question || fallback.question,
      is_ai_generated: true,
      disclaimer
    };
  } catch (err: any) {
    // Graceful fallback to deterministic tutoring advice
    return {
      explanation: fallback.explanation,
      pedagogical_tips: fallback.tips,
      suggested_debug_question: fallback.question,
      is_ai_generated: false,
      disclaimer: `Offline Rule Engine fallback (${err.message || 'AI service transient notice'})`
    };
  }
}

function sanitizeCodeSnippet(code?: string): string {
  if (!code) return '# No code provided';
  return code.slice(0, 1000);
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  taskType?: 'general' | 'fast' | 'complex';
  context?: {
    topicName?: string;
    currentCode?: string;
  };
}

export interface ChatResponse {
  message: string;
  modelUsed: string;
  isAiGenerated: boolean;
}

export async function handleMultiTurnChat(req: ChatRequest): Promise<ChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  const taskType = req.taskType || 'general';

  // Model selection as requested:
  // - gemini-3.1-pro-preview for complex tasks
  // - gemini-3.5-flash for general tasks
  // - gemini-3.1-flash-lite for fast tasks
  let modelName = 'gemini-3.5-flash';
  let systemInstruction = "You are Codexa AI Coach, an intelligent tutoring system mentor for introductory Python. Guide the student using supportive Socratic dialogue, intuitive conceptual examples, and diagnostic questions. Do not write complete solutions to exercises directly; instead, guide the student to discover the answers.";

  if (taskType === 'complex') {
    modelName = 'gemini-3.1-pro-preview';
    systemInstruction = "You are Codexa Advanced Code & Algorithm Reviewer. Deeply examine Python code structure, execution trace, edge conditions, boundary limits, and algorithmic decomposition for introductory programming students.";
  } else if (taskType === 'fast') {
    modelName = 'gemini-3.1-flash-lite';
    systemInstruction = "You are Codexa Fast Helper. Provide direct, concise, and accurate explanations of Python syntax, errors, and built-in functions in under 3 sentences.";
  }

  if (req.context?.topicName) {
    systemInstruction += ` Currently discussing Module: ${req.context.topicName}.`;
  }
  if (req.context?.currentCode) {
    systemInstruction += ` Student's active editor code:\n\`\`\`python\n${req.context.currentCode.slice(0, 800)}\n\`\`\``;
  }

  if (!apiKey || apiKey.trim() === '') {
    const lastUserMsg = req.messages.filter(m => m.role === 'user').pop()?.content.toLowerCase() || '';
    let fallbackReply = "Hello! I am your Codexa AI Coach. In this Python learning environment, we focus on understanding concepts step by step. What concept or exercise can I help guide you through?";

    if (lastUserMsg.includes('loop') || lastUserMsg.includes('while') || lastUserMsg.includes('for')) {
      fallbackReply = "Loops allow you to repeat actions. Use `for` loops with `range()` when you know how many times to repeat, and `while` loops when you need to repeat until a boolean condition turns False. Remember to ensure while loop conditions change during each iteration to avoid infinite loops!";
    } else if (lastUserMsg.includes('type') || lastUserMsg.includes('int') || lastUserMsg.includes('str')) {
      fallbackReply = "In Python, combining strings and numbers requires explicit type conversion. Use `int('10')` to convert text to an integer, or `str(42)` to convert a number to text before concatenating with `+`!";
    } else if (lastUserMsg.includes('return') || lastUserMsg.includes('print')) {
      fallbackReply = "Great question! `print()` displays text on the terminal screen for humans to see, but produces `None`. In contrast, `return` passes a calculated value back from a function to whoever called it so it can be evaluated, stored, or tested!";
    } else if (lastUserMsg.includes('syntax') || lastUserMsg.includes('error')) {
      fallbackReply = "When debugging syntax errors, check that headers like `if`, `for`, `while`, and `def` end with a colon `:`, all quotes and parentheses are closed, and indentation uses consistent 4 spaces.";
    }

    return {
      message: fallbackReply,
      modelUsed: `${modelName} (Deterministic Tutoring Fallback)`,
      isAiGenerated: false
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const formattedMessages = req.messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: formattedMessages,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    return {
      message: response.text?.trim() || 'No response generated.',
      modelUsed: modelName,
      isAiGenerated: true
    };
  } catch (err: any) {
    return {
      message: `I encountered a transient connection notice: ${err.message || 'Please check your network'}. Remember you can always test your code directly in the isolated sandbox!`,
      modelUsed: `${modelName} (Notice Fallback)`,
      isAiGenerated: false
    };
  }
}

