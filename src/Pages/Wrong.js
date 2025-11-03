import React from "react";
import { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import "./MainPage.css";
import { useProblem } from "../ProblemContext";
import { useResult } from "../ResultContext";
/////////////////////////////// 틀림 페이지 //////////////
export default function Wrong() {
const navigate = useNavigate();
  const { message, setMessage, response, setResponse } = useProblem();// 답변, 문제
  const { hint, correct, timer, level, resetAll } = useResult(); // 힌트 사용한 횟수,정답 보낸 횟수 ,소요시간 세서 정답 페이지로 보내는 전역변수
  
  //const [Hintnum, setHintnum] = useState(0);//힌트사용횟수
  //const [Correctnum, setCorrectnum] = useState(0);//정답 몇번만에 맞췃는지
  const [몇초, 몇초걸림] = useState(0);//몇초걸렷는지(백엔드에서 가져오기?)
  const [다음레벨, 다음레벨설정] = useState(0);//다음 문제 가져올 레벨(+1)

//문제 가져오기
  const sendRequest = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "username",
          message: "https://www.acmicpc.net/problem/1001",
        }),
      });

      const data = await res.json();
      setResponse(data); // Context에 저장
      navigate("/main"); // 결과 페이지로 이동
    } catch (err) {
      console.error("API 호출 실패:", err);
    }
  };


  ///버튼 누르면 다음 문제. (변수 숫자 모두 초기화)
  const NextLevel = async () => {
    //필요 변수 모두 초기화
    resetAll();
    //다음 문제 가져오기(일단 링크로 대체)
    await sendRequest();
    navigate("/main");
  }
  
  return (
        <div className="Maincontainer">
            <div className="mainText"> 
              <h1>틀렸습니다...</h1> 
              <p> (틀린 이유 한줄) </p>
              <p> 힌트 사용 횟수: {hint.Hintnum} &nbsp;&nbsp;&nbsp;&nbsp;  걸린 시간: {몇초}초 </p>
              <button className="EnterBtn" onClick={NextLevel}> 다시 풀기 </button>
              <button className="EnterBtn" onClick={NextLevel}> 다음 문제 (Level {다음레벨})</button>

            </div>

        {/* 첫 화면 */}
        
    </div>
  );
}