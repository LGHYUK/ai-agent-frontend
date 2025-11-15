import React, { createContext, useState, useContext } from "react";

//api 서버 답변과 메세지 담는 전역변수만들기.Context 생성
export const ResultContext = createContext();

// Provider 컴포넌트
export function ResultProvider({ children }) {
  const [Hintnum, setHintnum] = useState(1);//힌트사용횟수
  const [Correctnum, setCorrectnum] = useState(0);//정답 시도 횟수
  const [몇초, 몇초걸림] = useState(0);//소요시간(백엔드에서 가져오기?)
  const [selectedLevel, setSelectedLevel] = useState(1);  //레벨 설정
  const [다음레벨, 다음레벨설정] = useState(0);//다음 문제 가져올 레벨(+1)

  
///변수 길어지니까 요약 변수 만들기
  const hint = { Hintnum, setHintnum };
  const correct = { Correctnum, setCorrectnum };
  const timer = { 몇초, 몇초걸림 };
  const level = { 다음레벨, 다음레벨설정 };
  //다음 레벨 넘어가면 초기화할 변수들
  const resetAll =()=>{
    setHintnum(0);
    setCorrectnum(0);
    몇초걸림(0);
  }
  return (
    <ResultContext.Provider 
    value={{ 
      hint, 
      correct,
      timer,  
      level, resetAll, selectedLevel, setSelectedLevel
    }}>
      {children}
    </ResultContext.Provider>
  );
}

// 다른 컴포넌트에서 쉽게 접근하기 위한 훅
export function useResult() {
  return useContext(ResultContext);
}