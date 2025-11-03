import React, { useEffect, useState, useRef } from "react";
import "./MainPage.css";
import { useProblem } from "../ProblemContext";
import { useResult } from "../ResultContext";
import CCodeEditor from './CCodeEditor';
import { Routes, Route, Link, useNavigate } from "react-router-dom";

///////메인 채팅창 페이지
export default function MainPage() {
  const navigate = useNavigate();
  const { message, setMessage, response, setResponse } = useProblem();
  const { hint, correct, timer } = useResult();// 힌트 사용한 횟수,정답 보낸 횟수 ,소요시간 세서 정답 페이지로 보내는 전역변수
  const [isLoading, setIsLoading] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(true); // 공지 열림/닫힘 상태
  const [problemText, setProblemText] = useState("");
  const [b, setB] = useState(3);            // 남은 힌트 횟수
  const [active, SetActive] = useState(false);
  const hintStepRef = useRef(0);

  const cleanText = (text) => {
    if (!text) return "";
    return text
      .replace(/\\n/g, '\n\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&le;/g, '≤')
      .replace(/&ge;/g, '≥')
      .replace(/"/g, '');
  };

  // 컴포넌트 마운트 시 한 번만  
  useEffect(() => {
    if (response?.isProblem) {
      setProblemText(cleanText(response.reply));
      setChat([]);                 // 채팅 비우기
      setB(3);                     // 힌트 남은 횟수 리셋
      SetActive(false);
      hintStepRef.current = 0;     // 힌트 단계 리셋
      hint.setHintnum(0);          // 전역 힌트 카운터 리셋
      correct.setCorrectnum(0);    // 전역 정답 시도수 리셋
      // timer 리셋이 필요하면 여기서 처리
    }
  }, [response, hint, correct]);
  // 빈 배열 = 처음 한 번만 실행
  // 정답/오답 판정 useEffect
  useEffect(() => {
  // response가 문자열인 경우
  // 또는 response가 객체인 경우
//채팅창 참조(채팅창화면 맨밑에 고정용)
    if (typeof response === 'string' && response.includes("정답입니다.")) {
      navigate("/CorrectPage");
    } else if (correct.Correctnum >= 3 && typeof response === 'string' && response.includes("틀렸습니다.")) {
      navigate("/WrongPage");
    }
    
    if (response?.reply?.includes("정답입니다.")) {
      navigate("/CorrectPage");
    } else if (correct.Correctnum >= 3 && response?.reply?.includes("틀렸습니다.")) {
      navigate("/WrongPage");
    }
  }, [response, correct.Correctnum, navigate]);

  const chatEndRef = useRef(null);

  // 말풍선 변수 (첫 문제는 제외하고 시작)
  const [Chat, setChat] = useState([]);

////// C/자바코드 인풋창 초기값 입력 
  // 언어 상태 추가
  // 초기 C 코드 템플릿
  const [language, setLanguage] = useState('c');
  const initialCCode = `#include <stdio.h>

int main() {
    
    return 0;
}`;

// 초기 Java 코드 템플릿
  const initialJavaCode = `public class Main {
    public static void main(String[] args) {
        
    }
}`;
  const [codeText, setCodeText] = useState(initialCCode);
  
  const handleReset = () => {
    setCodeText(language === 'c' ? initialCCode : initialJavaCode);
  };

  // 언어 변경 핸들러 추가
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // 언어 변경 시 해당 언어의 초기 템플릿으로  
    setCodeText(newLang === 'c' ? initialCCode : initialJavaCode);
  };

//메시지가 바뀔 때마다 스크롤 맨 아래로 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [Chat, isLoading]);

/////인풋텍스트 글자띄우기
  const handleChange = (e) => setCodeText(e.target.value);

//// 서버에 답장 보내기(힌트용)
  const sendRequest = async (userMessage) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testuser",
          message: userMessage,
        }),
      });
      const data = await res.json();
      setResponse(data);

       // AI 응답을 채팅에 추가
      const aiMessage = { 
        type: "left", 
        text: cleanText(data?.reply || JSON.stringify(data, null, 2))
      };
      setChat(prevChat => [...prevChat, aiMessage]);

    } catch (err) {
      console.error("API 호출 실패:", err);
      const errorMessage = { type: "left", text: "오류가 발생했습니다." };
      setChat(prevChat => [...prevChat, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

////////////   정답/틀림 답변 받는 함수   ////////////
  const RequestDiscrimination = async (userMessage, lang) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/answer/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testuser",
          problemId: 1,
          code: userMessage, // 매개변수로 받은 메시지 사용
          language: lang,
        }),
      });
      const data = await res.text();
      setResponse(data);//Context response값 업데이트

       // AI 응답을 채팅에 추가
      const aiMessage = { 
        type: "left", 
        text: cleanText(data?.reply || JSON.stringify(data, null, 2))
      };
      setChat(prevChat => [...prevChat, aiMessage]);
      //setSendCount(prev => prev + 1)

    } catch (err) {
      console.error("API 호출 실패:", err);
      const errorMessage = { type: "left", text: "오류가 발생했습니다." };
      setChat(prevChat => [...prevChat, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

//답장 오기 전까지 버튼 누르지 못하게 하는 bool변수
  const [isThinking, setThinking] = useState(false);
// 화면에 대화 출력
  
  const handleSend = async () => {
    if (codeText.trim() === "") return;
    //내 메시지 먼저 화면에 표시

    if(!isThinking){
      setThinking(true);
      const userMessage = codeText;
      
      //내가 보낸 코드를 화면에 표시
      const userChat = { type: "right", text: userMessage };
      setChat(prevChat => [...prevChat, userChat]);
      correct.setCorrectnum(prev => prev + 1);// 답변 횟수 올리기
      
      if(language == 'c'){
        await RequestDiscrimination(userMessage, "C");
      }else{
        await RequestDiscrimination(userMessage, "Java");
      }
      //서버에 보내고 응답 기다리기
      
      setThinking(false);// 풀어서 버튼 누를 수 잇게
    }
  };

///////힌트버튼 눌럿을 때 함수
  const setHint = async () => {
    if (hint.Hintnum > 3 || isThinking) return; // 3회 제한 & 중복 방지

    setThinking(true);
    setB(prevB => {
      const newB = prevB - 1;
      if (newB <= 0) SetActive(true);
      return newB;
    });
    const ShowHintNum = hint.Hintnum + 1;// 전역변수 값이 0이라 힌트 0으로 보내지니까 1을 올려서 보냄
    const userChat = { type: "right", text: `힌트 ${ShowHintNum}` };
    setChat(prev => [...prev, userChat]);
    
    await sendRequest(`힌트 ${ShowHintNum}`);
    hint.setHintnum(prev => prev + 1);//힌트 사용 횟수 올리기
    setThinking(false);
  };

  return (
    <div className="main-wrapper">
      <div className="chat-container">
        {/* 상단 고정 공지 */}
        <div className="notice-container">
          <div 
            className="notice-header" 
            onClick={() => setIsNoticeOpen(!isNoticeOpen)}
          >
            <div className="notice-title">
              <span className="notice-icon">📌</span>
              <span>문제</span>
            </div>
            <span className={`notice-arrow ${isNoticeOpen ? 'open' : ''}`}>▼</span>
          </div>
          
          {isNoticeOpen && (
            <div className="notice-content">
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{problemText}</p>
            </div>
          )}
        </div>

        {/* 일반 채팅 영역 */}
        <div className="chat-messages">
          {Chat.map((msg, idx) => (
            <div key={idx} className={`Chat-box ${msg.type}`}>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
            </div>
          ))}
          
          {isLoading && (
            <div className="Chat-box left loading-box">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="input-area">
        <p>아래에 답을 입력해보세요! </p>
        <CCodeEditor
          value={codeText}
          onChange={handleChange}
          onReset={handleReset}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
        <div className="SendBtn">
          <button className={`HintBtn ${active ? "active" : ""}`} onClick={setHint}>힌트(남은 횟수 {b})</button>
          <button className="HintBtn" onClick={handleSend}>답 전송</button>
        </div>
      </div>
    </div>
  );
}
