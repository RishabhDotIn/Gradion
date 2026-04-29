import React, { useState, useEffect, useRef } from 'react';
import '../../styles/aiAnalysisSidebar.css';

const AIAnalysisSidebar = ({ isOpen, onClose, question, studentCode }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef(null);

  const startResizing = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 350 && newWidth < 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startInitialAnalysis();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startInitialAnalysis = () => {
    setIsAnalyzing(true);
    setMessages([
      { 
        role: 'assistant', 
        content: "Hello! I'm analyzing your submission for this question. Give me a moment to review your code..." 
      }
    ]);

    // Simulate AI thinking and analyzing
    setTimeout(() => {
      const analysisContent = `### Analysis of Question ${question.number}

I've reviewed your code for **"${question.title}"**. Here's my breakdown:

**Mistakes/Optimizations:**
1. **Redundant Comparisons:** You are checking for \`null\` inside the loop, which can be done once at the start.
2. **Time Complexity:** The current approach is $O(N \cdot M)$ where $N$ is the number of strings and $M$ is the length of the shortest string. This is good, but we can improve readability.
3. **Substring Operations:** Repeatedly calling \`.substring()\` creates many short-lived objects.

**Suggested Improved Code:**
\`\`\`java
public String longestCommonPrefix(String[] strs) {
    if (strs == null || strs.length == 0) return "";
    
    String prefix = strs[0];
    for (int i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) != 0) {
            prefix = prefix.substring(0, prefix.length() - 1);
            if (prefix.isEmpty()) return "";
        }
    }
    return prefix;
}
\`\`\`

**Pro Tip:** You could also sort the array and compare only the first and last strings to find the common prefix in some scenarios!

Do you have any questions about this explanation?`;

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: analysisContent }
      ]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setIsAnalyzing(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: "That's a great question! In Java, the \`indexOf\` method is quite efficient for this task because it's implemented using native code in many JVMs. Using it to check if a string starts with a prefix (by checking if the result is 0) is a common and performant pattern." 
        }
      ]);
      setIsAnalyzing(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className={`ai-sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div 
        className={`ai-sidebar-container ${isOpen ? 'open' : ''} ${isResizing ? 'resizing' : ''}`} 
        style={{ width: `${width}px` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="ai-resize-handle" onMouseDown={startResizing} />
        
        <div className="ai-sidebar-header">
          <div className="ai-header-title">
            <div className="ai-sparkle-icon">
              <i className="fas fa-magic"></i>
            </div>
            <span>AI Code Assistant</span>
          </div>
          <button className="ai-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="ai-messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`ai-message ${msg.role}`}>
              <div className="ai-message-avatar">
                {msg.role === 'assistant' ? <i className="fas fa-robot"></i> : <i className="fas fa-user"></i>}
              </div>
              <div className="ai-message-content">
                {msg.content.split('\n').map((line, i) => {
                  if (line.startsWith('###')) return <h3 key={i}>{line.replace('###', '')}</h3>;
                  if (line.startsWith('**')) return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
                  if (line.startsWith('\`\`\`')) return null; // Simple mock, won't handle full markdown blocks perfectly here
                  return <p key={i}>{line}</p>;
                })}
                {msg.content.includes('\`\`\`java') && (
                  <div className="ai-code-suggestion">
                    <div className="code-header">
                      <span>Suggested Solution (Java)</span>
                      <button onClick={() => navigator.clipboard.writeText(`public String longestCommonPrefix(String[] strs) {
    if (strs == null || strs.length == 0) return "";
    
    String prefix = strs[0];
    for (int i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) != 0) {
            prefix = prefix.substring(0, prefix.length() - 1);
            if (prefix.isEmpty()) return "";
        }
    }
    return prefix;
}`)}>
                        <i className="far fa-copy"></i>
                      </button>
                    </div>
                    <pre>
                      <code>{`public String longestCommonPrefix(String[] strs) {
    if (strs == null || strs.length == 0) return "";
    
    String prefix = strs[0];
    for (int i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) != 0) {
            prefix = prefix.substring(0, prefix.length() - 1);
            if (prefix.isEmpty()) return "";
        }
    }
    return prefix;
}`}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isAnalyzing && (
            <div className="ai-message assistant">
              <div className="ai-message-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="ai-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="ai-input-container" onSubmit={handleSendMessage}>
          <input 
            type="text" 
            placeholder="Ask a follow-up question..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" disabled={isAnalyzing}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAnalysisSidebar;
