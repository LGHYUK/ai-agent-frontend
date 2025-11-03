import React, { useState } from 'react';

/////////// C/Java 코드 개발 인풋 에디터 ///////////
export default function CodeEditor({ value, onChange, onReset, language, onLanguageChange }) {
  const handleKeyDown = (e) => {
    // Tab 키 처리
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = value.substring(0, start) + '    ' + value.substring(end);
      onChange({ target: { value: newCode } });
      
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
      return;
    }

    // Enter 키 처리 (자동 들여쓰기)
    if (e.key === 'Enter') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const lines = value.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      
      // 현재 줄의 들여쓰기 계산
      const indent = currentLine.match(/^\s*/)[0];
      
      // { 로 끝나는 경우 들여쓰기 추가
      const needExtraIndent = currentLine.trim().endsWith('{');
      const newIndent = needExtraIndent ? indent + '    ' : indent;
      
      const newCode = value.substring(0, start) + '\n' + newIndent + value.substring(start);
      onChange({ target: { value: newCode } });
      
      setTimeout(() => {
        const newPosition = start + 1 + newIndent.length;
        e.target.selectionStart = e.target.selectionEnd = newPosition;
      }, 0);
      return;
    }

    // } 입력 시 자동 들여쓰기 감소
    if (e.key === '}') {
      const start = e.target.selectionStart;
      const lines = value.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      
      // 현재 줄이 공백만 있고 들여쓰기가 있는 경우
      if (currentLine.match(/^\s+$/) && currentLine.length >= 4) {
        e.preventDefault();
        const newLine = currentLine.substring(4) + '}';
        const beforeCurrentLine = lines.slice(0, -1).join('\n');
        const afterCursor = value.substring(start);
        const newCode = (beforeCurrentLine ? beforeCurrentLine + '\n' : '') + newLine + afterCursor;
        
        onChange({ target: { value: newCode } });
        
        setTimeout(() => {
          const newPosition = start - 4 + 1;
          e.target.selectionStart = e.target.selectionEnd = newPosition;
        }, 0);
      }
    }
  };

  const lineCount = value.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // 언어별 색상 설정
  const themeColors = {
    c: {
      primary: 'rgba(102, 126, 234, 0.2)',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      bgLight: '#fafbff',
      bgLineNumber: '#f0f2ff',
      shadow: 'rgba(102, 126, 234, 0.15)',
      border: 'rgba(102, 126, 234, 0.1)',
      icon: 'C',
      name: 'C 언어'
    },
    java: {
      primary: 'rgba(234, 102, 102, 0.2)',
      gradient: 'linear-gradient(135deg, #ea6e6e 0%, #c44569 100%)',
      bgLight: '#fffbfb',
      bgLineNumber: '#fff0f0',
      shadow: 'rgba(234, 102, 102, 0.15)',
      border: 'rgba(234, 102, 102, 0.1)',
      icon: 'J',
      name: 'Java'
    }
  };

  const theme = themeColors[language];

  const styles = {
    container: {
      width: '100%',
      border: `1.5px solid ${theme.primary}`,
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: `0 8px 32px ${theme.shadow}`,
      background: '#ffffff',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: theme.gradient,
      padding: '14px 20px',
      borderBottom: 'none',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    languageIcon: {
      fontSize: '14px',
      fontWeight: '700',
      color: 'white',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
      width: '28px',
      height: '28px',
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(10px)',
      border: '1.5px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    select: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      border: '1.5px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '8px',
      padding: '6px 12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: '"Pretendard", sans-serif',
      backdropFilter: 'blur(10px)',
      outline: 'none',
    },
    headerRight: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    resetButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      border: '1.5px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '8px',
      padding: '6px 16px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: '"Pretendard", sans-serif',
      transition: 'all 0.2s ease',
      backdropFilter: 'blur(10px)',
    },
    editorWrapper: {
      display: 'flex',
      backgroundColor: theme.bgLight,
      border: 'none',
      height: '300px',
      overflow: 'hidden',
    },
    lineNumbers: {
      backgroundColor: theme.bgLineNumber,
      padding: '16px 12px',
      textAlign: 'right',
      color: '#9ca3af',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '13px',
      userSelect: 'none',
      borderRight: `1.5px solid ${theme.border}`,
      height: '300px',
      minWidth: '30px',
      lineHeight: '20px',
    },
    lineNumber: {
      lineHeight: '20px',
      fontWeight: '500',
    },
    textarea: {
      flex: 1,
      backgroundColor: 'transparent',
      color: '#1f2937',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '14px',
      padding: '16px 20px',
      resize: 'none',
      outline: 'none',
      lineHeight: '20px',
      border: 'none',
      tabSize: 4,
      overflowY: 'auto',
      overflowX: 'hidden',
    },
  };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.languageIcon}>{theme.icon}</span>
          <select 
            value={language} 
            onChange={onLanguageChange}
            style={styles.select}
          >
            <option value="c" style={{ color: '#000' }}>C 언어</option>
            <option value="java" style={{ color: '#000' }}>Java</option>
          </select>
        </div>
        <div style={styles.headerRight}>
          <button 
            style={styles.resetButton}
            onClick={onReset}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            초기화
          </button>
        </div>
      </div>

      {/* 에디터 */}
      <div style={styles.editorWrapper}>
        <div style={styles.lineNumbers}>
          {lineNumbers.map(num => (
            <div key={num} style={styles.lineNumber}>{num}</div>
          ))}
        </div>

        <textarea
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          style={styles.textarea}
          spellCheck={false}
          placeholder={`// ${theme.name} 코드를 입력하세요...`}
        />
      </div>
    </div>
  );
}